"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TypeNavigation } from "@/components/interview/type-navigation"
import { InterviewChat } from "@/components/interview/interview-chat"
import { InterviewLoadingInfo } from "@/components/interview/interview-loading-info"
import { Building2, MapPin, Loader2, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { Timestamp } from "firebase/firestore"
import { getInterviewTypeLabel } from "@/lib/prompts/interview"
import type {
  InterviewSession,
  InterviewType,
  InterviewChatMessage,
  InterviewQuestion,
  InterviewQuestionType,
  InterviewFeedback,
  InterviewTypeConversation
} from "@/lib/types"

const questionTypes: InterviewQuestionType[] = ['technical', 'behavioral', 'company_fit', 'resume_based']

// Helper function to create empty conversation structure
const createEmptyConversation = (): InterviewTypeConversation => ({
  messages: [],
  questions: [],
  tipsShown: false
})

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [session, setSession] = useState<InterviewSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentType, setCurrentType] = useState<InterviewType>('interview_tips')

  // Current type's conversation data (loaded from conversationsByType[currentType])
  const [messages, setMessages] = useState<InterviewChatMessage[]>([])
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [tipsShown, setTipsShown] = useState(false)

  const [waitingForAnswer, setWaitingForAnswer] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Load session
  useEffect(() => {
    if (user) {
      loadSession()
    }
  }, [user, sessionId])

  const loadSession = async () => {
    try {
      setLoading(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await fetch(`/api/interview-sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Session Not Found",
            description: "This interview session doesn't exist",
            variant: "destructive"
          })
          router.push('/interview-prep')
          return
        }
        throw new Error('Failed to load session')
      }

      const data = await response.json()
      const loadedSession = data.session
      setSession(loadedSession)

      const activeType = loadedSession.currentType || 'interview_tips'
      setCurrentType(activeType)

      // Load current type's conversation data
      const currentConversation = loadedSession.conversationsByType?.[activeType] || createEmptyConversation()
      setMessages(currentConversation.messages || [])
      setQuestions(currentConversation.questions || [])
      setTipsShown(currentConversation.tipsShown || false)

      // Auto-show tips if not shown yet (immediate display, no greeting)
      if (!currentConversation.tipsShown) {
        // Pass the current messages to avoid state timing issues
        await showTypeTips(activeType, currentConversation.messages || [])
      }

      // Check if waiting for answer in current type
      const lastQuestion = currentConversation.questions?.[currentConversation.questions.length - 1]
      if (lastQuestion && !lastQuestion.userAnswer) {
        setWaitingForAnswer(true)
        setCurrentQuestion(lastQuestion)
      }
    } catch (error) {
      console.error('Error loading session:', error)
      toast({
        title: "Error",
        description: "Failed to load interview session",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const sendGreeting = async (
    sessionData: InterviewSession,
    typeForGreeting: InterviewType,
    currentMessages: InterviewChatMessage[]
  ) => {
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'greeting',
          jobTitle: sessionData.jobTitle,
          company: sessionData.company,
          jobDescription: sessionData.jobDescription,
          resume: sessionData.resume,
          interviewType: typeForGreeting
        })
      })

      if (!response.ok) throw new Error('Failed to get greeting')

      const data = await response.json()

      const aiMessage: InterviewChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'ai',
        content: data.response,
        timestamp: Timestamp.now()
      }

      // Use the passed currentMessages instead of hardcoding to avoid overwriting
      const updatedMessages = [...currentMessages, aiMessage]
      setMessages(updatedMessages)

      // Save to database (current type's conversation)
      await updateSessionConversation(typeForGreeting, {
        messages: updatedMessages
      })
    } catch (error) {
      console.error('Error sending greeting:', error)
    }
  }

  const handleTypeChange = async (newType: InterviewType) => {
    if (!session || newType === currentType) return

    try {
      // Save current type's conversation state
      await updateSessionConversation(currentType, {
        messages,
        questions,
        tipsShown
      })

      // Switch to new type
      setCurrentType(newType)

      // Load new type's conversation
      const newConversation = session.conversationsByType?.[newType] || createEmptyConversation()
      setMessages(newConversation.messages || [])
      setQuestions(newConversation.questions || [])
      setTipsShown(newConversation.tipsShown || false)

      // Update session's currentType
      await updateSession({ currentType: newType })

      // Reset answer waiting state
      setWaitingForAnswer(false)
      setCurrentQuestion(null)

      // Check if new type has unanswered question
      const lastQuestion = newConversation.questions?.[newConversation.questions.length - 1]
      if (lastQuestion && !lastQuestion.userAnswer) {
        setWaitingForAnswer(true)
        setCurrentQuestion(lastQuestion)
      }

      // Auto-show tips if first time visiting this type (for ALL types)
      // Pass the loaded messages directly to avoid state timing issues
      if (!newConversation.tipsShown) {
        await showTypeTips(newType, newConversation.messages || [])
      }
    } catch (error) {
      console.error('Error changing type:', error)
      toast({
        title: "Error",
        description: "Failed to switch interview type",
        variant: "destructive"
      })
    }
  }

  const showTypeTips = async (interviewType: InterviewType, currentMessages: InterviewChatMessage[]) => {
    if (!session) return

    try {
      setIsProcessing(true)

      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'tips',
          interviewType,
          jobTitle: session.jobTitle,
          company: session.company,
          jobDescription: session.jobDescription,
          resume: session.resume
        })
      })

      if (!response.ok) throw new Error('Failed to get tips')

      const data = await response.json()

      const aiMessage: InterviewChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'ai',
        content: data.response,
        timestamp: Timestamp.now()
      }

      // Use the passed currentMessages instead of state to avoid timing issues
      const updatedMessages = [...currentMessages, aiMessage]
      setMessages(updatedMessages)
      setTipsShown(true)

      await updateSessionConversation(interviewType, {
        messages: updatedMessages,
        tipsShown: true
      })
    } catch (error) {
      console.error('Error showing tips:', error)
      toast({
        title: "Error",
        description: "Failed to load interview tips",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!session) return

    const userMessage: InterviewChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: Timestamp.now()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    try {
      setIsProcessing(true)

      // If we're waiting for an answer, analyze it
      if (waitingForAnswer && currentQuestion) {
        await analyzeAnswer(message, updatedMessages)
        return
      }

      // Otherwise, handle based on interview type
      if (currentType === 'interview_tips') {
        await handleTipsMode(message, updatedMessages)
      } else {
        // In practice mode, user shouldn't send messages directly
        // Questions are generated automatically
        toast({
          title: "Info",
          description: "In practice mode, answer the questions as they appear",
          variant: "default"
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to process your message",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTipsMode = async (message: string, currentMessages: InterviewChatMessage[]) => {
    if (!session) return

    const token = await auth.currentUser?.getIdToken()
    if (!token) return

    const response = await fetch('/api/interview/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'tips',
        mode: 'tips',
        message,
        interviewType: currentType,
        jobTitle: session.jobTitle,
        company: session.company,
        jobDescription: session.jobDescription,
        resume: session.resume,
        conversationHistory: currentMessages.slice(-6).map(m => ({
          type: m.type,
          content: m.content
        }))
      })
    })

    if (!response.ok) throw new Error('Failed to get tips')

    const data = await response.json()

    const aiMessage: InterviewChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'ai',
      content: data.response,
      timestamp: Timestamp.now()
    }

    const newMessages = [...currentMessages, aiMessage]
    setMessages(newMessages)

    await updateSessionConversation(currentType, { messages: newMessages })
  }

  const generateQuestion = async () => {
    if (!session) return

    // Don't generate questions in interview_tips mode
    if (currentType === 'interview_tips') return

    try {
      setIsProcessing(true)

      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'generate_question_by_type',
          interviewType: currentType,
          jobTitle: session.jobTitle,
          company: session.company,
          jobDescription: session.jobDescription,
          resume: session.resume,
          previousQuestions: questions.map(q => q.question)
        })
      })

      if (!response.ok) throw new Error('Failed to generate question')

      const data = await response.json()

      const newQuestion: InterviewQuestion = {
        id: `q-${Date.now()}`,
        type: data.data?.type || currentType,
        question: data.data?.question || data.response,
        askedAt: Timestamp.now()
      }

      const aiMessage: InterviewChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'ai',
        content: newQuestion.question,
        timestamp: Timestamp.now(),
        questionId: newQuestion.id
      }

      const newMessages = [...messages, aiMessage]
      const newQuestions = [...questions, newQuestion]

      setMessages(newMessages)
      setQuestions(newQuestions)
      setCurrentQuestion(newQuestion)
      setWaitingForAnswer(true)

      await updateSessionConversation(currentType, {
        messages: newMessages,
        questions: newQuestions
      })
    } catch (error) {
      console.error('Error generating question:', error)
      toast({
        title: "Error",
        description: "Failed to generate question",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const analyzeAnswer = async (answer: string, currentMessages: InterviewChatMessage[]) => {
    if (!session || !currentQuestion) return

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'analyze_answer',
          mode: 'practice',
          question: currentQuestion.question,
          questionType: currentQuestion.type,
          userAnswer: answer,
          jobTitle: session.jobTitle,
          company: session.company,
          jobDescription: session.jobDescription,
          resume: session.resume
        })
      })

      if (!response.ok) throw new Error('Failed to analyze answer')

      const data = await response.json()
      const feedback: InterviewFeedback = data.data

      // Update question with answer and feedback
      const updatedQuestions = questions.map(q =>
        q.id === currentQuestion.id
          ? {
              ...q,
              userAnswer: answer,
              feedback,
              answeredAt: Timestamp.now()
            }
          : q
      )

      // Add feedback message
      const feedbackMessage: InterviewChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'ai',
        content: `Great! Here's your feedback:\n\n**Rating:** ${feedback.rating}\n**Score:** ${feedback.score}/10\n\nReady for the next question?`,
        timestamp: Timestamp.now(),
        questionId: currentQuestion.id
      }

      const newMessages = [...currentMessages, feedbackMessage]

      setQuestions(updatedQuestions)
      setMessages(newMessages)
      setWaitingForAnswer(false)
      setCurrentQuestion(null)

      await updateSessionConversation(currentType, {
        messages: newMessages,
        questions: updatedQuestions
      })

      // Calculate average score across all types
      const allQuestions: InterviewQuestion[] = []
      if (session.conversationsByType) {
        Object.values(session.conversationsByType).forEach(conv => {
          allQuestions.push(...(conv.questions || []))
        })
      }
      const answeredQuestions = allQuestions.filter(q => q.feedback)
      const totalScore = answeredQuestions.length > 0
        ? answeredQuestions.reduce((sum, q) => sum + (q.feedback?.score || 0), 0) / answeredQuestions.length
        : undefined

      await updateSession({ totalScore })

      // Auto-generate next question after 2 seconds
      setTimeout(() => {
        generateQuestion()
      }, 2000)
    } catch (error) {
      console.error('Error analyzing answer:', error)
      toast({
        title: "Error",
        description: "Failed to analyze your answer",
        variant: "destructive"
      })
    }
  }

  // Update a specific type's conversation data
  const updateSessionConversation = async (
    type: InterviewType,
    updates: Partial<InterviewTypeConversation>
  ) => {
    if (!session) return

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      // Get current conversation for this type or create empty
      const currentConversation = session.conversationsByType?.[type] || createEmptyConversation()

      // Merge updates
      const updatedConversation: InterviewTypeConversation = {
        ...currentConversation,
        ...updates,
        lastAccessedAt: Timestamp.now()
      }

      // Update full conversationsByType object
      const updatedConversationsByType = {
        ...session.conversationsByType,
        [type]: updatedConversation
      }

      const response = await fetch(`/api/interview-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationsByType: updatedConversationsByType
        })
      })

      if (!response.ok) throw new Error('Failed to update session conversation')

      const data = await response.json()
      setSession(data.session)
    } catch (error) {
      console.error('Error updating session conversation:', error)
    }
  }

  const updateSession = async (updates: Partial<InterviewSession>) => {
    if (!session) return

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await fetch(`/api/interview-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Failed to update session')

      const data = await response.json()
      setSession(data.session)
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const handleCompleteSession = async () => {
    if (!confirm('Are you sure you want to end this interview practice session?')) {
      return
    }

    try {
      await updateSession({
        status: 'completed',
        completedAt: Timestamp.now()
      })

      toast({
        title: "Session Completed",
        description: "Your interview practice session has been saved"
      })

      router.push('/interview-prep')
    } catch (error) {
      console.error('Error completing session:', error)
      toast({
        title: "Error",
        description: "Failed to complete session",
        variant: "destructive"
      })
    }
  }

  if (authLoading || loading || !user) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </>
    )
  }

  if (!session) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-16 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This interview session doesn't exist or has been deleted
              </p>
              <Button onClick={() => router.push('/interview-prep')}>
                Back to Sessions
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-[1800px]">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 min-h-[calc(100vh-180px)]">
          {/* Left Panel - Job Context */}
          <div className="space-y-4 overflow-y-auto">
            {/* Session Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{session.jobTitle}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{session.company}</span>
                    </div>
                  </div>
                  <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                    {session.status === 'active' ? 'Active' : 'Completed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {session.conversationsByType && (
                  <TypeNavigation
                    currentType={currentType}
                    conversationsByType={session.conversationsByType}
                    onTypeChange={handleTypeChange}
                    disabled={isProcessing || session.status === 'completed'}
                  />
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Questions</p>
                    <p className="text-2xl font-bold">{questions.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Answered</p>
                    <p className="text-2xl font-bold">
                      {questions.filter(q => q.userAnswer).length}
                    </p>
                  </div>
                </div>
                {session.totalScore !== undefined && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                    <p className="text-3xl font-bold text-primary">
                      {session.totalScore.toFixed(1)}/10
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Description */}
            {session.jobDescription && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                    {session.jobDescription.substring(0, 800)}
                    {session.jobDescription.length > 800 && '...'}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {session.status === 'active' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCompleteSession}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Session
              </Button>
            )}
          </div>

          {/* Right Panel - Chat Interface */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {getInterviewTypeLabel(currentType)}
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="flex-1 p-0">
              {isProcessing && messages.length === 0 ? (
                <InterviewLoadingInfo message="Preparing your interview session..." />
              ) : (
                <InterviewChat
                  messages={messages}
                  questions={questions}
                  onSendMessage={handleSendMessage}
                  isProcessing={isProcessing}
                  disabled={session.status === 'completed'}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

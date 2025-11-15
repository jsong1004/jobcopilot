"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionCard } from "@/components/interview/session-card"
import { JobSelector } from "@/components/interview/job-selector"
import { Plus, Loader2, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import type { InterviewSession, SavedJob } from "@/lib/types"

export default function InterviewPrepPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [jobsLoading, setJobsLoading] = useState(false)
  const [showJobSelector, setShowJobSelector] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Fetch sessions
  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await fetch('/api/interview-sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch sessions')

      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast({
        title: "Error",
        description: "Failed to load interview sessions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedJobs = async () => {
    try {
      setJobsLoading(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await fetch('/api/saved-jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch jobs')

      const data = await response.json()
      setSavedJobs(data.savedJobs || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast({
        title: "Error",
        description: "Failed to load saved jobs",
        variant: "destructive"
      })
    } finally {
      setJobsLoading(false)
    }
  }

  const handleStartNew = () => {
    fetchSavedJobs()
    setShowJobSelector(true)
  }

  const handleSelectJob = async (job: SavedJob) => {
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      // Get user's default resume
      const resumeResponse = await fetch('/api/resumes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      let resume = ''
      if (resumeResponse.ok) {
        const resumeData = await resumeResponse.json()
        const defaultResume = resumeData.resumes.find((r: any) => r.isDefault) || resumeData.resumes[0]
        resume = defaultResume?.content || ''
      }

      // Create new session
      const response = await fetch('/api/interview-sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.originalData?.description || job.summary || '',
          resume
        })
      })

      if (!response.ok) throw new Error('Failed to create session')

      const data = await response.json()

      toast({
        title: data.isExisting ? "Session Resumed" : "Session Created",
        description: data.isExisting
          ? "Continuing your previous interview practice"
          : "Starting new interview practice session"
      })

      // Navigate to interview page
      router.push(`/interview-prep/${data.session.id}`)
    } catch (error) {
      console.error('Error creating session:', error)
      toast({
        title: "Error",
        description: "Failed to create interview session",
        variant: "destructive"
      })
    }
  }

  const handleContinue = (sessionId: string) => {
    router.push(`/interview-prep/${sessionId}`)
  }

  const handleView = (sessionId: string) => {
    router.push(`/interview-prep/${sessionId}`)
  }

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this interview session?')) {
      return
    }

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await fetch(`/api/interview-sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete session')

      toast({
        title: "Session Deleted",
        description: "Interview session has been removed"
      })

      // Refresh sessions
      fetchSessions()
    } catch (error) {
      console.error('Error deleting session:', error)
      toast({
        title: "Error",
        description: "Failed to delete interview session",
        variant: "destructive"
      })
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (activeTab === 'all') return true
    return session.status === activeTab
  })

  const activeSessions = sessions.filter(s => s.status === 'active')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  if (authLoading || !user) {
    return null
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Interview Preparation</h1>
            <p className="text-muted-foreground">
              Practice interviews with AI-powered feedback
            </p>
          </div>
          <Button onClick={handleStartNew} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Start New Practice
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All Sessions ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeSessions.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedSessions.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading interview sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {activeTab === 'all'
                  ? "No Interview Sessions Yet"
                  : activeTab === 'active'
                  ? "No Active Sessions"
                  : "No Completed Sessions"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {activeTab === 'all'
                  ? "Start practicing for your interviews with AI-powered questions and feedback"
                  : activeTab === 'active'
                  ? "You don't have any active interview practice sessions"
                  : "You haven't completed any interview practice sessions yet"}
              </p>
              <Button onClick={handleStartNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Start Your First Practice
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onContinue={handleContinue}
                onView={handleView}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Job Selector Dialog */}
      <JobSelector
        isOpen={showJobSelector}
        onClose={() => setShowJobSelector(false)}
        jobs={savedJobs}
        onSelectJob={handleSelectJob}
        loading={jobsLoading}
      />
    </>
  )
}

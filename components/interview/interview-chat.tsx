"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2, Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { FeedbackPanel } from "./feedback-panel"
import { getQuestionTypeLabel, getQuestionTypeColor } from "@/lib/prompts/interview"
import type { InterviewChatMessage, InterviewQuestion } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface InterviewChatProps {
  messages: InterviewChatMessage[]
  questions: InterviewQuestion[]
  onSendMessage: (message: string) => void
  isProcessing: boolean
  disabled?: boolean
}

export function InterviewChat({
  messages,
  questions,
  onSendMessage,
  isProcessing,
  disabled = false
}: InterviewChatProps) {
  const [input, setInput] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, questions])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isProcessing && !disabled) {
      onSendMessage(input.trim())
      setInput("")
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getQuestionById = (questionId: string) => {
    return questions.find(q => q.id === questionId)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const question = message.questionId ? getQuestionById(message.questionId) : null
          const isUserMessage = message.type === 'user'

          return (
            <div
              key={message.id || index}
              className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] space-y-2 ${isUserMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Question badge for AI messages */}
                {!isUserMessage && question && (
                  <Badge
                    variant="outline"
                    className={`bg-${getQuestionTypeColor(question.type)}-100 text-${getQuestionTypeColor(question.type)}-800 border-${getQuestionTypeColor(question.type)}-300`}
                  >
                    {getQuestionTypeLabel(question.type)}
                  </Badge>
                )}

                {/* Message bubble */}
                <Card className={`${
                  isUserMessage
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="prose prose-sm max-w-none">
                      {isUserMessage ? (
                        <p className="whitespace-pre-wrap text-sm m-0">{message.content}</p>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          className="text-sm"
                          components={{
                            p: ({ children }) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="m-0 mb-2 pl-4">{children}</ul>,
                            ol: ({ children }) => <ol className="m-0 mb-2 pl-4">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      )}
                    </div>

                    {/* Copy button for AI messages */}
                    {!isUserMessage && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          {(() => {
                            try {
                              const date = message.timestamp?.toDate?.() || new Date(message.timestamp as any)
                              if (isNaN(date.getTime())) {
                                return 'Just now'
                              }
                              return formatDistanceToNow(date, { addSuffix: true })
                            } catch {
                              return 'Just now'
                            }
                          })()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="h-7 px-2"
                        >
                          {copiedId === message.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Feedback panel if this question has been answered */}
                {question && question.feedback && (
                  <div className="w-full">
                    <FeedbackPanel feedback={question.feedback} />
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Loading indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <Card className="bg-white border-gray-200">
              <CardContent className="p-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder={
              disabled
                ? "Session ended"
                : "Type your answer or message here... (Shift+Enter for new line)"
            }
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled || isProcessing}
            className="min-h-[60px] max-h-[200px] resize-none"
            rows={1}
          />
          <Button
            type="submit"
            disabled={!input.trim() || disabled || isProcessing}
            className="self-end"
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

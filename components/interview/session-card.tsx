"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Eye, Trash2, Calendar, MessageSquare, Award } from "lucide-react"
import type { InterviewSession } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { getInterviewTypeLabel, getInterviewTypeColor } from "@/lib/prompts/interview"

interface SessionCardProps {
  session: InterviewSession
  onContinue: (sessionId: string) => void
  onView: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

export function SessionCard({ session, onContinue, onView, onDelete }: SessionCardProps) {
  // Convert Firestore Timestamp to Date for display with error handling
  let createdDate: Date
  let completedDate: Date | null = null

  try {
    createdDate = session.createdAt?.toDate?.() || new Date(session.createdAt as any)
    // Validate the date
    if (isNaN(createdDate.getTime())) {
      createdDate = new Date()
    }
  } catch (error) {
    console.error('Error parsing createdAt:', error)
    createdDate = new Date()
  }

  try {
    if (session.completedAt) {
      completedDate = session.completedAt?.toDate?.() || new Date(session.completedAt as any)
      // Validate the date
      if (isNaN(completedDate.getTime())) {
        completedDate = null
      }
    }
  } catch (error) {
    console.error('Error parsing completedAt:', error)
    completedDate = null
  }

  const statusColors = {
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800"
  }

  const questionCount = session.questions?.length || 0
  const answeredCount = session.questions?.filter(q => q.userAnswer)?.length || 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-lg leading-tight">
              {session.jobTitle}
            </h3>
            <p className="text-sm text-muted-foreground">
              {session.company}
            </p>
            {session.currentType && (
              <Badge
                variant="outline"
                className={`mt-1 text-xs ${
                  getInterviewTypeColor(session.currentType) === 'blue' ? 'border-blue-300 text-blue-700' :
                  getInterviewTypeColor(session.currentType) === 'purple' ? 'border-purple-300 text-purple-700' :
                  getInterviewTypeColor(session.currentType) === 'indigo' ? 'border-indigo-300 text-indigo-700' :
                  getInterviewTypeColor(session.currentType) === 'green' ? 'border-green-300 text-green-700' :
                  'border-gray-300 text-gray-700'
                }`}
              >
                {getInterviewTypeLabel(session.currentType)}
              </Badge>
            )}
          </div>
          <Badge className={statusColors[session.status]}>
            {session.status === 'active' ? 'In Progress' : 'Completed'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{questionCount}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{answeredCount}</p>
              <p className="text-xs text-muted-foreground">Answered</p>
            </div>
          </div>
          {session.totalScore !== undefined && (
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{session.totalScore.toFixed(1)}/10</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {session.status === 'completed' && completedDate
              ? `Completed ${formatDistanceToNow(completedDate, { addSuffix: true })}`
              : `Started ${formatDistanceToNow(createdDate, { addSuffix: true })}`}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-3 border-t">
        {session.status === 'active' ? (
          <Button
            onClick={() => onContinue(session.id)}
            className="flex-1"
            size="sm"
          >
            <Play className="h-4 w-4 mr-1.5" />
            Continue Practice
          </Button>
        ) : (
          <Button
            onClick={() => onView(session.id)}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Review Session
          </Button>
        )}
        <Button
          onClick={() => onDelete(session.id)}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

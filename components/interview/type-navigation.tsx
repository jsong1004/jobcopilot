"use client"

import { InterviewType, InterviewTypeConversation } from "@/lib/types"
import {
  getInterviewTypeLabel,
  getInterviewTypeDescription,
  getInterviewTypeColor
} from "@/lib/prompts/interview"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, UserCheck, Code, Brain, Users, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TypeNavigationProps {
  currentType: InterviewType
  conversationsByType: {
    [K in InterviewType]: InterviewTypeConversation
  }
  onTypeChange: (type: InterviewType) => void
  disabled?: boolean
}

export function TypeNavigation({
  currentType,
  conversationsByType,
  onTypeChange,
  disabled
}: TypeNavigationProps) {
  const interviewTypes: {
    value: InterviewType
    icon: React.ComponentType<{ className?: string }>
  }[] = [
    { value: 'interview_tips', icon: Lightbulb },
    { value: 'recruiter_screen', icon: UserCheck },
    { value: 'technical_assessment', icon: Code },
    { value: 'technical_behavioral', icon: Brain },
    { value: 'team_culture_fit', icon: Users }
  ]

  const getMessageCount = (type: InterviewType) => {
    return conversationsByType[type]?.messages?.length || 0
  }

  const hasContent = (type: InterviewType) => {
    const conversation = conversationsByType[type]
    return (
      conversation?.messages?.length > 0 ||
      conversation?.questions?.length > 0
    )
  }

  const getColorClasses = (type: InterviewType, isActive: boolean) => {
    const color = getInterviewTypeColor(type)

    if (isActive) {
      const activeColors: Record<string, string> = {
        'gray': 'bg-gray-100 text-gray-900 border-gray-300',
        'blue': 'bg-blue-100 text-blue-900 border-blue-300',
        'purple': 'bg-purple-100 text-purple-900 border-purple-300',
        'indigo': 'bg-indigo-100 text-indigo-900 border-indigo-300',
        'green': 'bg-green-100 text-green-900 border-green-300'
      }
      return activeColors[color] || activeColors['gray']
    }

    return 'bg-background hover:bg-muted border-border'
  }

  return (
    <nav className="space-y-1">
      {interviewTypes.map(({ value: type, icon: Icon }) => {
        const isActive = currentType === type
        const messageCount = getMessageCount(type)
        const typeHasContent = hasContent(type)
        const label = getInterviewTypeLabel(type)
        const description = getInterviewTypeDescription(type)

        return (
          <Button
            key={type}
            variant="outline"
            className={cn(
              "w-full justify-start text-left h-auto py-3 px-4 relative",
              getColorClasses(type, isActive),
              isActive && "border-2"
            )}
            onClick={() => !disabled && onTypeChange(type)}
            disabled={disabled}
          >
            <div className="flex items-start gap-3 w-full">
              {/* Icon */}
              <Icon className={cn(
                "h-5 w-5 mt-0.5 flex-shrink-0",
                isActive ? "opacity-100" : "opacity-70"
              )} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm",
                    isActive && "font-semibold"
                  )}>
                    {label}
                  </span>

                  {/* Message count badge */}
                  {messageCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 px-1.5 text-xs"
                    >
                      {messageCount}
                    </Badge>
                  )}

                  {/* Has content indicator */}
                  {typeHasContent && !isActive && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                  )}
                </div>

                {/* Description - show on hover or when active */}
                <p className={cn(
                  "text-xs text-muted-foreground mt-1 line-clamp-2",
                  !isActive && "opacity-70"
                )}>
                  {description}
                </p>
              </div>
            </div>
          </Button>
        )
      })}
    </nav>
  )
}

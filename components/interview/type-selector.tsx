"use client"

import { InterviewType } from "@/lib/types"
import {
  getInterviewTypeLabel,
  getInterviewTypeDescription
} from "@/lib/prompts/interview"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Lightbulb, UserCheck, Code, Brain, Users } from "lucide-react"

interface TypeSelectorProps {
  currentType: InterviewType
  onTypeChange: (type: InterviewType) => void
  disabled?: boolean
}

export function TypeSelector({ currentType, onTypeChange, disabled }: TypeSelectorProps) {
  const interviewTypes: { value: InterviewType; icon: React.ReactNode }[] = [
    { value: 'interview_tips', icon: <Lightbulb className="h-4 w-4" /> },
    { value: 'recruiter_screen', icon: <UserCheck className="h-4 w-4" /> },
    { value: 'technical_assessment', icon: <Code className="h-4 w-4" /> },
    { value: 'technical_behavioral', icon: <Brain className="h-4 w-4" /> },
    { value: 'team_culture_fit', icon: <Users className="h-4 w-4" /> }
  ]

  const currentTypeData = interviewTypes.find(t => t.value === currentType)

  return (
    <div className="w-full">
      <Select
        value={currentType}
        onValueChange={(value) => onTypeChange(value as InterviewType)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              {currentTypeData?.icon}
              <span>{getInterviewTypeLabel(currentType)}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {interviewTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex flex-col gap-1 py-1">
                <div className="flex items-center gap-2">
                  {type.icon}
                  <span className="font-medium">{getInterviewTypeLabel(type.value)}</span>
                </div>
                <span className="text-xs text-muted-foreground pl-6">
                  {getInterviewTypeDescription(type.value)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

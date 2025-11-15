"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Lightbulb, MessageSquare } from "lucide-react"
import type { InterviewMode } from "@/lib/types"

interface ModeToggleProps {
  currentMode: InterviewMode
  onModeChange: (mode: InterviewMode) => void
  disabled?: boolean
}

export function ModeToggle({ currentMode, onModeChange, disabled = false }: ModeToggleProps) {
  return (
    <Card className="p-2 inline-flex gap-1">
      <Button
        variant={currentMode === 'tips' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('tips')}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <Lightbulb className="h-4 w-4" />
        Get Tips
      </Button>
      <Button
        variant={currentMode === 'practice' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('practice')}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Practice Questions
      </Button>
    </Card>
  )
}

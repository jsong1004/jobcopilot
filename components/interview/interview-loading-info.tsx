"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

const interviewTips = [
  {
    title: "Use the STAR Method",
    description: "Structure your answers with Situation, Task, Action, and Result for behavioral questions."
  },
  {
    title: "Be Specific",
    description: "Provide concrete examples and quantifiable results whenever possible."
  },
  {
    title: "Ask Clarifying Questions",
    description: "It's perfectly acceptable to ask for clarification before answering a complex question."
  },
  {
    title: "Think Before Speaking",
    description: "Take a moment to organize your thoughts. A brief pause shows thoughtfulness."
  },
  {
    title: "Show Your Process",
    description: "For technical questions, explain your thinking process, not just the final answer."
  },
  {
    title: "Stay Positive",
    description: "When discussing challenges or failures, focus on what you learned and how you grew."
  },
  {
    title: "Be Authentic",
    description: "Honesty and genuine enthusiasm often matter more than having perfect answers."
  },
  {
    title: "Connect to the Role",
    description: "Relate your experiences back to the job requirements and company mission."
  },
  {
    title: "Mind Your Body Language",
    description: "Even in practice, maintain good posture and imagine making eye contact."
  },
  {
    title: "Prepare Questions",
    description: "Always have thoughtful questions ready about the role, team, and company culture."
  }
]

interface InterviewLoadingInfoProps {
  message?: string
}

export function InterviewLoadingInfo({ message = "Analyzing your answer..." }: InterviewLoadingInfoProps) {
  const [currentTip, setCurrentTip] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % interviewTips.length)
    }, 4000) // Change tip every 4 seconds

    return () => clearInterval(interval)
  }, [])

  const tip = interviewTips[currentTip]

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-lg font-medium text-gray-700">{message}</p>
      </div>

      <Card className="w-full max-w-lg bg-gradient-to-br from-blue-50 to-purple-50 border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              💡 Interview Tip
            </h3>
            <p className="text-base font-medium text-primary">
              {tip.title}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {tip.description}
            </p>
          </div>
          <div className="flex justify-center gap-1 mt-4">
            {interviewTips.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentTip
                    ? 'w-8 bg-primary'
                    : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

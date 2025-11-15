"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { InterviewFeedback } from "@/lib/types"

interface FeedbackPanelProps {
  feedback: InterviewFeedback
}

export function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  const [showSuggested, setShowSuggested] = useState(false)

  const ratingColors = {
    excellent: "bg-green-100 text-green-800 border-green-300",
    good: "bg-blue-100 text-blue-800 border-blue-300",
    needs_improvement: "bg-yellow-100 text-yellow-800 border-yellow-300"
  }

  const ratingLabels = {
    excellent: "Excellent Answer!",
    good: "Good Answer",
    needs_improvement: "Needs Improvement"
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Answer Feedback</CardTitle>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`${ratingColors[feedback.rating]} font-semibold`}
            >
              {ratingLabels[feedback.rating]}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Score:</span>
              <span className="text-xl font-bold text-primary">
                {feedback.score}/10
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold text-green-900">Strengths</h4>
            </div>
            <ul className="space-y-1.5 ml-6">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {feedback.improvements && feedback.improvements.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-yellow-900">Areas for Improvement</h4>
            </div>
            <ul className="space-y-1.5 ml-6">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">→</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Answer */}
        {feedback.suggestedAnswer && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggested(!showSuggested)}
              className="w-full justify-between hover:bg-gray-50"
            >
              <span className="font-semibold text-gray-900">
                View Suggested Enhanced Answer
              </span>
              {showSuggested ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {showSuggested && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {feedback.suggestedAnswer}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

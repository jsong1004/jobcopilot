"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, XCircle, Download } from "lucide-react"
import { useState } from "react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Job {
  id: string
  title: string
  company: string
  matchingScore: number
  matchingSummary?: string
  summary?: string
  scoreDetails?: any
}

interface MatchingScoreDialogProps {
  job: Job
  isOpen: boolean
  onClose: () => void
}

export function MatchingScoreDialog({ job, isOpen, onClose }: MatchingScoreDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const enhancedScoreDetails = (job as any).enhancedScoreDetails
  const hasEnhancedData = enhancedScoreDetails?.breakdown

  const toStrings = (arr: any): string[] => {
    if (!arr) return []
    if (Array.isArray(arr)) return arr.map(v => typeof v === 'string' ? v : JSON.stringify(v))
    return [typeof arr === 'string' ? arr : JSON.stringify(arr)]
  }

  const cleanReasoning = (text?: string) => {
    if (!text) return ''
    return text.replace(/^\s*summary\s*:\s*/i, '')
  }

  // Format long reasoning into structured content with bullets
  const formatReasoning = (text?: string): { summary: string; bullets: string[] } => {
    const raw = cleanReasoning(text || '')
    if (!raw) return { summary: '', bullets: [] }

    // Remove ** markers and clean up formatting
    const cleaned = raw
      .replace(/\*\*/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*[—–-]\s*/g, ' — ')
      .trim()

    // Try to extract bullet points from text
    const bullets: string[] = []

    // Look for patterns like "• " or numbered lists
    const bulletPattern = /[•·]\s*([^•·]+)/g
    const numberPattern = /\d+\)\s*([^0-9]+?)(?=\d+\)|$)/g

    let matches
    while ((matches = bulletPattern.exec(cleaned)) !== null) {
      bullets.push(matches[1].trim())
    }

    // If no bullets found with bullet points, try numbered lists
    if (bullets.length === 0) {
      while ((matches = numberPattern.exec(cleaned)) !== null) {
        bullets.push(matches[1].trim())
      }
    }

    // If still no bullets, split by sentences and take key points
    if (bullets.length === 0) {
      const sentences = cleaned.split(/(?<=[.!?])\s+/)
      // Extract key phrases after colons or important keywords
      sentences.forEach(sentence => {
        if (sentence.includes(':')) {
          const parts = sentence.split(':')
          if (parts.length > 1) {
            bullets.push(parts[1].trim())
          }
        } else if (sentence.length > 20 && sentence.length < 200) {
          bullets.push(sentence)
        }
      })
    }

    // Get a summary (first sentence or main point)
    let summary = cleaned.split(/[.!?]/)[0] + '.'
    if (summary.length > 200) {
      summary = summary.substring(0, 197) + '...'
    }

    return {
      summary: summary,
      bullets: bullets.slice(0, 5).map(b => b.length > 150 ? b.substring(0, 147) + '...' : b)
    }
  }

  // 4-category mapping from enhanced breakdown
  const categories = hasEnhancedData ? [
    {
      key: 'technicalSkills',
      title: 'Technical Competency',
      icon: '🛠️',
      score: enhancedScoreDetails.breakdown.technicalSkills?.score || 0,
      reasoning: cleanReasoning(enhancedScoreDetails.breakdown.technicalSkills?.reasoning)
    },
    {
      key: 'experienceDepth',
      title: 'Experience & Growth',
      icon: '💼',
      score: enhancedScoreDetails.breakdown.experienceDepth?.score || 0,
      reasoning: cleanReasoning(enhancedScoreDetails.breakdown.experienceDepth?.reasoning)
    },
    {
      key: 'achievements',
      title: 'Impact & Achievements',
      icon: '🏆',
      score: enhancedScoreDetails.breakdown.achievements?.score || 0,
      reasoning: cleanReasoning(enhancedScoreDetails.breakdown.achievements?.reasoning)
    },
    {
      key: 'education',
      title: 'Cultural & Educational Fit',
      icon: '🎓',
      score: enhancedScoreDetails.breakdown.education?.score || 0,
      reasoning: cleanReasoning(enhancedScoreDetails.breakdown.education?.reasoning)
    }
  ] : []

  const strengths = toStrings(enhancedScoreDetails?.keyStrengths).slice(0, 6)

  // Normalize weaknesses to readable objects
  const normalizeWeaknesses = (raw: any): Array<{ title: string; impact?: string; plan?: { shortTerm?: string; midTerm?: string; longTerm?: string } }> => {
    const replaceSmartQuotes = (s: string) => s
      .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
      .replace(/[\u2018\u2019\u2032]/g, "'")

    // Helper to ensure we get a string from any value
    const ensureString = (value: any): string => {
      if (typeof value === 'string') return value
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    }

    // Helper to clean JSON-like text
    const cleanJsonText = (text: string): string => {
      return text
        .replace(/^\{?"?weakness"?:\s*"?/i, '')
        .replace(/^\{?"?impact"?:\s*"?/i, '')
        .replace(/^\{?"?shortTerm"?:\s*"?/i, '')
        .replace(/^\{?"?midTerm"?:\s*"?/i, '')
        .replace(/^\{?"?longTerm"?:\s*"?/i, '')
        .replace(/"?\}?$/g, '')
        .replace(/\\"/g, '"')
        .replace(/\\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    const arr = Array.isArray(raw) ? raw : (raw ? [raw] : [])
    const out: Array<{ title: string; impact?: string; plan?: { shortTerm?: string; midTerm?: string; longTerm?: string } }> = []
    for (const item of arr) {
      if (typeof item === 'object' && item !== null) {
        const title = ensureString((item as any).weakness || (item as any).description || item)
        const impact = (item as any).impact ? ensureString((item as any).impact) : undefined
        const improvementPlan = (item as any).improvementPlan

        let plan: { shortTerm?: string; midTerm?: string; longTerm?: string } | undefined
        if (improvementPlan && typeof improvementPlan === 'object') {
          plan = {
            shortTerm: improvementPlan.shortTerm ? ensureString(improvementPlan.shortTerm) : undefined,
            midTerm: improvementPlan.midTerm ? ensureString(improvementPlan.midTerm) : undefined,
            longTerm: improvementPlan.longTerm ? ensureString(improvementPlan.longTerm) : undefined,
          }
        }

        out.push({ title, impact, plan })
        continue
      }
      if (typeof item === 'string') {
        const s = replaceSmartQuotes(item.trim())
        try {
          const parsed = JSON.parse(s)
          const title = ensureString(parsed?.weakness || parsed?.description || item)
          const impact = parsed?.impact ? ensureString(parsed.impact) : undefined

          let plan: { shortTerm?: string; midTerm?: string; longTerm?: string } | undefined
          if (parsed?.improvementPlan && typeof parsed.improvementPlan === 'object') {
            plan = {
              shortTerm: parsed.improvementPlan.shortTerm ? ensureString(parsed.improvementPlan.shortTerm) : undefined,
              midTerm: parsed.improvementPlan.midTerm ? ensureString(parsed.improvementPlan.midTerm) : undefined,
              longTerm: parsed.improvementPlan.longTerm ? ensureString(parsed.improvementPlan.longTerm) : undefined,
            }
          }

          out.push({ title, impact, plan })
        } catch {
          // Try to extract key:value pairs with regex if JSON.parse fails
          const mWeak = s.match(/"?weakness"?\s*:\s*"([\s\S]*?)"\s*(,|\}|$)/i)
          const mImpact = s.match(/"?impact"?\s*:\s*"([\s\S]*?)"\s*(,|\}|$)/i)
          const shortT = s.match(/"?shortTerm"?\s*:\s*"([\s\S]*?)"/i)
          const midT = s.match(/"?midTerm"?\s*:\s*"([\s\S]*?)"/i)
          const longT = s.match(/"?longTerm"?\s*:\s*"([\s\S]*?)"/i)
          if (mWeak) {
            out.push({
              title: mWeak[1],
              impact: mImpact?.[1],
              plan: { shortTerm: shortT?.[1], midTerm: midT?.[1], longTerm: longT?.[1] }
            })
          } else {
            out.push({ title: s })
          }
        }
      }
    }
    return out.slice(0, 6)
  }

  const weaknesses = normalizeWeaknesses(enhancedScoreDetails?.keyWeaknesses)
  const interviewFocus = toStrings(enhancedScoreDetails?.interviewFocus).slice(0, 5)

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (score >= 70) return <AlertCircle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const pdfEnhanced = hasEnhancedData ? {
        ...enhancedScoreDetails,
        // Ensure insights are present in PDF even if model returned objects
        keyStrengths: strengths,
        keyWeaknesses: weaknesses,
        interviewFocus: enhancedScoreDetails?.interviewFocus
      } : null

      const analysisData = {
        job: {
          title: job.title,
          company: job.company,
          matchingScore: job.matchingScore,
          matchingSummary: job.matchingSummary,
        },
        breakdown: {
          skills: { score: enhancedScoreDetails?.breakdown?.technicalSkills?.score || 0, matched: strengths, missing: weaknesses },
          experience: { score: enhancedScoreDetails?.breakdown?.experienceDepth?.score || 0, yearsRequired: 3, yearsHave: 2, relevantExperience: cleanReasoning(enhancedScoreDetails?.breakdown?.experienceDepth?.reasoning) || '' },
          education: { score: enhancedScoreDetails?.breakdown?.education?.score || 0, required: 'See job requirements', have: cleanReasoning(enhancedScoreDetails?.breakdown?.education?.reasoning) || '' },
          keywords: { score: enhancedScoreDetails?.breakdown?.achievements?.score || 0, matched: strengths, total: strengths.length + weaknesses.length },
        },
        enhancedScoreDetails: pdfEnhanced,
      }

      const response = await fetch('/api/jobs/match-analysis-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData),
      })
      if (!response.ok) throw new Error('Failed to generate PDF')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${job.title.replace(/[^a-zA-Z0-9]/g, '_')}_Match_Analysis.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Match Analysis: {job.title}
              <Badge variant="secondary" className="ml-2">{job.matchingScore}% Match</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-4xl font-bold text-blue-600 mb-2">{job.matchingScore}%</div>
            <p className="text-gray-600">Overall Match Score</p>
            <Progress value={job.matchingScore} className="mt-4" />
          </div>

          {hasEnhancedData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(c => {
                const formatted = formatReasoning(c.reasoning)
                return (
                  <div key={c.key} className="p-4 rounded-lg border bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{c.icon}</span>
                        <span className="font-semibold">{c.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getScoreIcon(c.score)}
                        <span className={`font-bold ${getScoreColor(c.score)}`}>{c.score}%</span>
                      </div>
                    </div>
                    <Progress value={c.score} className="mb-3" />
                    {formatted.summary && (
                      <>
                        <p className="text-xs text-gray-700 leading-relaxed mb-2">
                          {formatted.summary}
                        </p>
                        {formatted.bullets.length > 0 && (
                          <ul className="space-y-1 mt-2">
                            {formatted.bullets.map((bullet, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                <span className="text-gray-400 mt-0.5">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {hasEnhancedData && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Interview Preparation Insights</h3>

              {interviewFocus.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-700 mb-2">Focus Areas</h4>
                  <ul className="space-y-1">
                    {interviewFocus.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(strengths.length > 0 || weaknesses.length > 0) && (
                <div className="space-y-4">
                  {strengths.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Key Strengths</h4>
                      <ul className="space-y-1">
                        {strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {weaknesses.length > 0 && (
                    <div>
                      <h4 className="font-medium text-orange-700 mb-3">Areas to Improve</h4>
                      <div className="space-y-4">
                        {weaknesses.map((w, i) => {
                          // Parse and clean the weakness data
                          const parseWeaknessText = (text: string) => {
                            // Try to extract the main weakness, impact, and improvement plan
                            const weaknessMatch = text.match(/"?weakness"?\s*:\s*"([^"]+)"/i)
                            const impactMatch = text.match(/"?impact"?\s*:\s*"([^"]+)"/i)
                            const shortTermMatch = text.match(/"?shortTerm"?\s*:\s*"([^"]+)"/i)
                            const midTermMatch = text.match(/"?midTerm"?\s*:\s*"([^"]+)"/i)
                            const longTermMatch = text.match(/"?longTerm"?\s*:\s*"([^"]+)"/i)

                            return {
                              weakness: weaknessMatch?.[1] || text,
                              impact: impactMatch?.[1],
                              shortTerm: shortTermMatch?.[1],
                              midTerm: midTermMatch?.[1],
                              longTerm: longTermMatch?.[1]
                            }
                          }

                          // If the title contains JSON structure, parse it
                          let parsedData = { weakness: w.title, impact: w.impact, shortTerm: '', midTerm: '', longTerm: '' }
                          if (w.title.includes('"weakness"') || w.title.includes('"impact"')) {
                            parsedData = parseWeaknessText(w.title)
                          }

                          // Clean up the text
                          const cleanText = (text?: string) => {
                            if (!text) return ''
                            return text
                              .replace(/\\"/g, '"')
                              .replace(/\\n/g, ' ')
                              .replace(/\s+/g, ' ')
                              .replace(/^\s*["\']|["\']?\s*$/g, '')
                              .trim()
                          }

                          const weakness = cleanText(parsedData.weakness)
                          const impact = cleanText(parsedData.impact || w.impact)
                          const shortTerm = cleanText(parsedData.shortTerm || w.plan?.shortTerm)
                          const midTerm = cleanText(parsedData.midTerm || w.plan?.midTerm)
                          const longTerm = cleanText(parsedData.longTerm || w.plan?.longTerm)

                          return (
                            <div key={i} className="border border-orange-200 rounded-lg overflow-hidden">
                              {/* Weakness Header */}
                              <div className="bg-orange-50 p-3 border-b border-orange-100">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                  <div className="font-medium text-gray-800 text-sm">
                                    {weakness}
                                  </div>
                                </div>
                              </div>

                              {/* Impact Section */}
                              {impact && (
                                <div className="p-3 bg-white border-b border-orange-100">
                                  <div className="text-xs">
                                    <span className="font-semibold text-gray-700">Impact</span>
                                    <p className="text-gray-600 mt-1">{impact}</p>
                                  </div>
                                </div>
                              )}

                              {/* Improvement Plan */}
                              {(shortTerm || midTerm || longTerm) && (
                                <div className="p-3 bg-white">
                                  <div className="text-xs space-y-2">
                                    <div className="font-semibold text-gray-700 mb-2">Improvement Plan</div>

                                    {shortTerm && (
                                      <div className="pl-3 border-l-2 border-green-400">
                                        <div className="font-medium text-green-700 mb-0.5">Short Term (1 month)</div>
                                        <p className="text-gray-600">{shortTerm}</p>
                                      </div>
                                    )}

                                    {midTerm && (
                                      <div className="pl-3 border-l-2 border-yellow-400">
                                        <div className="font-medium text-yellow-700 mb-0.5">Mid Term (3 months)</div>
                                        <p className="text-gray-600">{midTerm}</p>
                                      </div>
                                    )}

                                    {longTerm && (
                                      <div className="pl-3 border-l-2 border-blue-400">
                                        <div className="font-medium text-blue-700 mb-0.5">Long Term (6+ months)</div>
                                        <p className="text-gray-600">{longTerm}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

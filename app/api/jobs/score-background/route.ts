import { NextRequest, NextResponse } from "next/server"
import { initFirebaseAdmin } from "@/lib/firebase-admin-init"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { SavedJob, JobSearchResult } from "@/lib/types"
import { executeMultiAgentJobScoring, executeEnhancedJobScoring } from "@/lib/prompts/api-helpers"
import { logActivity } from "@/lib/activity-logger"
import { MODELS } from "@/lib/prompts/constants"

export async function POST(req: NextRequest) {
  try {
    initFirebaseAdmin()
    const adminAuth = getAuth()
    const adminDb = getFirestore()

    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = await adminAuth.verifyIdToken(token)
    const userId = decoded.uid
    const body = await req.json()
    const { jobId, useMultiAgent = true } = body

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 })
    }

    console.log(`[BackgroundScoring] Starting background scoring for job ${jobId}`)

    // Get the saved job
    const savedJobDoc = await adminDb.collection("savedJobs")
      .where("userId", "==", userId)
      .where("jobId", "==", jobId)
      .limit(1)
      .get()

    if (savedJobDoc.empty) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const savedJobData = savedJobDoc.docs[0].data() as SavedJob
    const savedJobRef = savedJobDoc.docs[0].ref

    // Update status to in_progress
    await savedJobRef.update({
      scoringStatus: 'in_progress',
      scoringStartedAt: new Date(),
    })

    // Get user's default resume
    const resumesSnapshot = await adminDb.collection("resumes")
      .where("userId", "==", userId)
      .where("isDefault", "==", true)
      .limit(1)
      .get()

    let resume = ""
    if (!resumesSnapshot.empty) {
      resume = resumesSnapshot.docs[0].data().content || ""
    } else {
      // If no default resume, get any resume
      const anyResumeSnapshot = await adminDb.collection("resumes")
        .where("userId", "==", userId)
        .limit(1)
        .get()
      if (!anyResumeSnapshot.empty) {
        resume = anyResumeSnapshot.docs[0].data().content || ""
      }
    }

    if (!resume) {
      console.error(`[BackgroundScoring] No resume found for user ${userId}`)
      await savedJobRef.update({
        scoringStatus: 'failed',
        scoringCompletedAt: new Date(),
      })
      return NextResponse.json({ error: "No resume available for scoring" }, { status: 400 })
    }

    // Prepare job for scoring
    const originalData = savedJobData.originalData
    const jobForScoring: JobSearchResult = {
      id: originalData?.id || jobId,
      title: originalData?.title || savedJobData.title,
      company: originalData?.company || savedJobData.company,
      location: originalData?.location || savedJobData.location,
      description: originalData?.description || "",
      qualifications: originalData?.qualifications || [],
      responsibilities: originalData?.responsibilities || [],
      benefits: originalData?.benefits || [],
      salary: originalData?.salary || savedJobData.salary || "",
      postedAt: originalData?.postedAt || "",
      applyUrl: originalData?.applyUrl || "",
      source: originalData?.source || "",
      matchingScore: 0,
      matchingSummary: "",
      summary: originalData?.summary || savedJobData.summary || ""
    }

    try {
      let scoredJobs: JobSearchResult[] = []
      const scoringStartTime = Date.now()

      if (useMultiAgent) {
        scoredJobs = await executeMultiAgentJobScoring({
          jobs: [jobForScoring],
          resume,
          userId
        })
      } else {
        scoredJobs = await executeEnhancedJobScoring({
          jobs: [jobForScoring],
          resume,
          userId
        })
      }

      const scoringExecutionTime = Date.now() - scoringStartTime

      if (scoredJobs.length > 0) {
        const scoredJob = scoredJobs[0]
        const calculatedScore = scoredJob.matchingScore || 0
        const calculatedSummary = scoredJob.matchingSummary || ""
        const calculatedScoreDetails = scoredJob.scoreDetails || {}

        // Include enhanced score details if available
        if (scoredJob.enhancedScoreDetails) {
          calculatedScoreDetails.enhancedScoreDetails = scoredJob.enhancedScoreDetails
          // Also update original data
          if (savedJobData.originalData) {
            savedJobData.originalData.enhancedScoreDetails = scoredJob.enhancedScoreDetails
          }
        }

        // Update the saved job with results
        await savedJobRef.update({
          matchingScore: calculatedScore,
          matchingSummary: calculatedSummary,
          scoreDetails: calculatedScoreDetails,
          scoringStatus: 'completed',
          scoringCompletedAt: new Date(),
          ...(scoredJob.enhancedScoreDetails && {
            'originalData.enhancedScoreDetails': scoredJob.enhancedScoreDetails
          })
        })

        // Log activity for background job scoring
        try {
          const scoringType = useMultiAgent ? 'multi-agent' : 'enhanced'

          let actualTokenUsage = 0
          let actualUsageData = null

          if (useMultiAgent) {
            // Multi-agent logs individual agent activities separately
            if (scoredJob.enhancedScoreDetails?.usage) {
              actualUsageData = scoredJob.enhancedScoreDetails.usage
              actualTokenUsage = 0 // Individual agents already logged their usage
            }
          } else {
            // For enhanced scoring, log the actual usage here
            if (scoredJob.enhancedScoreDetails?.usage) {
              actualUsageData = scoredJob.enhancedScoreDetails.usage
              actualTokenUsage = actualUsageData.totalTokens || 0
            } else {
              actualTokenUsage = 600 // Enhanced scoring estimate
            }
          }

          await logActivity({
            userId,
            activityType: useMultiAgent ? 'job_scoring_background_summary' : 'job_scoring_background',
            tokenUsage: actualTokenUsage,
            timeTaken: scoringExecutionTime / 1000,
            metadata: {
              model: useMultiAgent ? 'multi-agent-system' : MODELS.GPT5_MINI,
              jobs_scored: 1,
              scoring_type: scoringType,
              multi_agent: useMultiAgent,
              enhanced: !useMultiAgent,
              triggered_by: 'background_scoring',
              job_title: savedJobData.title,
              job_company: savedJobData.company,
              job_id: jobId,
              execution_time_ms: scoringExecutionTime,
              tokens_per_job: actualTokenUsage,
              user_initiated: false, // Background process
              ...(useMultiAgent && {
                summary_activity: true,
                agent_count: 9,
                total_tokens_used: actualUsageData?.totalTokens || 0,
                note: 'Background scoring - individual agent activities logged separately'
              }),
              ...(actualUsageData && !useMultiAgent && {
                prompt_tokens: actualUsageData.promptTokens,
                completion_tokens: actualUsageData.completionTokens,
                cached_tokens: actualUsageData.cachedTokens || 0,
                cache_hit_rate: actualUsageData.promptTokens > 0
                  ? (actualUsageData.cachedTokens / actualUsageData.promptTokens * 100).toFixed(1) + '%'
                  : '0%',
                estimated_cost: actualUsageData.estimatedCost || 0,
                cost_savings: actualUsageData.costSavings || 0,
                usage_source: 'actual'
              }) || (!useMultiAgent && { usage_source: 'estimated' })
            }
          })
          console.log(`[BackgroundScoring] Job scoring activity logged: ${actualTokenUsage} tokens for ${savedJobData.title} at ${savedJobData.company} (${scoringType}, background)`)
        } catch (activityError) {
          console.warn('[BackgroundScoring] Failed to log job scoring activity:', activityError)
        }

        console.log(`[BackgroundScoring] Successfully completed background scoring for job ${jobId} with score ${calculatedScore}`)

        return NextResponse.json({
          success: true,
          matchingScore: calculatedScore,
          matchingSummary: calculatedSummary,
          scoreDetails: calculatedScoreDetails,
          executionTime: scoringExecutionTime
        })
      } else {
        throw new Error("No scored jobs returned")
      }
    } catch (scoringError) {
      console.error(`[BackgroundScoring] Error performing scoring:`, scoringError)

      // Update status to failed
      await savedJobRef.update({
        scoringStatus: 'failed',
        scoringCompletedAt: new Date(),
      })

      return NextResponse.json({
        error: "Scoring failed",
        details: scoringError instanceof Error ? scoringError.message : 'Unknown error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[BackgroundScoring] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
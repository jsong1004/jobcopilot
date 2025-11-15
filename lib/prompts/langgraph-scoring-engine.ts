// lib/prompts/langgraph-scoring-engine.ts
/**
 * Optimized LangGraph Job Scoring Engine
 *
 * Reduces from 8 agents to 4 optimized agents:
 * 1. Technical Competency (30%) - Skills + Technical Education
 * 2. Experience & Growth (30%) - Experience Depth + Career Progression
 * 3. Impact & Achievements (25%) - Achievements + Soft Skills
 * 4. Cultural & Educational Fit (15%) - Education + Cultural Fit
 *
 * Key optimizations:
 * - 50% token reduction (≈29,925 → ≈15,000 tokens per job)
 * - Shared context for data reuse
 * - Unified API for consistency
 * - Built-in error handling and fallbacks
 */

import { StateGraph, Annotation } from "@langchain/langgraph"
import { promptManager } from './index'
import { logActivity } from '../activity-logger'
import { MODELS } from './constants'
import {
  JobSearchResult,
  MultiAgentScoreResult,
  SCORE_CATEGORIES,
  ENHANCED_SCORING_WEIGHTS
} from './types'

// Optimized agent types - reduced from 8 to 4
type OptimizedAgentType =
  | 'technical-competency'
  | 'experience-growth'
  | 'impact-achievements'
  | 'cultural-fit'

// Agent result type
interface AgentResult {
  score: number
  reasoning: string
  strengths: string[]
  gaps: string[]
  executionTime: number
  usage?: any
  error?: boolean
}

// Final score type
interface FinalScore {
  overallScore: number
  category: string
  breakdown: Record<string, any>
  hiringRecommendation: string
  keyStrengths: string[]
  keyWeaknesses: string[]
  interviewFocus: string[]
}

// Resume analysis type
interface ResumeAnalysis {
  skills: string[]
  experience: string
  education: string
  achievements: string[]
}

// Job requirements type
interface JobRequirements {
  requiredSkills: string[]
  experienceLevel: string
  responsibilities: string[]
  qualifications: string[]
}

// LangGraph state definition using Annotation syntax
const ScoringStateAnnotation = Annotation.Root({
  // Input data
  resume: Annotation<string>,
  jobData: Annotation<JobSearchResult>,
  userId: Annotation<string | undefined>,

  // Shared context (parsed once, reused by all agents)
  resumeAnalysis: Annotation<ResumeAnalysis>,
  jobRequirements: Annotation<JobRequirements>,

  // Individual agent results (separate channels to avoid concurrent updates)
  technicalResult: Annotation<AgentResult | undefined>,
  experienceResult: Annotation<AgentResult | undefined>,
  impactResult: Annotation<AgentResult | undefined>,
  culturalResult: Annotation<AgentResult | undefined>,

  // Final result
  finalScore: Annotation<FinalScore>,

  // Execution metadata
  totalExecutionTime: Annotation<number>
})

// Type for the state
type ScoringState = typeof ScoringStateAnnotation.State

// Optimized scoring weights for 4-agent system
const OPTIMIZED_WEIGHTS: Record<OptimizedAgentType, number> = {
  'technical-competency': 0.30,    // Most important for technical roles
  'experience-growth': 0.30,       // Experience quality and trajectory
  'impact-achievements': 0.25,     // Proven results and collaboration
  'cultural-fit': 0.15            // Important but less critical
}

/**
 * Parse resume and job data into shared context
 * This reduces token usage by avoiding repeated parsing
 */
async function parseSharedContext(state: ScoringState): Promise<Partial<ScoringState>> {
  console.log('🔍 [LangGraph] Parsing shared context...')
  const startTime = Date.now()

  try {
    // Quick diagnostics for missing inputs
    const resumePreview = (state.resume || '').slice(0, 200)
    const jobDescPreview = (state.jobData?.description || '').slice(0, 200)
    console.log(`🧪 [LangGraph] Resume len=${state.resume?.length || 0}, preview="${resumePreview.replace(/\n/g, ' ')}"`)
    console.log(`🧪 [LangGraph] Job desc len=${state.jobData?.description?.length || 0}, preview="${jobDescPreview.replace(/\n/g, ' ')}"`)

    if (!state.resume || state.resume.trim().length === 0) {
      console.warn('⚠️ [LangGraph] Empty resume detected; parsing may yield empty context')
    }
    if (!state.jobData?.description || state.jobData.description.trim().length === 0) {
      console.warn('⚠️ [LangGraph] Empty job description detected; parsing may yield empty context')
    }

    // Parse resume once for all agents
    const resumeResponse = await promptManager.executePrompt({
      promptId: 'resume-parser-optimized',
      variables: {
        resume: state.resume
      },
      context: {
        metadata: {
          purpose: 'shared-context-parsing'
        }
      }
    })

    // Parse job requirements once for all agents
    const jobResponse = await promptManager.executePrompt({
      promptId: 'job-parser-optimized',
      variables: {
        jobDescription: state.jobData.description,
        jobTitle: state.jobData.title
      },
      context: {
        metadata: {
          purpose: 'shared-context-parsing'
        }
      }
    })

    const executionTime = Date.now() - startTime
    console.log(`✅ [LangGraph] Shared context parsed in ${executionTime}ms`)

    return {
      resumeAnalysis: resumeResponse.success && resumeResponse.data ? resumeResponse.data : {
        skills: ["General professional skills"],
        experience: "Professional experience details not available",
        education: "Educational background not detailed",
        achievements: ["Professional accomplishments"],
        workHistory: [{
          company: "Not specified",
          role: "Not specified",
          duration: "Not specified",
          responsibilities: ["Professional duties"]
        }],
        yearsOfExperience: "Not specified",
        currentLevel: "mid"
      },
      jobRequirements: jobResponse.success && jobResponse.data ? jobResponse.data : {
        requiredSkills: ["Professional skills"],
        experienceLevel: "mid-level",
        responsibilities: ["Professional responsibilities"],
        qualifications: ["Standard qualifications"]
      }
    }

  } catch (error) {
    console.error('❌ [LangGraph] Shared context parsing failed:', error)
    return {
      resumeAnalysis: {
        skills: ["General professional skills"],
        experience: "Failed to parse resume content",
        education: "Failed to parse educational background",
        achievements: ["Professional accomplishments"],
        workHistory: [{
          company: "Parse failed",
          role: "Parse failed",
          duration: "Parse failed",
          responsibilities: ["Unable to parse"]
        }],
        yearsOfExperience: "Parse failed",
        currentLevel: "mid"
      },
      jobRequirements: {
        requiredSkills: ["Professional skills"],
        experienceLevel: "mid-level",
        responsibilities: ["Professional responsibilities"],
        qualifications: ["Standard qualifications"]
      }
    }
  }
}

/**
 * Execute optimized scoring agent
 */
async function executeOptimizedAgent(
  agentType: OptimizedAgentType,
  state: ScoringState
): Promise<Partial<ScoringState>> {
  console.log(`🤖 [${agentType}] Starting optimized agent execution...`)
  const startTime = Date.now()

  try {
    // Agent-specific prompt mapping
    const promptIdMap: Record<OptimizedAgentType, string> = {
      'technical-competency': 'langgraph-technical-competency',
      'experience-growth': 'langgraph-experience-growth',
      'impact-achievements': 'langgraph-impact-achievements',
      'cultural-fit': 'langgraph-cultural-fit'
    }

    const promptId = promptIdMap[agentType]

    // Use shared context to reduce token usage
    const response = await promptManager.executePrompt({
      promptId,
      variables: {
        // Shared parsed data instead of raw resume/job
        resumeAnalysis: JSON.stringify(state.resumeAnalysis, null, 2),
        jobRequirements: JSON.stringify(state.jobRequirements, null, 2),
        // Original data for context
        jobTitle: state.jobData.title,
        company: state.jobData.company
      },
      context: {
        userId: state.userId,
        metadata: {
          agentType,
          jobId: state.jobData.id,
          timestamp: new Date().toISOString()
        }
      },
      overrides: {
        maxTokens: 2500 // Reduced from 3000-4000 due to shared context
      }
    })

    if (!response.success) {
      throw new Error(response.error || `${agentType} agent execution failed`)
    }

    const executionTime = Date.now() - startTime
    console.log(`✅ [${agentType}] Agent completed in ${executionTime}ms`)

    // Log individual agent activity
    if (response.usage && response.usage.totalTokens > 0) {
      try {
        await logActivity({
          userId: state.userId || 'system',
          activityType: 'job_scoring_agent_optimized',
          tokenUsage: response.usage.totalTokens,
          timeTaken: executionTime / 1000,
          metadata: {
            model: MODELS.GPT5_MINI,
            agent_type: agentType,
            job_title: state.jobData.title,
            job_company: state.jobData.company,
            execution_time_ms: executionTime,
            prompt_tokens: response.usage.promptTokens,
            completion_tokens: response.usage.completionTokens,
            cached_tokens: response.usage.cachedTokens || 0,
            cache_hit_rate: response.usage.promptTokens > 0
              ? (response.usage.cachedTokens / response.usage.promptTokens * 100).toFixed(1) + '%'
              : '0%',
            estimated_cost: response.usage.estimatedCost || 0,
            cost_savings: response.usage.costSavings || 0,
            scoring_context: 'langgraph_optimized',
            agent_execution: true,
            optimization_version: '4-agent'
          }
        })
        console.log(`💰 [${agentType}] Agent activity logged: ${response.usage.totalTokens} tokens`)
      } catch (activityError) {
        console.warn(`⚠️ [${agentType}] Failed to log agent activity:`, activityError)
      }
    }

    // Parse agent result
    const agentResult = response.data

    // Defensive score extraction (handles alternative keys or string scores)
    const rawScore = agentResult?.score ?? agentResult?.categoryScore ?? agentResult?.overallScore
    let numericScore = 0
    if (typeof rawScore === 'number') {
      numericScore = rawScore
    } else if (typeof rawScore === 'string') {
      const parsed = parseFloat(rawScore.replace(/[^0-9.\-]/g, ''))
      if (!Number.isNaN(parsed)) numericScore = parsed
    }
    // Clamp to 0-100 range
    numericScore = Math.max(0, Math.min(100, Math.round(numericScore)))

    // Return result to appropriate individual channel
    const result = {
      score: numericScore,
      reasoning: agentResult?.reasoning || 'No reasoning provided',
      strengths: agentResult?.strengths || [],
      gaps: agentResult?.gaps || [],
      executionTime,
      usage: response.usage
    }

    switch (agentType) {
      case 'technical-competency':
        return { technicalResult: result }
      case 'experience-growth':
        return { experienceResult: result }
      case 'impact-achievements':
        return { impactResult: result }
      case 'cultural-fit':
        return { culturalResult: result }
      default:
        throw new Error(`Unknown agent type: ${agentType}`)
    }

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`❌ [${agentType}] Agent failed after ${executionTime}ms:`, error)

    // Fallback scoring based on agent type
    const fallbackScores: Record<OptimizedAgentType, number> = {
      'technical-competency': 45,    // Conservative for missing tech evaluation
      'experience-growth': 50,       // Neutral for experience
      'impact-achievements': 40,     // Lower when achievements can't be evaluated
      'cultural-fit': 60            // Moderate for cultural fit
    }

    // Return error result to appropriate individual channel
    const errorResult = {
      score: fallbackScores[agentType],
      reasoning: `${agentType} evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      strengths: [],
      gaps: [`Failed to evaluate ${agentType}`],
      executionTime,
      error: true
    }

    switch (agentType) {
      case 'technical-competency':
        return { technicalResult: errorResult }
      case 'experience-growth':
        return { experienceResult: errorResult }
      case 'impact-achievements':
        return { impactResult: errorResult }
      case 'cultural-fit':
        return { culturalResult: errorResult }
      default:
        throw new Error(`Unknown agent type: ${agentType}`)
    }
  }
}

/**
 * Technical Competency Agent (30% weight)
 * Combines: technicalSkills + technical education
 */
async function technicalCompetencyAgent(state: ScoringState): Promise<Partial<ScoringState>> {
  return executeOptimizedAgent('technical-competency', state)
}

/**
 * Experience & Growth Agent (30% weight)
 * Combines: experienceDepth + careerProgression
 */
async function experienceGrowthAgent(state: ScoringState): Promise<Partial<ScoringState>> {
  return executeOptimizedAgent('experience-growth', state)
}

/**
 * Impact & Achievements Agent (25% weight)
 * Combines: achievements + softSkills
 */
async function impactAchievementsAgent(state: ScoringState): Promise<Partial<ScoringState>> {
  return executeOptimizedAgent('impact-achievements', state)
}

/**
 * Cultural & Educational Fit Agent (15% weight)
 * Combines: education + cultural assessment
 */
async function culturalFitAgent(state: ScoringState): Promise<Partial<ScoringState>> {
  return executeOptimizedAgent('cultural-fit', state)
}

/**
 * Orchestration agent - synthesize all results
 */
async function orchestrationAgent(state: ScoringState): Promise<Partial<ScoringState>> {
  console.log('🎭 [LangGraph] Starting orchestration...')
  const startTime = Date.now()

  try {
    // Calculate weighted score from agent results
    let totalWeightedScore = 0
    let totalWeight = 0
    const breakdown: Record<string, any> = {}

    // Process each agent result from individual channels
    const agentResults: Record<OptimizedAgentType, any> = {
      'technical-competency': state.technicalResult,
      'experience-growth': state.experienceResult,
      'impact-achievements': state.impactResult,
      'cultural-fit': state.culturalResult
    }

    Object.entries(OPTIMIZED_WEIGHTS).forEach(([agentType, weight]) => {
      const agentResult = agentResults[agentType as OptimizedAgentType]
      if (agentResult && !agentResult.error) {
        const weightedScore = agentResult.score * weight
        totalWeightedScore += weightedScore
        totalWeight += weight

        breakdown[agentType] = {
          score: agentResult.score,
          reasoning: agentResult.reasoning,
          weight: weight * 100,
          weightedScore: Math.round(weightedScore)
        }

        console.log(`🔍 [Orchestration] ${agentType}: score=${agentResult.score}, weight=${weight}, weighted=${weightedScore}`)
      }
    })

    // Calculate final score
    const finalScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0
    console.log(`🔍 [Orchestration] Final calculated score: ${finalScore}`)

    // Determine category
    const category = Object.entries(SCORE_CATEGORIES).find(([key, cat]) =>
      finalScore >= cat.min && finalScore <= cat.max
    )?.[0] || 'poor'

    const categoryDetails = SCORE_CATEGORIES[category]

    // Collect strengths, gaps, and errors from all agents
    const allStrengths: string[] = []
    const allGaps: string[] = []
    const collectedErrors: string[] = []

    // Collect from individual result channels
    const allResults = [
      { result: state.technicalResult, type: 'technical-competency' },
      { result: state.experienceResult, type: 'experience-growth' },
      { result: state.impactResult, type: 'impact-achievements' },
      { result: state.culturalResult, type: 'cultural-fit' }
    ]

    allResults.forEach(({ result, type }) => {
      if (result) {
        if ((result as any).error) {
          collectedErrors.push(`${type} agent failed`)
        } else {
          allStrengths.push(...(result.strengths || []))
          allGaps.push(...(result.gaps || []))
        }
      }
    })

    // Get top 5 strengths and weaknesses
    const keyStrengths = allStrengths.slice(0, 5)
    const keyWeaknesses = allGaps.slice(0, 5)

    // Generate interview focus areas
    const interviewFocus = keyWeaknesses.length > 0
      ? ['Verify key strengths', 'Address identified gaps', 'Assess cultural fit']
      : ['Standard competency assessment', 'Verify technical depth', 'Assess team collaboration']

    const executionTime = Date.now() - startTime
    console.log(`✅ [LangGraph] Orchestration completed in ${executionTime}ms`)

    return {
      finalScore: {
        overallScore: finalScore,
        category,
        breakdown,
        hiringRecommendation: `${categoryDetails.action} - Overall score: ${finalScore}%`,
        keyStrengths,
        keyWeaknesses,
        interviewFocus
      },
      totalExecutionTime: (state.totalExecutionTime || 0) + executionTime,
    }

  } catch (error) {
    console.error('❌ [LangGraph] Orchestration failed:', error)

    // Fallback orchestration
    return {
      finalScore: {
        overallScore: 50,
        category: 'fair',
        breakdown: {},
        hiringRecommendation: 'Manual review recommended - scoring system encountered errors',
        keyStrengths: ['Candidate requires manual evaluation'],
        keyWeaknesses: ['Automated scoring failed'],
        interviewFocus: ['Comprehensive manual assessment required']
      },
    }
  }
}

/**
 * Create optimized LangGraph workflow
 */
function createOptimizedScoringWorkflow() {
  const workflow = new StateGraph(ScoringStateAnnotation)
    // Add nodes
    .addNode("parseContext", parseSharedContext)
    .addNode("technicalCompetency", technicalCompetencyAgent)
    .addNode("experienceGrowth", experienceGrowthAgent)
    .addNode("impactAchievements", impactAchievementsAgent)
    .addNode("culturalFit", culturalFitAgent)
    .addNode("orchestration", orchestrationAgent)
    // Define workflow edges
    .addEdge("__start__", "parseContext")
    .addEdge("parseContext", "technicalCompetency")
    .addEdge("parseContext", "experienceGrowth")
    .addEdge("parseContext", "impactAchievements")
    .addEdge("parseContext", "culturalFit")
    .addEdge("technicalCompetency", "orchestration")
    .addEdge("experienceGrowth", "orchestration")
    .addEdge("impactAchievements", "orchestration")
    .addEdge("culturalFit", "orchestration")
    .addEdge("orchestration", "__end__")

  return workflow.compile()
}

/**
 * Main entry point for optimized LangGraph scoring
 */
export async function executeOptimizedLangGraphScoring(
  candidateData: { resume: string },
  jobData: JobSearchResult,
  userId?: string
): Promise<MultiAgentScoreResult> {

  console.log('🚀 [LangGraph] Starting optimized 4-agent scoring...')
  const startTime = Date.now()

  try {
    const workflow = createOptimizedScoringWorkflow()

    // Initialize state
    const initialState = {
      resume: candidateData.resume,
      jobData,
      userId,
      resumeAnalysis: { skills: [], experience: '', education: '', achievements: [] },
      jobRequirements: { requiredSkills: [], experienceLevel: '', responsibilities: [], qualifications: [] },
      technicalResult: undefined,
      experienceResult: undefined,
      impactResult: undefined,
      culturalResult: undefined,
      finalScore: {
        overallScore: 0,
        category: '',
        breakdown: {},
        hiringRecommendation: '',
        keyStrengths: [],
        keyWeaknesses: [],
        interviewFocus: []
      },
      totalExecutionTime: 0
    }

    // Execute workflow
    const result = await workflow.invoke(initialState)

    const totalTime = Date.now() - startTime
    console.log(`🎉 [LangGraph] Optimized scoring completed in ${totalTime}ms`)

    // Transform to MultiAgentScoreResult format for compatibility
    const typedResult = result as ScoringState

    // Validate that we have the required data
    if (!typedResult.finalScore) {
      throw new Error('LangGraph workflow failed to produce final score')
    }

    // Map our 4-agent results to the expected 6-agent breakdown format
    const standardBreakdown = {
      technicalSkills: {
        score: typedResult.technicalResult?.score || 0,
        reasoning: typedResult.technicalResult?.reasoning || 'Not evaluated',
        weight: 30
      },
      experienceDepth: {
        score: typedResult.experienceResult?.score || 0,
        reasoning: typedResult.experienceResult?.reasoning || 'Not evaluated',
        weight: 30
      },
      achievements: {
        score: typedResult.impactResult?.score || 0,
        reasoning: typedResult.impactResult?.reasoning || 'Not evaluated',
        weight: 25
      },
      education: {
        score: typedResult.culturalResult?.score || 0,
        reasoning: typedResult.culturalResult?.reasoning || 'Not evaluated',
        weight: 15
      },
      softSkills: {
        score: typedResult.impactResult?.score || 0, // Part of impact assessment
        reasoning: 'Evaluated as part of impact & achievements assessment',
        weight: 0 // Absorbed into impact-achievements
      },
      careerProgression: {
        score: typedResult.experienceResult?.score || 0, // Part of experience assessment
        reasoning: 'Evaluated as part of experience & growth assessment',
        weight: 0 // Absorbed into experience-growth
      }
    }

    // Convert string weaknesses to WeaknessDetail format
    const weaknessDetails = typedResult.finalScore.keyWeaknesses.map(weakness => ({
      weakness: weakness,
      impact: 'May affect job performance',
      improvementPlan: {
        shortTerm: 'Address during interview',
        midTerm: 'Develop through training or mentoring',
        longTerm: 'Monitor progress and provide ongoing support'
      }
    }))

    return {
      overallScore: typedResult.finalScore.overallScore,
      category: typedResult.finalScore.category as any,
      categoryDetails: {
        label: typedResult.finalScore.category,
        description: typedResult.finalScore.hiringRecommendation,
        action: 'Review candidate',
        color: '#6366f1'
      },
      breakdown: standardBreakdown,
      keyStrengths: typedResult.finalScore.keyStrengths,
      keyWeaknesses: weaknessDetails,
      redFlags: typedResult.finalScore.keyWeaknesses,
      positiveIndicators: typedResult.finalScore.keyStrengths,
      hiringRecommendation: typedResult.finalScore.hiringRecommendation,
      interviewFocus: typedResult.finalScore.interviewFocus,
      processedAt: new Date().toISOString(),
      totalProcessingTime: totalTime,
      executionSummary: {
        agentsExecuted: 4,
        totalExecutionTime: `${totalTime}ms`,
        scoringVersion: '4.0-langgraph-optimized'
      },
      agentResults: {
        scoring: {
          technicalSkills: typedResult.technicalResult ? {
            result: typedResult.technicalResult as any,
            executedAt: new Date().toISOString()
          } : undefined,
          experienceDepth: typedResult.experienceResult ? {
            result: typedResult.experienceResult as any,
            executedAt: new Date().toISOString()
          } : undefined,
          achievements: typedResult.impactResult ? {
            result: typedResult.impactResult as any,
            executedAt: new Date().toISOString()
          } : undefined,
          education: typedResult.culturalResult ? {
            result: typedResult.culturalResult as any,
            executedAt: new Date().toISOString()
          } : undefined
        },
        analysis: {},
        executionMetadata: {
          totalExecutionTime: totalTime,
          agentsExecuted: 4,
          timestamp: new Date().toISOString()
        }
      },
      // Aggregate usage data from all agents
      usage: aggregateOptimizedUsage({
        'technical-competency': typedResult.technicalResult,
        'experience-growth': typedResult.experienceResult,
        'impact-achievements': typedResult.impactResult,
        'cultural-fit': typedResult.culturalResult
      })
    }

  } catch (error) {
    console.error('💥 [LangGraph] Optimized scoring failed:', error)
    throw new Error(`LangGraph optimized scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Aggregate token usage from optimized agents
 */
function aggregateOptimizedUsage(agentResults: Record<OptimizedAgentType, any>) {
  let totalTokens = 0
  let promptTokens = 0
  let completionTokens = 0
  let cachedTokens = 0
  let estimatedCost = 0
  let costSavings = 0

  Object.values(agentResults).forEach(result => {
    if (result?.usage) {
      totalTokens += result.usage.totalTokens || 0
      promptTokens += result.usage.promptTokens || 0
      completionTokens += result.usage.completionTokens || 0
      cachedTokens += result.usage.cachedTokens || 0
      estimatedCost += result.usage.estimatedCost || 0
      costSavings += result.usage.costSavings || 0
    }
  })

  console.log(`💰 [LangGraph] Aggregated usage: ${totalTokens} tokens, $${estimatedCost.toFixed(4)}, saved $${costSavings.toFixed(4)}`)

  return {
    totalTokens,
    promptTokens,
    completionTokens,
    cachedTokens,
    estimatedCost,
    costSavings
  }
}
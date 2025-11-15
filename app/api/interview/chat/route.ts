import { NextRequest, NextResponse } from "next/server"
import { initFirebaseAdmin } from "@/lib/firebase-admin-init"
import { getAuth } from "firebase-admin/auth"
import { geminiClient } from "@/lib/gemini-client"
import {
  generateTipsPrompt,
  generateQuestionPrompt,
  generateFeedbackPrompt,
  generateGreetingPrompt,
  generateRecruiterScreenPrompt,
  generateTechnicalAssessmentPrompt,
  generateTechnicalBehavioralPrompt,
  generateTeamCultureFitPrompt
} from "@/lib/prompts/interview"
import type {
  InterviewType,
  InterviewQuestionType,
  InterviewFeedback
} from "@/lib/types"

/**
 * POST /api/interview/chat
 * Handle interview chat interactions
 */
export async function POST(req: NextRequest) {
  try {
    initFirebaseAdmin()
    const adminAuth = getAuth()

    // Authenticate user
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const userId = decoded.uid

    // Parse request body
    const body = await req.json()
    const {
      type, // 'greeting', 'tips', 'generate_question_by_type', 'analyze_answer'
      interviewType, // Current interview type (interview_tips, recruiter_screen, etc.)
      message, // User message (for tips mode or when asking questions)
      jobTitle,
      company,
      jobDescription,
      resume,
      previousQuestions, // Array of previous questions (to avoid repeats)
      question, // The question being answered
      questionType, // Type of the current question (for backward compatibility)
      userAnswer, // User's answer to analyze
      conversationHistory // Recent messages for context
    } = body

    // Validate required fields based on type
    if (!type || !jobTitle || !company) {
      return NextResponse.json(
        { error: "Missing required fields: type, jobTitle, company" },
        { status: 400 }
      )
    }

    let aiResponse: string
    let structuredData: any = null

    switch (type) {
      case 'greeting': {
        // Generate initial greeting
        const prompt = generateGreetingPrompt({
          jobTitle,
          company,
          jobDescription: jobDescription || '',
          resume: resume || ''
        })

        aiResponse = await geminiClient.generateText({
          prompt
        })

        break
      }

      case 'tips': {
        // Generate interview tips (can be initial or follow-up)
        if (!message) {
          // Initial tips request - pass interview type for specialized tips
          const prompt = generateTipsPrompt(
            {
              jobTitle,
              company,
              jobDescription: jobDescription || '',
              resume: resume || ''
            },
            interviewType as InterviewType
          )

          aiResponse = await geminiClient.generateText({
            prompt
          })
        } else {
          // Follow-up question about tips
          const typeContext = interviewType && interviewType !== 'interview_tips'
            ? `\nFocus your answer on ${interviewType.replace(/_/g, ' ')} preparation.\n`
            : ''

          const prompt = `You are an expert interview coach. The candidate is preparing for a ${jobTitle} position at ${company}.
${typeContext}
Previous context:
Job Description: ${jobDescription || 'Not provided'}
Candidate Resume: ${resume || 'Not provided'}

Conversation History:
${conversationHistory?.map((msg: any) => `${msg.type}: ${msg.content}`).join('\n') || 'None'}

Candidate's Question: ${message}

Provide a helpful, specific answer that helps them prepare for the interview. Be encouraging and actionable.`

          aiResponse = await geminiClient.generateText({
            prompt
          })
        }

        break
      }

      case 'generate_question': {
        // Generate an interview question
        if (!questionType) {
          return NextResponse.json(
            { error: "questionType is required for generate_question" },
            { status: 400 }
          )
        }

        const prompt = generateQuestionPrompt(
          {
            jobTitle,
            company,
            jobDescription: jobDescription || '',
            resume: resume || '',
            previousQuestions: previousQuestions || []
          },
          questionType as InterviewQuestionType
        )

        const response = await geminiClient.generateText({
          prompt
        })

        // Parse JSON response
        try {
          // Extract JSON from response (handle cases where AI adds markdown)
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            structuredData = JSON.parse(jsonMatch[0])
            aiResponse = structuredData.question
          } else {
            // Fallback if no JSON found
            aiResponse = response
            structuredData = {
              type: questionType,
              question: response,
              context: "Technical assessment"
            }
          }
        } catch (parseError) {
          console.error("Failed to parse question JSON:", parseError)
          // Use response as-is if parsing fails
          aiResponse = response
          structuredData = {
            type: questionType,
            question: response,
            context: "Interview question"
          }
        }

        break
      }

      case 'generate_question_by_type': {
        // Generate interview question based on interview type
        if (!interviewType) {
          return NextResponse.json(
            { error: "interviewType is required for generate_question_by_type" },
            { status: 400 }
          )
        }

        const context = {
          jobTitle,
          company,
          jobDescription: jobDescription || '',
          resume: resume || '',
          previousQuestions: previousQuestions || []
        }

        let prompt: string

        // Select prompt function based on interview type
        switch (interviewType) {
          case 'interview_tips':
            // Tips mode - no questions, just return error
            return NextResponse.json(
              { error: "Interview Tips mode does not generate questions" },
              { status: 400 }
            )

          case 'recruiter_screen':
            prompt = generateRecruiterScreenPrompt(context)
            break

          case 'technical_assessment':
            prompt = generateTechnicalAssessmentPrompt(context)
            break

          case 'technical_behavioral':
            prompt = generateTechnicalBehavioralPrompt(context)
            break

          case 'team_culture_fit':
            prompt = generateTeamCultureFitPrompt(context)
            break

          default:
            return NextResponse.json(
              { error: `Unknown interview type: ${interviewType}` },
              { status: 400 }
            )
        }

        const response = await geminiClient.generateText({
          prompt
        })

        // Parse JSON response
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            structuredData = JSON.parse(jsonMatch[0])
            aiResponse = structuredData.question
          } else {
            // Fallback if no JSON found
            aiResponse = response
            structuredData = {
              type: interviewType,
              question: response,
              context: "Interview question"
            }
          }
        } catch (parseError) {
          console.error("Failed to parse question JSON:", parseError)
          aiResponse = response
          structuredData = {
            type: interviewType,
            question: response,
            context: "Interview question"
          }
        }

        break
      }

      case 'analyze_answer': {
        // Analyze user's answer and provide feedback
        if (!question || !userAnswer || !questionType) {
          return NextResponse.json(
            { error: "question, userAnswer, and questionType are required for analyze_answer" },
            { status: 400 }
          )
        }

        const prompt = generateFeedbackPrompt({
          jobTitle,
          company,
          jobDescription: jobDescription || '',
          resume: resume || '',
          question,
          questionType: questionType as InterviewQuestionType,
          userAnswer
        })

        const response = await geminiClient.generateText({
          prompt
        })

        // Parse JSON response
        try {
          // Extract JSON from response
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const feedback: InterviewFeedback = JSON.parse(jsonMatch[0])
            structuredData = feedback
            aiResponse = `Great! I've analyzed your answer. Here's your feedback:\n\n**Rating:** ${feedback.rating}\n**Score:** ${feedback.score}/10`
          } else {
            throw new Error("No JSON found in response")
          }
        } catch (parseError) {
          console.error("Failed to parse feedback JSON:", parseError)
          return NextResponse.json(
            { error: "Failed to parse AI feedback response" },
            { status: 500 }
          )
        }

        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      response: aiResponse,
      data: structuredData,
      type
    })

  } catch (error) {
    console.error("[Interview][Chat] Error:", error)
    return NextResponse.json(
      { error: "Failed to process interview chat request" },
      { status: 500 }
    )
  }
}

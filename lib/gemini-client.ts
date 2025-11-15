// lib/gemini-client.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
//create a const for the model
const MODEL = 'gemini-2.5-flash-lite'

export class GeminiClient {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null

  constructor() {
    // Lazy initialization - don't validate API key until first use
    // This prevents build-time failures during Next.js page data collection
  }

  private ensureInitialized() {
    if (this.genAI && this.model) {
      return // Already initialized
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }

    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({
      model: MODEL // Using the latest available model
    })
  }

  async generateResumeTailoring({
    resume,
    jobDescription,
    userRequest,
    jobTitle,
    company
  }: {
    resume: string
    jobDescription: string
    userRequest: string
    jobTitle: string
    company: string
  }) {
    this.ensureInitialized() // Initialize on first use

    const prompt = `You are an expert resume optimization specialist. Please tailor the provided resume for the specific job opportunity.

**Job Information:**
- Position: ${jobTitle}
- Company: ${company}
- Job Description: ${jobDescription}

**Current Resume:**
${resume}

**User Request:** ${userRequest}

**Instructions:**
1. Analyze the job requirements and identify key skills, qualifications, and keywords
2. Optimize the resume content to highlight relevant experience and skills
3. Ensure ATS (Applicant Tracking System) compatibility with appropriate keywords
4. Maintain the original resume structure and formatting
5. Enhance achievements with quantifiable results where possible
6. Address any gaps between the resume and job requirements

**Please provide:**
1. **Tailored Resume** - The optimized resume in clean markdown format
2. **Optimization Summary** - A brief summary of the key changes made

Return your response in the following JSON format:
\`\`\`json
{
  "tailoredResume": "The complete optimized resume in markdown format",
  "optimizationSummary": "Brief summary of key improvements made",
  "keyChanges": ["change1", "change2", "change3"],
  "matchingScore": 85
}
\`\`\`

Focus on creating a compelling, relevant resume that effectively showcases the candidate's qualifications for this specific role.`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Try to extract JSON from the response (best-effort)
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        try {
          // Sanitize common control characters that break JSON.parse
          const sanitized = jsonMatch[1]
            .replace(/\r/g, '')
            // Remove stray control chars except tab/newline
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
          const parsedResult = JSON.parse(sanitized)
          return {
            success: true,
            ...parsedResult,
            rawResponse: text
          }
        } catch (e) {
          console.warn('Gemini JSON parse failed, falling back to raw text:', e)
          // Fall through to text fallback below
        }
      }

      {
        // Fallback if JSON parsing fails
        return {
          success: true,
          tailoredResume: text,
          optimizationSummary: "Resume successfully tailored using Gemini AI",
          keyChanges: ["Enhanced content for job relevance"],
          matchingScore: 80,
          rawResponse: text
        }
      }
    } catch (error) {
      console.error('Gemini API error:', error)
      throw new Error(`Gemini API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateJobAnalysis({
    resume,
    jobDescription,
    jobTitle,
    company
  }: {
    resume: string
    jobDescription: string
    jobTitle: string
    company: string
  }) {
    this.ensureInitialized() // Initialize on first use

    const prompt = `Analyze this job opportunity against the provided resume and provide a professional assessment.

**Job Information:**
- Position: ${jobTitle}
- Company: ${company}
- Job Description: ${jobDescription}

**Resume:**
${resume}

Please provide a comprehensive analysis in JSON format:
\`\`\`json
{
  "overallScore": 75,
  "category": "good",
  "breakdown": {
    "technicalSkills": {"score": 80, "reasoning": "Strong match on key technologies"},
    "experience": {"score": 70, "reasoning": "Relevant experience level"},
    "achievements": {"score": 60, "reasoning": "Some quantified results shown"},
    "education": {"score": 85, "reasoning": "Educational background aligns well"}
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["recommendation1", "recommendation2"]
}
\`\`\``

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      } else {
        return {
          overallScore: 70,
          category: "good",
          breakdown: {
            technicalSkills: { score: 70, reasoning: "Analysis completed" },
            experience: { score: 70, reasoning: "Experience evaluated" },
            achievements: { score: 65, reasoning: "Achievements reviewed" },
            education: { score: 75, reasoning: "Education assessed" }
          },
          strengths: ["Relevant experience", "Good technical background"],
          weaknesses: ["Could use more specific achievements"],
          recommendations: ["Quantify your accomplishments", "Highlight relevant projects"]
        }
      }
    } catch (error) {
      console.error('Gemini job analysis error:', error)
      throw new Error(`Gemini job analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generic text generation method for interview and other features
   */
  async generateText({
    prompt,
    model = MODEL,
    temperature = 0.7,
    maxOutputTokens = 2048
  }: {
    prompt: string
    model?: string
    temperature?: number
    maxOutputTokens?: number
  }): Promise<string> {
    this.ensureInitialized() // Initialize on first use

    try {
      const targetModel = this.genAI!.getGenerativeModel({
        model,
        generationConfig: {
          temperature,
          maxOutputTokens
        }
      })

      const result = await targetModel.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Gemini generateText error:', error)
      throw new Error(`Gemini text generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export const geminiClient = new GeminiClient()

// Q&A helper for Ask mode
export async function generateQAAnswer({
  resume,
  jobDescription,
  userRequest,
  jobTitle,
  company,
  history = []
}: {
  resume: string
  jobDescription: string
  userRequest: string
  jobTitle: string
  company: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is required')

  // Keep as much history as possible within a rough character budget
  const MAX_HISTORY_CHARS = 16000
  const pruned: typeof history = []
  let used = 0
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i]
    const size = (msg.content || '').length + 20
    if (used + size > MAX_HISTORY_CHARS) break
    pruned.unshift(msg)
    used += size
  }

  const historyText = pruned
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  const prompt = `You are an expert career advisor and resume consultant.

Job Information:
- Title: ${jobTitle}
- Company: ${company}
- Job Description: ${jobDescription}

User's Resume:
${resume}

Conversation so far (most recent last):
${historyText || '(no previous messages)'}

User's Question / Instruction:
${userRequest}

Instructions:
- Answer ONLY the user's question or perform ONLY the requested transformation.
- Do not describe what you did unless explicitly asked.
- If the user requests a specific output format (e.g., JSON array), follow it exactly.
- Do not generate a tailored resume unless explicitly asked.
- Keep the response concise and directly useful.`

  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7
    }
  })

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  return { reply: text }
}
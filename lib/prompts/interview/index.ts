import type { InterviewQuestionType, InterviewType } from '@/lib/types'

/**
 * Interview Preparation Prompts
 *
 * This module provides AI prompts for interview preparation including:
 * - Tips and strategy guidance
 * - Question generation (technical, behavioral, company fit, resume-based)
 * - Answer analysis and feedback
 */

interface InterviewContext {
  jobTitle: string
  company: string
  jobDescription: string
  resume: string
  previousQuestions?: string[]
}

interface AnswerAnalysisContext extends InterviewContext {
  question: string
  questionType: InterviewQuestionType
  userAnswer: string
}

/**
 * Generate interview preparation tips (general or type-specific)
 * Routes to specialized tip functions based on interview type
 */
export function generateTipsPrompt(context: InterviewContext, interviewType?: InterviewType): string {
  // Route to specialized tip functions based on interview type
  switch (interviewType) {
    case 'interview_tips':
      return generateGeneralInterviewTips(context)
    case 'recruiter_screen':
      return generateRecruiterScreeningTips(context)
    case 'technical_assessment':
      return generateTechnicalAssessmentTips(context)
    case 'technical_behavioral':
      return generateTechnicalBehavioralTips(context)
    case 'team_culture_fit':
      return generateTeamCultureFitTips(context)
    default:
      // Fallback to general tips if no type specified
      return generateGeneralInterviewTips(context)
  }
}

/**
 * Generate a single interview question
 */
export function generateQuestionPrompt(
  context: InterviewContext,
  questionType: InterviewQuestionType
): string {
  const typeInstructions = {
    technical: `Generate a technical question that tests:
- Specific technical skills mentioned in the job description
- Problem-solving ability in their domain
- Practical application of technologies they claim to know
- Depth of understanding vs surface knowledge

The question should be realistic for an actual interview and appropriate for the role's seniority level.`,

    behavioral: `Generate a behavioral interview question using the STAR method framework:
- Focus on competencies critical for this role
- Ask about situations, tasks, actions, and results
- Draw from common challenges in this type of position
- Allow the candidate to showcase their problem-solving and interpersonal skills

Examples: dealing with conflict, handling failure, leading projects, overcoming obstacles.`,

    company_fit: `Generate a question that assesses:
- Motivation for applying to ${context.company}
- Understanding of company's mission and values
- Long-term career goals and how they align with the role
- What they know about the company's products/services/culture
- Why they want this specific role at this specific company`,

    resume_based: `Generate a question that digs deeper into their resume:
- Pick a specific project, achievement, or experience listed
- Ask for details about their role, decisions made, or challenges faced
- Probe for depth of involvement vs surface contribution
- Understand the impact and outcomes
- Verify claims and understand context

The question should feel natural and show genuine interest in their background.`
  }

  const previousQuestionsContext = context.previousQuestions && context.previousQuestions.length > 0
    ? `\n**Previous Questions Asked:**\n${context.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n**Important:** Do NOT repeat or closely paraphrase any of the previous questions. Generate a completely new question.`
    : ''

  return `You are an experienced technical recruiter conducting an interview for a ${context.jobTitle} position at ${context.company}.

**Job Description:**
${context.jobDescription}

**Candidate's Resume:**
${context.resume}
${previousQuestionsContext}

**Question Type Required:** ${questionType.replace('_', ' ').toUpperCase()}

${typeInstructions[questionType]}

**Generate ONE interview question following these guidelines:**

1. The question should be realistic and commonly asked in actual interviews
2. It should be relevant to both the job requirements and the candidate's background
3. The question should allow for a detailed answer (not yes/no)
4. If technical, include enough context that the question is clear
5. Avoid overly theoretical questions - focus on practical scenarios

**Response Format (JSON):**
{
  "type": "${questionType}",
  "question": "Your question here",
  "context": "Brief note on what you're looking to assess with this question"
}

Generate the question now:`
}

/**
 * Analyze a candidate's answer and provide feedback
 */
export function generateFeedbackPrompt(context: AnswerAnalysisContext): string {
  return `You are an expert interview coach analyzing a candidate's answer. Provide detailed, constructive feedback.

**Interview Context:**
- Position: ${context.jobTitle}
- Company: ${context.company}
- Question Type: ${context.questionType.replace('_', ' ').toUpperCase()}

**Question Asked:**
${context.question}

**Candidate's Answer:**
${context.userAnswer}

**Job Requirements (for reference):**
${context.jobDescription.substring(0, 500)}...

**Candidate's Background (for reference):**
${context.resume.substring(0, 500)}...

**Analyze this answer comprehensively:**

1. **Overall Assessment**
   - Rate the answer quality: excellent, good, or needs_improvement
   - Provide a score from 1-10

2. **Strengths** (2-4 specific points)
   - What did they do well?
   - Strong examples, clear communication, relevant experience
   - Alignment with job requirements
   - Confidence and professionalism

3. **Areas for Improvement** (2-4 specific points)
   - What could be strengthened?
   - Missing key elements (especially for STAR method if behavioral)
   - Missed opportunities to highlight relevant skills
   - Vague language or lack of specifics
   - Areas that need more depth or clarity

4. **Suggested Enhanced Answer**
   - Rewrite their answer incorporating improvements
   - Keep their core points but add missing elements
   - Show how to structure it better
   - Include specific examples from their resume if applicable
   - Keep it realistic (not overly polished)

**Response Format (JSON):**
{
  "rating": "excellent" | "good" | "needs_improvement",
  "score": 7,
  "strengths": [
    "First specific strength...",
    "Second specific strength...",
    "Third specific strength..."
  ],
  "improvements": [
    "First specific improvement...",
    "Second specific improvement...",
    "Third specific improvement..."
  ],
  "suggestedAnswer": "Enhanced version of their answer that incorporates the improvements while maintaining their voice..."
}

**Important Guidelines:**
- Be encouraging but honest
- Focus on actionable feedback
- Reference the job requirements and their background
- For behavioral questions, check if they used STAR method
- For technical questions, assess depth and accuracy
- For company fit questions, evaluate research and genuine interest
- For resume-based questions, look for depth and ownership

Provide the feedback now:`
}

/**
 * Generate a follow-up or next question based on conversation history
 */
export function generateNextQuestionPrompt(
  context: InterviewContext,
  conversationHistory: { type: string; question: string; feedback?: any }[]
): string {
  const questionTypes = ['technical', 'behavioral', 'company_fit', 'resume_based']
  const askedTypes = conversationHistory.map(h => h.type)
  const typeDistribution = questionTypes.map(type => ({
    type,
    count: askedTypes.filter(t => t === type).length
  }))

  // Find question type that has been asked least
  const leastAskedType = typeDistribution.sort((a, b) => a.count - b.count)[0].type as InterviewQuestionType

  return generateQuestionPrompt(context, leastAskedType)
}

/**
 * Generate initial greeting message when starting an interview session
 */
export function generateGreetingPrompt(context: InterviewContext): string {
  return `Generate a friendly, professional greeting message for starting an interview preparation session.

**Context:**
- Position: ${context.jobTitle}
- Company: ${context.company}

**The message should:**
1. Welcome them to the interview preparation session
2. Briefly explain that this is AI-powered practice
3. Offer two modes:
   - **Tips Mode**: Get strategic guidance, company insights, and preparation advice
   - **Practice Mode**: Answer interview questions and receive detailed feedback
4. Ask which mode they'd like to start with
5. Mention they can switch modes anytime

**Keep it:**
- Warm and encouraging
- Professional but friendly
- Concise (4-5 sentences)
- Motivating

Generate the greeting message now (plain text, not JSON):`
}

// ============================================================================
// Specialized Tips Generation for Each Interview Type
// ============================================================================

/**
 * Generate general interview tips (for "Interview Tips & Guidance" type)
 */
export function generateGeneralInterviewTips(context: InterviewContext): string {
  return `You are an expert career coach providing comprehensive interview preparation guidance.

**Job Details:**
- Position: ${context.jobTitle}
- Company: ${context.company}

**Job Description:**
${context.jobDescription}

**Candidate's Resume:**
${context.resume}

**Provide comprehensive general interview preparation tips covering:**

## 1. Pre-Interview Preparation (Essential Steps)
   - Research the company: culture, recent news, products/services, competitors
   - Review the job description thoroughly and match your experience to each requirement
   - Prepare your "tell me about yourself" 2-minute pitch
   - Practice common interview questions out loud
   - Prepare questions to ask the interviewer (5-7 thoughtful questions)
   - Plan your outfit, route, and arrive 10-15 minutes early (or test video setup)

## 2. The STAR Method Framework
   - **S**ituation: Set the context (where, when, what was happening)
   - **T**ask: Explain your responsibility or the challenge
   - **A**ction: Describe specific steps YOU took (not the team - focus on your contribution)
   - **R**esult: Share measurable outcomes, lessons learned, impact created
   - **Practice 5-7 STAR stories** that demonstrate different skills

## 3. Key Skills to Emphasize for ${context.jobTitle}
   - Identify the 3-5 most critical skills from the job description
   - Match each skill to specific examples from your resume
   - Prepare to discuss: technical skills, soft skills, leadership, problem-solving
   - Use industry terminology that shows you understand the domain

## 4. Common Interview Questions & How to Approach Them
   - "Tell me about yourself" → Career narrative, not life story
   - "Why this company?" → Show research + alignment with values/mission
   - "Why are you leaving your current role?" → Stay positive, focus on growth
   - "What's your greatest weakness?" → Show self-awareness + improvement efforts
   - "Where do you see yourself in 5 years?" → Align with company's growth path
   - "Why should we hire you?" → Unique value proposition + cultural fit

## 5. Body Language & Communication Tips
   - Maintain eye contact (or look at camera for virtual interviews)
   - Smile genuinely and show enthusiasm for the role
   - Sit up straight, use open body language
   - Speak clearly and at a moderate pace
   - Pause before answering to collect your thoughts
   - Mirror the interviewer's energy level

## 6. Red Flags to Avoid
   - Speaking negatively about current/past employers
   - Being unprepared or not knowing about the company
   - Focusing only on what you'll get (salary, benefits) vs what you'll contribute
   - Giving one-word answers or rambling without structure
   - Not asking any questions (shows lack of interest)
   - Checking your phone or appearing distracted

## 7. Questions to Ask the Interviewer
   *Choose 3-4 based on who you're interviewing with:*

   **For Hiring Managers:**
   - "What does success look like in this role in the first 90 days?"
   - "What are the biggest challenges the team is currently facing?"
   - "How does this role contribute to the company's strategic goals?"

   **For Team Members:**
   - "What do you enjoy most about working here?"
   - "How would you describe the team culture?"
   - "What does a typical day/week look like in this role?"

   **For Executives:**
   - "What's your vision for the company over the next 2-3 years?"
   - "What qualities do the most successful employees here share?"

## 8. Post-Interview Follow-Up
   - Send a thank-you email within 24 hours
   - Reference specific topics discussed to show attentiveness
   - Reiterate your interest and key qualifications
   - Keep it concise (3-4 paragraphs maximum)

**Remember:** Interviews are two-way conversations. You're evaluating them as much as they're evaluating you. Show genuine curiosity, be authentic, and let your passion for the work shine through.

**Format your response with clear headings and bullet points. Be specific and reference the candidate's actual experience where relevant.**`
}

/**
 * Generate recruiter screening tips
 */
export function generateRecruiterScreeningTips(context: InterviewContext): string {
  return `You are an expert career coach preparing a candidate for a recruiter/HR phone screening interview.

**Job Details:**
- Position: ${context.jobTitle}
- Company: ${context.company}

**Job Description:**
${context.jobDescription}

**Candidate's Resume:**
${context.resume}

**Provide specialized tips for RECRUITER SCREENING interviews:**

## 1. Understanding Recruiter Screening Purpose
   - **Goal:** Determine if you meet basic qualifications before investing in technical interviews
   - **Duration:** Typically 15-30 minutes (phone or video)
   - **Focus:** Culture fit, motivation, logistics, compensation expectations, timeline verification
   - **Key Point:** This is about screening OUT, not screening IN - avoid red flags

## 2. Preparation Checklist
   - Have your resume in front of you with dates, company names, and key achievements
   - Research the company: mission, values, recent news, products/services
   - Prepare your "elevator pitch" (30-60 seconds: who you are, what you do, what you're looking for)
   - Know your timeline: notice period, start date availability, any conflicts
   - Have salary expectations ready (research market rates for this role in your location)
   - Prepare 2-3 questions to ask the recruiter about the role and next steps

## 3. Common Recruiter Questions & How to Answer

   **"Walk me through your resume"**
   - Start with current/most recent role
   - Highlight progression and key achievements (30 seconds per role max)
   - Connect each role to skills relevant for THIS position
   - End with why you're excited about this opportunity

   **"Why are you looking to leave your current role?"**
   - Focus on seeking growth, new challenges, better alignment
   - NEVER badmouth your current employer
   - Frame it positively: "looking for" not "running from"

   **"Why are you interested in this position/company?"**
   - Show you've researched the company (mention specific products, values, or news)
   - Align your career goals with the role's growth potential
   - Explain how your skills match the job requirements
   - Express genuine enthusiasm

   **"What are your salary expectations?"**
   - Research market rates first (Glassdoor, Levels.fyi, Payscale)
   - Provide a range, not a single number
   - Base it on your experience level and the role's requirements
   - Say: "Based on my research and experience, I'm targeting $X-Y range, but I'm flexible depending on the full compensation package"
   - OR defer: "I'd like to learn more about the role and responsibilities first. What's the budget range for this position?"

## 4. Timeline & Logistics Questions
   - **Notice period:** Be honest about 2 weeks, 1 month, etc.
   - **Start date availability:** Give a realistic timeframe
   - **Location preferences:** Be clear about remote/hybrid/onsite expectations
   - **Relocation:** If applicable, express willingness or concerns upfront
   - **Work authorization:** Confirm you're authorized to work (if applicable)

## 5. Background Verification Preparation
   - **Employment dates:** Ensure your resume dates match LinkedIn and reality
   - **Gaps in employment:** Prepare brief, honest explanations (education, family, personal projects)
   - **Job titles:** Use official titles; if inflated on resume, be ready to explain
   - **Reason for leaving:** Have consistent story for each role transition

## 6. Red Flags Recruiters Look For (AVOID THESE)
   - Job hopping without explanation (multiple 6-12 month stints)
   - Salary expectations wildly outside the range
   - Speaking negatively about current/past employers or managers
   - Lack of basic knowledge about the company
   - Being unavailable or difficult to schedule
   - Vague or inconsistent answers about employment history
   - Not asking any questions (shows lack of interest)

## 7. Questions to Ask the Recruiter
   *Choose 2-3 from this list:*

   - "Can you walk me through the interview process and timeline?"
   - "What are the key qualities you're looking for in the ideal candidate?"
   - "How does this role fit into the team structure?"
   - "What's the team size and who would I be working with?"
   - "What are the next steps if we decide to move forward?"
   - "Is there anything on my resume you'd like me to clarify?"
   - "What's the work culture like at [Company]?"

## 8. Communication Best Practices
   - Answer concisely (1-2 minutes max per answer)
   - Use the STAR method for achievement examples
   - Be enthusiastic but professional
   - Mirror the recruiter's tone and energy
   - Take notes during the call
   - Smile while talking (it comes through in your voice)
   - Avoid "um," "like," excessive pauses

## 9. Salary Negotiation Strategy for This Stage
   - Don't commit to a specific number too early
   - Ask about the budgeted range first
   - If pressed, provide a researched range based on ${context.jobTitle} market rates
   - Consider total compensation: base, bonus, equity, benefits, PTO
   - It's okay to say: "I'm open to discussing compensation once we determine it's a mutual fit"

## 10. Post-Screening Follow-Up
   - Send a thank-you email within 2-4 hours
   - Reiterate your interest and key qualifications
   - Mention 1-2 specific topics you discussed
   - Confirm your availability for next steps
   - Keep it brief (3-4 sentences)

**Based on this candidate's background:**
${context.resume.substring(0, 500)}...

**Specific tips for THIS candidate:**
- Prepare a clear narrative connecting your experience to ${context.jobTitle} requirements
- Address any potential concerns proactively (gaps, transitions, skill alignment)
- Emphasize your unique value proposition based on your background

**Remember:** Recruiters are gatekeepers, not decision-makers. Your goal is to pass this stage and get to the hiring manager. Be prepared, professional, and personable.

**Format your response with clear headings and actionable bullet points.**`
}

/**
 * Generate technical assessment tips
 */
export function generateTechnicalAssessmentTips(context: InterviewContext): string {
  return `You are an expert technical interview coach preparing a candidate for coding and technical assessments.

**Job Details:**
- Position: ${context.jobTitle}
- Company: ${context.company}

**Job Description:**
${context.jobDescription}

**Candidate's Technical Background:**
${context.resume}

**Provide specialized tips for TECHNICAL ASSESSMENT interviews:**

## 1. Understanding Technical Interview Formats
   - **Live Coding:** Write code while interviewer watches (whiteboard or shared editor)
   - **Take-Home Assignment:** 2-8 hours to build a project or solve problems
   - **System Design:** Architect scalable systems, discuss trade-offs
   - **Code Review:** Analyze and critique existing code
   - **Pair Programming:** Collaborate with interviewer on a problem
   - **Algorithm Challenges:** Solve data structure and algorithm problems

## 2. Pre-Interview Technical Preparation
   - Review fundamental data structures: arrays, linked lists, trees, graphs, hash tables, heaps
   - Practice algorithms: sorting, searching, recursion, dynamic programming, graph traversal
   - Know Big O complexity analysis (time and space)
   - Review system design patterns relevant to ${context.jobTitle}
   - Practice on platforms: LeetCode, HackerRank, CodeSignal (do 20-30 problems)
   - Set up your coding environment (IDE, editor, compiler) ahead of time
   - For virtual interviews: test screen sharing, audio, video

## 3. Problem-Solving Framework (Use This Every Time)

   **Step 1: Clarify the Problem (5 minutes)**
   - Restate the problem in your own words
   - Ask clarifying questions: input format, edge cases, constraints
   - Confirm assumptions: Can I use external libraries? What about time/space limits?
   - Example: "Just to confirm, the input is a sorted array and I need to find duplicates, correct?"

   **Step 2: Plan Your Approach (5-10 minutes)**
   - Discuss multiple approaches (brute force, optimal)
   - Explain trade-offs: time complexity vs space complexity
   - Choose an approach collaboratively
   - Walk through an example manually before coding
   - Sketch data structures or diagrams if helpful

   **Step 3: Code Your Solution (15-20 minutes)**
   - Think out loud as you code
   - Write clean, readable code with meaningful variable names
   - Handle edge cases: null inputs, empty arrays, single elements
   - Don't optimize prematurely - get working solution first
   - Leave space for improvements

   **Step 4: Test Your Code (5-10 minutes)**
   - Walk through your code with the example input
   - Test edge cases: empty input, single element, duplicates, large numbers
   - Identify bugs and fix them
   - Discuss how you'd test this in production

   **Step 5: Optimize & Discuss (5 minutes)**
   - Analyze time and space complexity
   - Discuss potential optimizations
   - Mention trade-offs or alternative approaches
   - Talk about scalability and real-world considerations

## 4. Communication During Technical Interviews
   - **Think out loud:** Verbalize your thought process constantly
   - **Ask questions:** It's better to clarify than assume
   - **Admit when stuck:** "I'm not sure about X, but here's what I'm thinking..."
   - **Use proper terminology:** Trees, nodes, pointers, recursion, iteration
   - **Explain trade-offs:** "This approach is O(n) time but uses O(n) space"
   - **Be collaborative:** Interviewers often give hints - listen and adapt

## 5. Common Technical Question Categories & How to Prepare

   **Arrays & Strings**
   - Two-pointer technique
   - Sliding window
   - Hash maps for frequency counting
   - Practice: reverse, rotate, find duplicates, anagrams

   **Linked Lists**
   - Traversal, reversal, cycle detection
   - Fast/slow pointer (Floyd's algorithm)
   - Practice: merge lists, detect cycles, find middle

   **Trees & Graphs**
   - DFS (Depth-First Search) and BFS (Breadth-First Search)
   - Tree traversal: preorder, inorder, postorder
   - Practice: validate BST, lowest common ancestor, shortest path

   **Dynamic Programming**
   - Identify overlapping subproblems
   - Memoization vs tabulation
   - Practice: Fibonacci, coin change, knapsack, longest subsequence

   **System Design (for senior roles)**
   - Load balancers, caching strategies, database sharding
   - CAP theorem, eventual consistency
   - Practice: Design Twitter, URL shortener, chat system

## 6. Technology-Specific Deep Dives
   Based on ${context.jobTitle}, be prepared to discuss:
   - Specific frameworks, libraries, and tools mentioned in the job description
   - Best practices and design patterns in your tech stack
   - Performance optimization techniques
   - Testing strategies (unit, integration, E2E)
   - CI/CD pipelines and deployment processes
   - Security best practices (authentication, authorization, data protection)

## 7. Live Coding Best Practices
   - **Use a language you're comfortable with** (ask if you can choose)
   - **Write syntactically correct code** (practice without IDE autocomplete)
   - **Comment your code** as you write to explain logic
   - **Use helper functions** to keep code modular and readable
   - **Don't panic if you make mistakes** - debugging is part of the process
   - **Manage your time** - don't spend 30 minutes on brute force if time is limited

## 8. Red Flags to Avoid
   - Going silent for long periods (always think out loud)
   - Jumping into code without understanding the problem
   - Not testing your solution or considering edge cases
   - Writing messy, unreadable code with poor variable names
   - Giving up too easily or saying "I don't know" without trying
   - Not asking clarifying questions
   - Being defensive when given feedback or hints

## 9. What to Do When You're Stuck
   - **Talk through your thought process:** "I'm considering X approach because..."
   - **Simplify the problem:** Start with a smaller input or special case
   - **Ask for a hint:** "I'm stuck on X - could you give me a hint about Y?"
   - **Discuss trade-offs:** Show you understand different approaches
   - **Move on strategically:** If stuck on optimization, implement brute force first

## 10. Take-Home Assignment Tips
   - **Read instructions carefully** and meet all requirements
   - **Write production-quality code:** clean, tested, documented
   - **Include a README:** setup instructions, assumptions, design decisions
   - **Add tests:** unit tests minimum, integration tests bonus
   - **Time-box yourself:** Don't spend 20 hours on a 4-hour assignment
   - **Show your best work:** This is your chance to shine without time pressure
   - **Ask questions if unclear:** Shows attention to detail

## 11. System Design Interview Strategy
   - **Clarify requirements:** Functional and non-functional (scale, latency, consistency)
   - **Estimate scale:** Users, requests/second, data storage needs
   - **Design high-level:** Start with basic components, then drill down
   - **Discuss trade-offs:** SQL vs NoSQL, sync vs async, caching strategies
   - **Address bottlenecks:** Load balancing, database sharding, CDNs
   - **Consider failure scenarios:** Redundancy, failover, data replication

## 12. Post-Interview Reflection
   - Take notes on questions you struggled with
   - Review solutions and alternative approaches
   - Practice similar problems
   - Research concepts you didn't know well

**Based on this candidate's background:**
${context.resume.substring(0, 500)}...

**Specific technical preparation for THIS candidate:**
- Review technologies mentioned in the job description: [extract key technologies]
- Prepare to discuss your most complex technical projects in depth
- Be ready to explain architectural decisions you've made
- Practice coding in your strongest language without IDE assistance

**Remember:** Technical interviews assess problem-solving ability, communication, and how you think under pressure - not just whether you get the "right" answer. Show your process, collaborate with the interviewer, and demonstrate continuous learning.

**Format your response with clear headings and actionable bullet points.**`
}

/**
 * Generate technical + behavioral tips
 */
export function generateTechnicalBehavioralTips(context: InterviewContext): string {
  return `You are an expert interview coach preparing a candidate for combined technical and behavioral interviews.

**Job Details:**
- Position: ${context.jobTitle}
- Company: ${context.company}

**Job Description:**
${context.jobDescription}

**Candidate's Background:**
${context.resume}

**Provide specialized tips for TECHNICAL + BEHAVIORAL interviews:**

## 1. Understanding the Hybrid Interview Format
   - **Purpose:** Assess BOTH technical skills AND soft skills (leadership, communication, problem-solving)
   - **Format:** Questions require technical depth + STAR method storytelling
   - **Examples:** "Tell me about a time you debugged a complex production issue" or "Describe a system you designed and why you made those architectural choices"
   - **Key Difference:** Not just "can you code?" but "can you lead technical initiatives, communicate decisions, and work with teams?"

## 2. The Technical STAR Method Framework
   Combine behavioral storytelling with technical depth:

   **S (Situation):** Set the technical context
   - What was the system/project/problem?
   - What technologies were involved?
   - What constraints existed (time, resources, scale)?
   - Example: "We had a microservices architecture handling 10K requests/second, but latency was spiking to 2 seconds"

   **T (Task):** Your technical responsibility
   - What was your specific role?
   - What technical challenges did you face?
   - What were the success criteria?
   - Example: "As the lead engineer, I was responsible for reducing latency to under 200ms while maintaining reliability"

   **A (Action):** Technical steps YOU took (not the team)
   - **This is where technical depth matters most**
   - Explain your analysis, investigation, and decision-making process
   - Discuss alternatives you considered and why you chose your approach
   - Mention tools, technologies, methodologies used
   - Show your technical judgment and trade-off analysis
   - Example: "I profiled the system using New Relic, identified database queries as the bottleneck, implemented Redis caching for frequently accessed data, and optimized our ORM queries. I also added connection pooling and adjusted our auto-scaling parameters"

   **R (Result):** Measurable technical outcomes + impact
   - Quantify results: latency reduced by X%, uptime improved to Y%, saved $Z
   - Discuss what you learned technically
   - Mention any broader impact (team productivity, customer satisfaction, revenue)
   - Example: "Reduced p95 latency from 2s to 180ms, improved uptime to 99.95%, and saved $15K/month in infrastructure costs. The team adopted this caching pattern across other services"

## 3. Common Technical + Behavioral Question Categories

   **Technical Problem-Solving Stories**
   - "Tell me about the most complex technical problem you've solved"
   - "Describe a time you had to debug a challenging production issue"
   - "Walk me through a performance optimization you implemented"

   **Architecture & Design Decisions**
   - "Describe a system you designed from scratch and the trade-offs you considered"
   - "Tell me about a time you had to refactor a legacy system"
   - "Explain an architectural decision you made that had significant impact"

   **Technical Leadership & Mentorship**
   - "How have you mentored junior engineers on your team?"
   - "Describe a time you influenced a technical decision across multiple teams"
   - "Tell me about a time you had to convince others to adopt your technical approach"

   **Collaboration & Communication**
   - "Describe a time you had to explain a complex technical concept to non-technical stakeholders"
   - "Tell me about a conflict with a team member over a technical decision"
   - "How do you handle code review feedback, especially when you disagree?"

   **Innovation & Impact**
   - "Tell me about a technical solution you built that had measurable business impact"
   - "Describe a time you introduced a new technology or process to your team"
   - "What's the most innovative technical solution you've implemented?"

   **Failure & Learning**
   - "Tell me about a time you made a technical mistake in production"
   - "Describe a project that didn't go as planned technically"
   - "What's the biggest technical failure you've experienced and what did you learn?"

## 4. Preparing Your Technical STAR Stories
   **Prepare 7-10 stories that demonstrate:**
   - Complex problem-solving
   - System design and architecture
   - Performance optimization
   - Technical leadership
   - Cross-functional collaboration
   - Handling production incidents
   - Mentoring and knowledge sharing
   - Dealing with technical debt
   - Learning from mistakes
   - Innovation and impact

   **For each story, prepare:**
   - 2-minute detailed version (with technical depth)
   - 30-second summary version
   - Technical diagrams or visuals (if virtual, have them ready to share)
   - Quantified outcomes and metrics

## 5. Balancing Technical Depth with Soft Skills
   **Technical Depth to Include:**
   - Specific technologies, frameworks, tools used
   - Performance metrics (latency, throughput, error rates)
   - Scale considerations (users, requests, data volume)
   - Trade-off analysis (time vs space, consistency vs availability)
   - Testing strategies and quality assurance

   **Soft Skills to Showcase:**
   - **Communication:** How you explained technical decisions to diverse audiences
   - **Leadership:** How you influenced technical direction or mentored others
   - **Collaboration:** How you worked with cross-functional teams (PM, design, QA)
   - **Problem-Solving:** Your analytical approach and creative solutions
   - **Adaptability:** How you handled changing requirements or pivoted approaches
   - **Ownership:** Taking responsibility for outcomes, even when things go wrong

## 6. Technical Communication Best Practices
   - **Use proper terminology** but avoid unnecessary jargon
   - **Explain your thought process** - why you chose one approach over another
   - **Use visuals** if helpful (draw diagrams, whiteboard architecture)
   - **Tailor technical depth** to your audience (adjust based on interviewer's reactions)
   - **Connect technical decisions to business impact** (not just "it's faster" but "improved user retention by 15%")
   - **Show humility** when discussing trade-offs or alternatives you considered

## 7. Red Flags to Avoid
   - Taking all the credit (use "I" for your contributions, "we" for team achievements)
   - Being too high-level without technical depth
   - Going too deep into technical details and losing the narrative
   - Not mentioning measurable results or impact
   - Blaming others (teammates, managers, stakeholders) for failures
   - Not showing what you learned from mistakes
   - Providing hypothetical answers instead of real examples

## 8. Questions to Ask (Technical + Behavioral Focus)
   *Choose 3-4 based on your interviewer:*

   **For Engineering Managers:**
   - "How does the team approach technical decision-making and architecture reviews?"
   - "What's the balance between working on new features vs technical debt?"
   - "How do you support professional growth and learning for engineers?"

   **For Senior Engineers:**
   - "What's the most technically challenging problem the team is working on?"
   - "How does the team handle technical disagreements or design debates?"
   - "What's the code review culture like?"

   **For Directors/VPs:**
   - "What's the technical vision for the platform over the next 1-2 years?"
   - "How do you balance innovation with reliability and stability?"
   - "What qualities do the most successful engineers at this company have?"

## 9. Demonstrating Technical Leadership (Without Being a Manager)
   Even if you're not in a formal leadership role, show:
   - **Ownership:** Taking end-to-end responsibility for projects
   - **Mentorship:** Helping junior engineers, code reviews, pair programming
   - **Influence:** Proposing technical improvements, leading RFCs, driving discussions
   - **Initiative:** Identifying problems and solving them proactively
   - **Documentation:** Writing technical specs, runbooks, architecture docs
   - **Cross-team collaboration:** Working with other teams to align technical approaches

## 10. Specific Preparation for ${context.jobTitle}
   Based on the job description and your background:
   - Identify your 3 strongest technical accomplishments that match job requirements
   - Prepare to discuss architectural patterns relevant to this role (microservices, event-driven, serverless, etc.)
   - Review recent technical trends and innovations in this domain
   - Be ready to discuss your approach to: testing, CI/CD, monitoring, incident response, technical debt

**Based on this candidate's background:**
${context.resume.substring(0, 500)}...

**Specific recommendations for THIS candidate:**
- Highlight technical projects where you demonstrated both technical excellence AND leadership/collaboration
- Prepare stories that show your growth from individual contributor to technical leader (if applicable)
- Be ready to discuss how you've balanced technical perfection with pragmatic delivery
- Emphasize your ability to communicate complex technical concepts to diverse audiences

**Remember:** This interview format assesses whether you can be a technical leader who not only writes great code but also drives impact, mentors others, and makes sound decisions. Show both your technical chops AND your ability to work effectively with people.

**Format your response with clear headings and actionable bullet points.**`
}

/**
 * Generate team & culture fit tips
 */
export function generateTeamCultureFitTips(context: InterviewContext): string {
  return `You are an expert interview coach preparing a candidate for team dynamics and culture fit assessments.

**Job Details:**
- Position: ${context.jobTitle}
- Company: ${context.company}

**Job Description:**
${context.jobDescription}

**Candidate's Background:**
${context.resume}

**Provide specialized tips for TEAM & CULTURE FIT interviews:**

## 1. Understanding Culture Fit Interviews
   - **Purpose:** Assess alignment with company values, work style, and team dynamics
   - **Who interviews:** Team members, managers, cross-functional partners, sometimes executives
   - **Focus:** How you work with others, handle conflict, adapt to change, communicate, and contribute to culture
   - **Key Point:** They're evaluating: "Would we want to work with this person every day?"

## 2. Research the Company Culture BEFORE the Interview
   - **Company website:** Read mission, values, "About Us," "Careers" pages
   - **Glassdoor reviews:** Look for patterns in employee feedback (pros/cons)
   - **LinkedIn:** Research employees, their backgrounds, how long they stay
   - **Social media:** Follow company accounts, see how they present themselves
   - **News articles:** Recent press, awards, company announcements
   - **Ask your network:** Do you know anyone who works there or knows someone who does?
   - **Identify:** What seems most important to this company? (Innovation? Collaboration? Customer focus? Speed? Quality?)

## 3. Common Culture Fit Question Categories & How to Answer

   **Work Style & Preferences**
   - "How do you prefer to work - independently or collaboratively?"
   - "Describe your ideal work environment"
   - "Do you prefer structured processes or flexibility?"

   **How to answer:**
   - Be honest but adaptable ("I thrive in collaborative environments, but I'm also comfortable working independently when needed")
   - Reference the company's culture if you've researched it
   - Give examples from past roles
   - Show you can adapt to different situations

   **Conflict Resolution & Difficult Conversations**
   - "Tell me about a time you disagreed with a coworker/manager"
   - "How do you handle conflict on a team?"
   - "Describe a difficult conversation you had and how you handled it"

   **How to answer using STAR:**
   - **Situation:** Set up the conflict objectively (avoid blame)
   - **Task:** Your goal (usually resolution, understanding, or finding a path forward)
   - **Action:** Specific steps you took (listening, seeking to understand, proposing solutions, compromising)
   - **Result:** How it was resolved, what you learned, relationship outcome
   - **Key:** Show maturity, empathy, and focus on solutions (not being "right")

   **Team Collaboration & Cross-Functional Work**
   - "Give me an example of a successful team project you worked on"
   - "How do you work with people from different departments (PM, design, marketing)?"
   - "Tell me about a time you had to collaborate with a difficult team member"

   **How to answer:**
   - Highlight your collaborative nature and communication skills
   - Show you value diverse perspectives
   - Demonstrate active listening and empathy
   - Mention specific collaboration tools/practices you use (standups, retros, Slack, etc.)

   **Company Values & Mission Alignment**
   - "Why do you want to work here?"
   - "What do you know about our company?"
   - "Which of our values resonates most with you?"
   - "What kind of company culture are you looking for?"

   **How to answer:**
   - Reference specific values from their website
   - Connect your personal values to company values with examples
   - Mention products, initiatives, or company news that excite you
   - Be genuine - don't just echo what you think they want to hear

   **Adaptability & Change Management**
   - "Tell me about a time you had to adapt to significant change"
   - "How do you handle ambiguity or shifting priorities?"
   - "Describe a time when a project direction changed mid-way"

   **How to answer:**
   - Show flexibility and positive attitude toward change
   - Emphasize learning and growth from change
   - Demonstrate resilience and problem-solving
   - Avoid complaining about change or appearing rigid

   **Diversity, Equity & Inclusion**
   - "How do you contribute to an inclusive work environment?"
   - "Tell me about a time you worked with someone very different from you"
   - "How do you ensure diverse perspectives are heard?"

   **How to answer:**
   - Show genuine commitment to DEI through specific examples
   - Discuss actively seeking out diverse viewpoints
   - Mention learning from people with different backgrounds/experiences
   - Demonstrate cultural awareness and empathy
   - Avoid generic or performative answers

## 4. Preparing Your Culture Fit STAR Stories
   **Prepare 5-7 stories that demonstrate:**
   - Successful collaboration with diverse team members
   - Handling conflict constructively
   - Adapting to organizational change
   - Contributing to positive team culture
   - Supporting and mentoring colleagues
   - Receiving and acting on feedback
   - Working across departments or functions
   - Demonstrating company values (once you know what they are)

## 5. What Interviewers Are Really Assessing
   - **Self-awareness:** Do you understand your strengths, weaknesses, and impact on others?
   - **Emotional intelligence:** Can you read situations, empathize, and navigate relationships?
   - **Communication style:** Are you clear, respectful, and effective in communication?
   - **Growth mindset:** Do you learn from feedback and challenges?
   - **Team player:** Will you support teammates and contribute to collective success?
   - **Cultural add (not just fit):** What unique perspectives or experiences do you bring?
   - **Long-term potential:** Will you be happy here? Will you stay and grow?

## 6. Questions to Ask (Culture Fit Focus)
   *These questions show you care about culture and team dynamics:*

   **For Team Members:**
   - "What do you enjoy most about working here?"
   - "How would you describe the team culture?"
   - "What's the collaboration style like between team members?"
   - "How does the team celebrate wins or handle setbacks?"
   - "What's something you wish you knew before joining?"

   **For Managers:**
   - "How do you support work-life balance for your team?"
   - "What does success look like for this role in the first 6 months?"
   - "How do you approach professional development for your team members?"
   - "What's the team's approach to giving and receiving feedback?"

   **For Cross-Functional Partners:**
   - "How does [your team] collaborate with [their team]?"
   - "What's the communication cadence like across teams?"
   - "How are decisions typically made in cross-functional projects?"

## 7. Red Flags to Avoid
   - Speaking negatively about current/past employers, managers, or colleagues
   - Appearing inflexible or resistant to feedback/change
   - Only talking about yourself (use "we" when discussing team achievements)
   - Showing lack of self-awareness ("I don't have any weaknesses")
   - Being overly critical or cynical
   - Not asking ANY questions about culture or team
   - Seeming only interested in perks, salary, title
   - Giving hypothetical answers instead of real examples
   - Not showing genuine enthusiasm for the company/role

## 8. Demonstrating Culture Add (Not Just Fit)
   Companies increasingly want "culture add" - what unique perspective you bring:
   - **Diverse experiences:** Different industries, roles, backgrounds
   - **Unique skills:** Hobbies, volunteer work, side projects that bring fresh perspective
   - **Different viewpoints:** Geographic, cultural, educational, professional diversity
   - **Complementary strengths:** What the team needs that you uniquely offer
   - **Frame it:** "I'd bring a unique perspective because..." not "I'm different because..."

## 9. Body Language & Communication for Culture Fit
   - **Be authentic:** Don't try to be someone you're not - it shows and isn't sustainable
   - **Show enthusiasm:** Smile, make eye contact, lean in when they speak
   - **Active listening:** Nod, take notes, ask follow-up questions
   - **Positive energy:** Even when discussing challenges, focus on solutions and learning
   - **Be present:** Put away phone, close other tabs, eliminate distractions
   - **Match their energy:** If they're casual and friendly, relax. If formal, be professional

## 10. Assessing If the Culture is Right for YOU
   **Remember: You're interviewing them too!**

   **Watch for red flags:**
   - Interviewers speak negatively about the company or team
   - Vague answers about culture or values
   - High turnover or many open roles
   - Lack of diversity in interview panel
   - Interviewers seem stressed, unhappy, or burnt out
   - Unclear growth opportunities or feedback processes

   **Look for green flags:**
   - Interviewers are enthusiastic about their work
   - Clear values that align with yours
   - Investment in employee development
   - Healthy work-life balance practices
   - Diverse and inclusive environment
   - Transparent communication
   - Team members genuinely seem to like working together

## 11. Specific Preparation for ${context.company}
   Based on research about ${context.company}:
   - What are their stated values? Prepare examples that demonstrate these
   - What's their reputation for work culture? (startup fast-paced vs established process-driven)
   - What do Glassdoor reviews mention most? Be ready to discuss those themes
   - What recent news or initiatives show what they prioritize?

**Based on this candidate's background:**
${context.resume.substring(0, 500)}...

**Specific recommendations for THIS candidate:**
- Highlight collaborative projects and cross-functional work from your resume
- Prepare examples showing adaptability, especially during role transitions
- Be ready to discuss how you've contributed to positive team culture in past roles
- Emphasize your alignment with ${context.company}'s values and mission

**Remember:** Culture fit is about mutual alignment - are you a good fit for them AND are they a good fit for you? Be authentic, show self-awareness, demonstrate strong interpersonal skills, and assess whether this is where you want to spend 40+ hours a week.

**Format your response with clear headings and actionable bullet points.**`
}

/**
 * Get question type label for display
 */
export function getQuestionTypeLabel(type: InterviewQuestionType): string {
  const labels: Record<InterviewQuestionType, string> = {
    technical: 'Technical / Skills',
    behavioral: 'Behavioral / STAR',
    company_fit: 'Company / Role Fit',
    resume_based: 'Resume Deep-Dive'
  }
  return labels[type]
}

/**
 * Get question type color for UI badges
 */
export function getQuestionTypeColor(type: InterviewQuestionType): string {
  const colors: Record<InterviewQuestionType, string> = {
    technical: 'blue',
    behavioral: 'purple',
    company_fit: 'green',
    resume_based: 'orange'
  }
  return colors[type]
}

/**
 * Get interview type label for display
 */
export function getInterviewTypeLabel(type: InterviewType): string {
  const labels: Record<InterviewType, string> = {
    interview_tips: 'Interview Tips & Guidance',
    recruiter_screen: 'Recruiter Screening',
    technical_assessment: 'Technical Assessment',
    technical_behavioral: 'Technical & Behavioral Interview',
    team_culture_fit: 'Team & Culture Fit'
  }
  return labels[type]
}

/**
 * Get interview type description
 */
export function getInterviewTypeDescription(type: InterviewType): string {
  const descriptions: Record<InterviewType, string> = {
    interview_tips: 'Get strategic guidance and interview preparation advice',
    recruiter_screen: 'Practice HR/recruiter screening questions',
    technical_assessment: 'Practice technical and coding challenges',
    technical_behavioral: 'Practice mixed technical and behavioral questions',
    team_culture_fit: 'Practice team dynamics and culture alignment questions'
  }
  return descriptions[type]
}

/**
 * Get interview type color for UI badges
 */
export function getInterviewTypeColor(type: InterviewType): string {
  const colors: Record<InterviewType, string> = {
    interview_tips: 'gray',
    recruiter_screen: 'blue',
    technical_assessment: 'purple',
    technical_behavioral: 'indigo',
    team_culture_fit: 'green'
  }
  return colors[type]
}

// ============================================================================
// Specialized Question Generation for Each Interview Type
// ============================================================================

/**
 * Generate recruiter screening question
 */
export function generateRecruiterScreenPrompt(context: InterviewContext): string {
  const previousContext = context.previousQuestions && context.previousQuestions.length > 0
    ? `\n**Previous Questions:**\n${context.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n**Avoid repeating these questions.**\n`
    : ''

  return `You are an HR recruiter conducting a phone screening for a ${context.jobTitle} position at ${context.company}.

**Job Description:**
${context.jobDescription}

**Candidate's Resume:**
${context.resume}
${previousContext}

**Generate ONE recruiter screening question from these categories:**

1. **Background Verification** - Confirm work history, timeline gaps, reason for leaving
2. **Motivation & Interest** - Why this role? Why this company? Career goals?
3. **Logistics** - Salary expectations, location/remote preferences, availability, notice period
4. **Cultural Screening** - Work style preferences, team dynamics, values alignment
5. **Basic Qualifications** - Confirm key skills, certifications, or requirements

**Guidelines:**
- Keep questions conversational and professional
- Focus on screening fit before technical deep-dive
- Question should reveal deal-breakers or red flags early
- Appropriate for a 15-30 minute phone screen

**Response Format (JSON):**
{
  "type": "recruiter_screen",
  "question": "Your question here",
  "context": "What you're trying to assess"
}

Generate the question now:`
}

/**
 * Generate technical assessment question
 */
export function generateTechnicalAssessmentPrompt(context: InterviewContext): string {
  const previousContext = context.previousQuestions && context.previousQuestions.length > 0
    ? `\n**Previous Questions:**\n${context.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n**Avoid repeating these questions.**\n`
    : ''

  return `You are a technical interviewer assessing coding and problem-solving skills for a ${context.jobTitle} position.

**Job Requirements:**
${context.jobDescription}

**Candidate's Technical Background:**
${context.resume}
${previousContext}

**Generate ONE technical assessment question from these categories:**

1. **Algorithms & Data Structures** - Problem-solving with optimal solutions
2. **System Design** - Design scalable systems, APIs, or architectures
3. **Code Review** - Analyze code snippets, identify issues, suggest improvements
4. **Debugging** - Diagnose and fix problems in provided code
5. **Technology-Specific** - Deep-dive into frameworks/tools they claim to know

**Guidelines:**
- Question should test practical skills, not just theory
- Match difficulty to role's seniority level
- Include enough context to be answerable
- Test understanding, not memorization
- Focus on technologies mentioned in job description

**Response Format (JSON):**
{
  "type": "technical_assessment",
  "question": "Your detailed technical question or problem statement here",
  "context": "What skill or concept you're assessing"
}

Generate the question now:`
}

/**
 * Generate technical + behavioral mixed question
 */
export function generateTechnicalBehavioralPrompt(context: InterviewContext): string {
  const previousContext = context.previousQuestions && context.previousQuestions.length > 0
    ? `\n**Previous Questions:**\n${context.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n**Avoid repeating these questions.**\n`
    : ''

  return `You are conducting a comprehensive interview for a ${context.jobTitle} position that combines technical and behavioral assessment.

**Job Description:**
${context.jobDescription}

**Candidate's Background:**
${context.resume}
${previousContext}

**Generate ONE question that combines technical AND behavioral elements:**

**Question Types:**
1. **Technical Challenge Story** - "Tell me about a time you solved a complex technical problem"
2. **Architecture Decision** - "Describe a system you designed and the trade-offs you made"
3. **Technical Leadership** - "How did you mentor someone on your team through a technical challenge?"
4. **Problem Resolution** - "Walk me through debugging a production issue you encountered"
5. **Innovation & Impact** - "Describe a technical solution you built that had measurable impact"

**Guidelines:**
- Question should elicit both STAR method (Situation, Task, Action, Result) AND technical depth
- Assess both soft skills (communication, leadership, problem-solving) and hard skills
- Allow candidate to showcase technical expertise through real examples
- Should reveal decision-making process and technical judgment

**Response Format (JSON):**
{
  "type": "technical_behavioral",
  "question": "Your question here that requires both technical and behavioral response",
  "context": "What combination of skills you're assessing"
}

Generate the question now:`
}

/**
 * Generate team & culture fit question
 */
export function generateTeamCultureFitPrompt(context: InterviewContext): string {
  const previousContext = context.previousQuestions && context.previousQuestions.length > 0
    ? `\n**Previous Questions:**\n${context.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n**Avoid repeating these questions.**\n`
    : ''

  return `You are assessing team dynamics and cultural fit for a ${context.jobTitle} position at ${context.company}.

**Company & Role:**
${context.jobDescription}

**Candidate's Background:**
${context.resume}
${previousContext}

**Generate ONE question about team dynamics and culture from these categories:**

1. **Work Style** - How they prefer to work, collaboration vs autonomy, communication style
2. **Conflict Resolution** - Handling disagreements, difficult conversations, team conflicts
3. **Team Collaboration** - Cross-functional work, supporting teammates, knowledge sharing
4. **Company Values Alignment** - Research on company culture, what they value in a workplace
5. **Adaptability** - Handling change, learning from feedback, navigating ambiguity
6. **Diversity & Inclusion** - Working with diverse teams, inclusive practices, different perspectives

**Guidelines:**
- Assess genuine cultural fit, not just "right answers"
- Look for self-awareness and emotional intelligence
- Questions should reveal how they work with others
- Avoid leading questions that telegraph desired answers
- Focus on behaviors and real examples, not hypotheticals

**Response Format (JSON):**
{
  "type": "team_culture_fit",
  "question": "Your question here that assesses team and culture alignment",
  "context": "What aspect of cultural fit you're evaluating"
}

Generate the question now:`
}

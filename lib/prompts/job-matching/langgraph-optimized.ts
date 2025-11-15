// lib/prompts/job-matching/langgraph-optimized.ts
/**
 * Optimized LangGraph Prompts for 4-Agent Job Scoring System
 *
 * These prompts are designed for token efficiency with shared context:
 * - Resume/job data is parsed once and shared
 * - Each agent focuses on specific expertise area
 * - Structured JSON output for consistent parsing
 */

import { PromptConfig } from '../types'
import { SYSTEM_ROLES } from '../shared/system-roles'
import { MODELS } from '../constants'

/**
 * Resume Parser for Shared Context
 * Parses resume once to reduce token usage across agents
 */
export const resumeParserOptimized: PromptConfig = {
  id: 'resume-parser-optimized',
  name: 'Resume Parser for Shared Context',
  description: 'Parse resume into structured format for agent reuse',
  version: '1.0',
  tags: ['parsing', 'optimization', 'langgraph'],

  systemRole: SYSTEM_ROLES.TECHNICAL_ANALYST,

  userTemplate: `Parse the following resume into a comprehensive structured format for job matching analysis.

**Resume:**
{resume}

Extract and organize information from the resume. If any information is missing, use reasonable defaults.

**CRITICAL: You MUST return valid JSON. Always include all fields even if empty.**

**Required JSON Output Format:**
{
  "skills": ["skill1", "skill2"],
  "experience": "Experience summary text",
  "education": "Education summary text",
  "achievements": ["achievement1", "achievement2"],
  "workHistory": [
    {
      "company": "Company name",
      "role": "Job title",
      "duration": "Duration",
      "responsibilities": ["responsibility1", "responsibility2"]
    }
  ],
  "yearsOfExperience": "X years",
  "currentLevel": "junior/mid/senior/lead"
}

**Instructions:**
1. Extract technical skills, programming languages, frameworks, tools
2. Summarize work experience with years calculation
3. Include education details: degrees, institutions, years
4. List quantifiable achievements and accomplishments
5. Create work history array with company details
6. Calculate total years of experience
7. Determine seniority level

**Default Values if Information Missing:**
- skills: ["General professional skills"]
- experience: "Professional experience details not specified"
- education: "Educational background not detailed"
- achievements: ["Professional accomplishments"]
- workHistory: [{"company": "Not specified", "role": "Not specified", "duration": "Not specified", "responsibilities": ["Professional duties"]}]
- yearsOfExperience: "Not specified"
- currentLevel: "mid"

**CRITICAL: Return ONLY the JSON object. No additional text before or after.**`,

  variables: ['resume'],
  model: MODELS.GPT5_MINI,
  responseFormat: { type: 'json' },

  expectedOutput: 'JSON object with structured resume data',

  temperature: 0.05,
  maxTokens: 2000
}

/**
 * Job Parser for Shared Context
 * Parses job requirements once to reduce token usage
 */
export const jobParserOptimized: PromptConfig = {
  id: 'job-parser-optimized',
  name: 'Job Parser for Shared Context',
  description: 'Parse job description into structured requirements for agent reuse',
  version: '1.0',
  tags: ['parsing', 'optimization', 'langgraph'],

  systemRole: SYSTEM_ROLES.HIRING_MANAGER,

  userTemplate: `Parse the following job posting into structured requirements for candidate evaluation.

**Job Title:** {jobTitle}
**Job Description:** {jobDescription}

Extract and organize the following information:

**Output the following JSON structure:**
{
  "requiredSkills": ["skill1", "skill2", "..."],
  "experienceLevel": "junior/mid/senior/lead/etc",
  "responsibilities": ["responsibility1", "responsibility2", "..."],
  "qualifications": ["qualification1", "qualification2", "..."]
}

Focus on:
- Required technical skills, tools, and technologies
- Experience level expectations (years, seniority)
- Key job responsibilities and duties
- Educational and certification requirements

Be precise and extract only explicitly stated requirements.`,

  variables: ['jobTitle', 'jobDescription'],
  model: MODELS.GPT5_MINI,
  responseFormat: { type: 'json' },

  expectedOutput: 'JSON object with structured job requirements',

  temperature: 0.1,
  maxTokens: 1000
}

/**
 * Technical Competency Agent (30% weight)
 * Evaluates technical skills + technical education
 */
export const langgraphTechnicalCompetency: PromptConfig = {
  id: 'langgraph-technical-competency',
  name: 'Technical Competency Agent - LangGraph Optimized',
  description: 'Evaluate technical skills and competency (30% weight)',
  version: '1.0',
  tags: ['scoring', 'technical', 'langgraph', 'optimized'],

  systemRole: SYSTEM_ROLES.TECHNICAL_LEAD,

  userTemplate: `You are a Technical Competency evaluator. Perform a deep technical assessment focusing ONLY on technical skills, tools, and programming expertise.

**Job Position:** {jobTitle} at {company}

**Parsed Resume Analysis:**
{resumeAnalysis}

**Parsed Job Requirements:**
{jobRequirements}

**TECHNICAL-SPECIFIC EVALUATION:**

**1. Programming Languages & Frameworks:**
- Identify exact programming languages mentioned in resume vs. required
- Assess framework expertise (React, Angular, Django, etc.)
- Evaluate depth vs. breadth of technical stack

**2. Technical Tools & Platforms:**
- Development tools (Git, Docker, CI/CD, etc.)
- Cloud platforms (AWS, Azure, GCP)
- Databases and data technologies
- DevOps and infrastructure tools

**3. Technical Certifications & Learning:**
- Industry certifications (AWS, Microsoft, Google, etc.)
- Technical bootcamps or specialized training
- Open source contributions or personal projects
- Technical blog posts or speaking engagements

**4. Technical Problem-Solving Evidence:**
- Code quality and architecture mentions
- Technical challenges solved
- Performance optimization examples
- Security implementation experience

**Scoring Guidelines:**
- 90-100: Expert-level technical mastery, exceeds all requirements
- 80-89: Strong technical competency with most required technologies
- 70-79: Solid technical foundation with some technology gaps
- 60-69: Basic technical skills, needs development in key areas
- Below 60: Insufficient technical background for role

**Output Format:**
{
  "score": <0-100>,
  "reasoning": "**TECHNICAL ASSESSMENT:**\n\n• **Programming Languages:** [specific analysis]\n• **Frameworks & Tools:** [specific analysis]\n• **Technical Depth:** [specific analysis]\n• **Certifications:** [specific analysis]\n\n**TECHNICAL SCORE BREAKDOWN:**\n• Languages Match: X/10\n• Tools Proficiency: X/10\n• Technical Experience: X/10\n• Certifications: X/10",
  "strengths": ["Specific technical strength 1", "Specific technical strength 2", "Specific technical strength 3"],
  "gaps": [
    {
      "weakness": "Specific missing technology or skill (e.g., 'No React experience shown')",
      "impact": "How this affects job performance (e.g., 'Cannot build frontend components immediately')",
      "improvementPlan": {
        "shortTerm": "Specific 1-month action (e.g., 'Complete React fundamentals course, build 2 practice projects')",
        "midTerm": "Specific 3-month goal (e.g., 'Contribute to React codebase, learn Redux/Context API')",
        "longTerm": "Specific 6+ month target (e.g., 'Become team React expert, mentor others')"
      }
    }
  ]
}

Focus EXCLUSIVELY on technical competencies. Do NOT discuss soft skills, management, or cultural fit.`,

  variables: ['jobTitle', 'company', 'resumeAnalysis', 'jobRequirements'],
  model: MODELS.GPT5_MINI,
  responseFormat: { type: 'json' },

  expectedOutput: 'JSON with technical competency score and analysis',

  temperature: 0.2,
  maxTokens: 2500
}

/**
 * Experience & Growth Agent (30% weight)
 * Evaluates experience depth + career progression
 */
export const langgraphExperienceGrowth: PromptConfig = {
  id: 'langgraph-experience-growth',
  name: 'Experience & Growth Agent - LangGraph Optimized',
  description: 'Evaluate experience depth and career progression (30% weight)',
  version: '1.0',
  tags: ['scoring', 'experience', 'langgraph', 'optimized'],

  systemRole: SYSTEM_ROLES.SENIOR_MANAGER,

  userTemplate: `You are an Experience & Growth evaluator. Analyze ONLY career progression, experience depth, and professional growth patterns.

**Job Position:** {jobTitle} at {company}

**Parsed Resume Analysis:**
{resumeAnalysis}

**Parsed Job Requirements:**
{jobRequirements}

**EXPERIENCE-SPECIFIC EVALUATION:**

**1. Experience Years & Seniority Alignment:**
- Calculate total years of relevant experience vs. job requirements
- Assess if candidate meets minimum experience thresholds
- Evaluate seniority level match (junior/mid/senior/lead)
- Identify any experience gaps or overqualification

**2. Career Progression Analysis:**
- Chart career trajectory: title progressions, salary increases, responsibility growth
- Identify promotion patterns and advancement speed
- Assess job stability vs. career growth balance
- Look for leadership evolution (individual contributor → team lead → manager)

**3. Industry & Domain Expertise:**
- Evaluate industry-specific experience depth
- Assess domain expertise relevance (fintech, healthcare, e-commerce, etc.)
- Identify cross-industry transferable skills
- Analyze company size experience (startup vs. enterprise)

**4. Role Complexity Evolution:**
- Track increasing project scope and complexity
- Assess team size management growth
- Evaluate budget/resource management experience
- Identify strategic vs. tactical role evolution

**Scoring Guidelines:**
- 90-100: Exceptional career trajectory, exceeds experience requirements
- 80-89: Strong progression with relevant depth, meets most requirements
- 70-79: Good career foundation with steady growth
- 60-69: Basic progression, some experience gaps
- Below 60: Insufficient experience or poor progression pattern

**Output Format:**
{
  "score": <0-100>,
  "reasoning": "**CAREER PROGRESSION ANALYSIS:**\n\n• **Experience Timeline:** [X years total, Y years relevant]\n• **Career Trajectory:** [progression pattern analysis]\n• **Seniority Match:** [level alignment assessment]\n• **Industry Depth:** [domain expertise evaluation]\n\n**PROGRESSION SCORE BREAKDOWN:**\n• Years of Experience: X/10\n• Career Growth Rate: X/10\n• Industry Relevance: X/10\n• Role Complexity: X/10",
  "strengths": ["Specific career strength 1", "Specific career strength 2", "Specific career strength 3"],
  "gaps": [
    {
      "weakness": "Specific experience gap (e.g., 'Only 2 years experience vs 5 years required')",
      "impact": "Career progression implication (e.g., 'May need senior guidance initially')",
      "improvementPlan": {
        "shortTerm": "Immediate experience building (e.g., 'Take on more complex projects, seek mentorship')",
        "midTerm": "Skill development focus (e.g., 'Lead small team, manage full project lifecycle')",
        "longTerm": "Career advancement path (e.g., 'Develop into senior role, build industry expertise')"
      }
    }
  ]
}

Focus EXCLUSIVELY on career progression and experience patterns. Do NOT discuss technical skills or personal attributes.`,

  variables: ['jobTitle', 'company', 'resumeAnalysis', 'jobRequirements'],
  model: MODELS.GPT5_MINI,
  responseFormat: { type: 'json' },

  expectedOutput: 'JSON with experience and growth score and analysis',

  temperature: 0.2,
  maxTokens: 2500
}

/**
 * Impact & Achievements Agent (25% weight)
 * Evaluates achievements + soft skills
 */
export const langgraphImpactAchievements: PromptConfig = {
  id: 'langgraph-impact-achievements',
  name: 'Impact & Achievements Agent - LangGraph Optimized',
  description: 'Evaluate impact, achievements and collaboration skills (25% weight)',
  version: '1.0',
  tags: ['scoring', 'achievements', 'langgraph', 'optimized'],

  systemRole: SYSTEM_ROLES.PERFORMANCE_MANAGER,

  userTemplate: `You are an Impact & Achievements evaluator. Analyze ONLY quantifiable business results, measurable achievements, and proven impact.

**Job Position:** {jobTitle} at {company}

**Parsed Resume Analysis:**
{resumeAnalysis}

**Parsed Job Requirements:**
{jobRequirements}

**IMPACT-SPECIFIC EVALUATION:**

**1. Quantifiable Business Results:**
- Revenue generation, cost savings, efficiency improvements (with specific numbers)
- Performance metrics: % increases, $ amounts, time reductions
- KPI achievements: user growth, conversion rates, system uptime
- Return on investment (ROI) examples with actual figures

**2. Project & Initiative Success:**
- Project delivery metrics: on-time, under-budget, scope completion
- Scale of projects: team size, budget size, timeline, complexity
- Cross-functional project leadership and stakeholder management
- Innovation projects and their measurable outcomes

**3. Recognition & Awards:**
- Industry awards, company recognition, peer nominations
- Performance rankings, top performer designations
- Speaking engagements, published articles, thought leadership
- Customer testimonials or satisfaction scores

**4. Team & Organizational Impact:**
- Team building results: retention rates, productivity improvements
- Mentoring success: promoted team members, skill development
- Process improvements: documented efficiency gains
- Knowledge sharing: training programs, documentation, best practices

**Scoring Guidelines:**
- 90-100: Exceptional quantifiable impact with industry recognition
- 80-89: Strong measurable results with consistent achievement pattern
- 70-79: Good track record with some quantifiable outcomes
- 60-69: Basic achievements with limited measurable impact
- Below 60: Minimal or no quantifiable business results

**Output Format:**
{
  "score": <0-100>,
  "reasoning": "**IMPACT & ACHIEVEMENTS ANALYSIS:**\n\n• **Financial Impact:** [revenue/cost savings with specific numbers]\n• **Performance Metrics:** [quantifiable improvements]\n• **Recognition:** [awards, rankings, testimonials]\n• **Leadership Impact:** [team/project success metrics]\n\n**IMPACT SCORE BREAKDOWN:**\n• Business Results: X/10\n• Project Success: X/10\n• Recognition Level: X/10\n• Team Impact: X/10",
  "strengths": ["Specific measurable achievement 1", "Specific measurable achievement 2", "Specific measurable achievement 3"],
  "gaps": [
    {
      "weakness": "Missing impact measurement (e.g., 'No quantified business results shown')",
      "impact": "Business consequence (e.g., 'Cannot demonstrate ROI or value delivery')",
      "improvementPlan": {
        "shortTerm": "Start tracking metrics (e.g., 'Begin measuring project outcomes, KPIs, user feedback')",
        "midTerm": "Build results portfolio (e.g., 'Document cost savings, efficiency gains, user adoption')",
        "longTerm": "Establish impact leadership (e.g., 'Drive major initiatives with measurable business outcomes')"
      }
    }
  ]
}

Focus EXCLUSIVELY on measurable achievements and business impact. Do NOT discuss technical skills or experience years.`,

  variables: ['jobTitle', 'company', 'resumeAnalysis', 'jobRequirements'],
  model: MODELS.GPT5_MINI,
  responseFormat: { type: 'json' },

  expectedOutput: 'JSON with impact and achievements score and analysis',

  temperature: 0.2,
  maxTokens: 2500
}

/**
 * Cultural & Educational Fit Agent (15% weight)
 * Evaluates education + cultural alignment
 */
export const langgraphCulturalFit: PromptConfig = {
  id: 'langgraph-cultural-fit',
  name: 'Cultural & Educational Fit Agent - LangGraph Optimized',
  description: 'Evaluate educational background and cultural fit (15% weight)',
  version: '1.0',
  tags: ['scoring', 'culture', 'education', 'langgraph', 'optimized'],

  systemRole: SYSTEM_ROLES.HR_SPECIALIST,

  userTemplate: `You are a Cultural & Educational Fit evaluator. Analyze ONLY educational credentials, learning patterns, and cultural alignment signals.

**Job Position:** {jobTitle} at {company}

**Parsed Resume Analysis:**
{resumeAnalysis}

**Parsed Job Requirements:**
{jobRequirements}

**EDUCATIONAL & CULTURAL-SPECIFIC EVALUATION:**

**1. Educational Credentials Assessment:**
- Degree relevance: Match between educational background and job requirements
- Institution quality: Educational institution reputation and program rigor
- Academic achievements: GPA, honors, scholarships, academic projects
- Specialized education: Relevant coursework, capstone projects, thesis topics

**2. Learning & Certification Patterns:**
- Professional certifications: Industry-recognized credentials and their currency
- Continuing education: Workshops, training programs, professional development
- Self-directed learning: Online courses, bootcamps, skill development initiatives
- Knowledge currency: Recent learning activities and technology adoption

**3. Cultural Alignment Indicators:**
- Work environment fit: Company size preference (startup agility vs enterprise structure)
- Collaboration style: Individual contributor vs team player orientation
- Communication patterns: Written communication quality and presentation skills
- Adaptability signals: Career pivots, technology transitions, role flexibility

**4. Professional Growth Mindset:**
- Learning agility: Speed of acquiring new skills and adapting to change
- Curiosity indicators: Side projects, research interests, innovation examples
- Professional involvement: Industry groups, conferences, thought leadership
- Mentoring evidence: Teaching, training others, knowledge sharing

**Scoring Guidelines:**
- 90-100: Exceptional educational credentials with strong cultural alignment
- 80-89: Strong academic foundation with good cultural fit indicators
- 70-79: Solid educational background with some cultural compatibility
- 60-69: Basic educational requirements met, cultural fit uncertain
- Below 60: Educational gaps or poor cultural alignment signals

**Output Format:**
{
  "score": <0-100>,
  "reasoning": "**EDUCATIONAL CREDENTIALS:**\\n\\n• **Degree Alignment:** [specific degree relevance analysis]\\n• **Institution Quality:** [educational background assessment]\\n• **Certifications:** [professional credentials evaluation]\\n• **Learning Currency:** [recent education activities]\\n\\n**CULTURAL FIT ANALYSIS:**\\n\\n• **Work Style Match:** [company culture alignment]\\n• **Communication Style:** [professional interaction patterns]\\n• **Learning Agility:** [adaptability and growth mindset]\\n• **Professional Engagement:** [industry involvement level]\\n\\n**EDUCATIONAL SCORE BREAKDOWN:**\\n• Degree Relevance: X/10\\n• Certifications: X/10\\n• Learning Agility: X/10\\n• Cultural Signals: X/10",
  "strengths": ["Specific educational strength 1", "Specific cultural strength 2", "Specific learning strength 3"],
  "gaps": [
    {
      "weakness": "Educational or cultural gap (e.g., 'No formal CS degree' or 'No startup experience')",
      "impact": "Workplace integration effect (e.g., 'May need guidance on company culture and practices')",
      "improvementPlan": {
        "shortTerm": "Cultural/educational bridging (e.g., 'Read company handbook, attend onboarding, find mentor')",
        "midTerm": "Skill/culture building (e.g., 'Take relevant courses, participate in team activities, learn company values')",
        "longTerm": "Integration mastery (e.g., 'Become cultural ambassador, contribute to learning initiatives')"
      }
    }
  ]
}

Focus EXCLUSIVELY on educational background, learning patterns, and cultural fit indicators. Do NOT discuss technical skills, work experience, or achievements.`,

  variables: ['jobTitle', 'company', 'resumeAnalysis', 'jobRequirements'],
  model: MODELS.GPT5_MINI,
  responseFormat: { type: 'json' },

  expectedOutput: 'JSON with cultural and educational fit score and analysis',

  temperature: 0.2,
  maxTokens: 2500
}

// Export all optimized templates
export const LANGGRAPH_OPTIMIZED_PROMPTS = {
  resumeParserOptimized,
  jobParserOptimized,
  langgraphTechnicalCompetency,
  langgraphExperienceGrowth,
  langgraphImpactAchievements,
  langgraphCulturalFit
}

export const langgraphOptimizedTemplates = [
  resumeParserOptimized,
  jobParserOptimized,
  langgraphTechnicalCompetency,
  langgraphExperienceGrowth,
  langgraphImpactAchievements,
  langgraphCulturalFit
]
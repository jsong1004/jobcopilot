import { NextResponse } from 'next/server'

/**
 * AI-Friendly Documentation Endpoint
 * Provides structured information about JobCopilot for AI search engines and assistants
 */
export async function GET() {
  const documentation = {
    service: {
      name: 'JobCopilot',
      tagline: 'AI-Powered Job Search Platform',
      description: 'JobCopilot transforms job searching with AI-powered matching scores, intelligent resume tailoring, automated cover letter generation, and comprehensive application tracking.',
      version: '2.0',
      type: 'SaaS Platform',
      category: 'Career Tools & Job Search',
    },

    capabilities: {
      'job_search': {
        description: 'Search and discover job opportunities with AI-powered matching',
        features: [
          'Real-time job search integration',
          'AI-powered job matching scores (0-100)',
          'Multi-agent analysis (technical skills, experience, achievements, education, soft skills, career progression)',
          'Automated job compatibility assessment',
          'Job tracking and management',
        ],
      },
      'resume_tools': {
        description: 'Comprehensive resume management and optimization',
        features: [
          'Resume upload (PDF, DOCX, Markdown)',
          'AI-powered resume tailoring for specific jobs',
          'Multi-agent resume optimization',
          'ATS-friendly formatting',
          'Multiple resume version management',
          'Markdown to PDF conversion',
        ],
      },
      'cover_letters': {
        description: 'AI-generated personalized cover letters',
        features: [
          'Automated cover letter generation',
          'Multiple style variants (Professional, Creative, Technical, Entry-Level)',
          'Job-specific customization',
          'Company research integration',
          'Cover letter library management',
        ],
      },
      'application_tracking': {
        description: 'Complete job application pipeline management',
        features: [
          'Application status tracking',
          'Interview reminders',
          'Notes and timeline management',
          'Activity dashboard',
          'Application analytics',
        ],
      },
    },

    ai_technology: {
      matching_engine: {
        description: 'Multi-agent AI system for job matching',
        agents: [
          'Technical Skills Analyzer',
          'Experience Evaluator',
          'Achievements Assessor',
          'Education Matcher',
          'Soft Skills Analyzer',
          'Career Progression Evaluator',
          'Integration & Synthesis Agent',
          'Quality Assurance Agent',
        ],
        output: 'Comprehensive matching score (0-100) with detailed breakdown',
      },
      resume_tailoring: {
        description: '8-agent system for resume optimization',
        capabilities: [
          'Job requirements analysis',
          'Skills alignment',
          'Experience optimization',
          'Achievements enhancement',
          'Keywords optimization',
          'ATS compatibility',
          'Industry-specific customization',
        ],
      },
      prompt_management: {
        description: 'Centralized AI prompt system',
        features: [
          'Prompt variants and caching',
          'Response optimization',
          'Context management',
          'Quality assurance',
        ],
      },
    },

    target_audience: {
      primary: [
        'Job seekers',
        'Career changers',
        'Recent graduates',
        'Tech professionals',
        'Remote job seekers',
      ],
      use_cases: [
        'Finding relevant job opportunities',
        'Optimizing resume for specific positions',
        'Generating customized cover letters',
        'Tracking multiple job applications',
        'Improving job search success rate',
      ],
    },

    technical_stack: {
      frontend: 'Next.js 15, React 19, TypeScript, Tailwind CSS',
      backend: 'Next.js API Routes, Firebase (Auth & Firestore)',
      ai: 'OpenRouter API, Multi-agent systems',
      deployment: 'Google Cloud Run, Docker',
      integrations: ['SerpApi', 'The Companies API', 'Firebase'],
    },

    endpoints: {
      public: [
        'GET /',
        'GET /saved-jobs',
        'GET /resumes',
        'GET /cover-letters',
        'GET /md-to-pdf',
        'GET /jobs/[id]',
        'GET /companies/[name]',
      ],
      api: [
        'POST /api/jobs/search',
        'POST /api/jobs/score',
        'POST /api/resumes',
        'POST /api/resume/tailor-multi-agent',
        'POST /api/cover-letter/generate',
        'POST /api/convert/md-to-pdf',
      ],
    },

    pricing: {
      model: 'Freemium',
      free_tier: {
        features: [
          'Unlimited job search',
          'Basic matching scores',
          'Resume upload and management',
          'Application tracking',
        ],
      },
      premium_tier: {
        features: [
          'Advanced AI matching',
          'Unlimited resume tailoring',
          'Unlimited cover letter generation',
          'Priority support',
          'Advanced analytics',
        ],
      },
    },

    data_handling: {
      privacy: 'User data is stored securely in Firebase with encryption',
      security: 'Firebase Authentication with OAuth support',
      compliance: 'GDPR compliant',
      data_retention: 'User controls their data with export and deletion options',
    },

    keywords: [
      'AI job search',
      'resume builder',
      'resume tailoring',
      'cover letter generator',
      'job application tracker',
      'ATS optimization',
      'job matching algorithm',
      'career tools',
      'AI resume optimizer',
      'automated job search',
      'job compatibility score',
    ],

    links: {
      website: process.env.NEXT_PUBLIC_SITE_URL || 'https://jobcopilot.app',
      documentation: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jobcopilot.app'}/api/ai-docs`,
      privacy: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jobcopilot.app'}/privacy-policy`,
      terms: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jobcopilot.app'}/terms-of-service`,
    },

    metadata: {
      last_updated: new Date().toISOString(),
      schema_version: '1.0',
      purpose: 'AI search engine optimization and assistant integration',
    },
  }

  return NextResponse.json(documentation, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'all',
    },
  })
}

# MyJob: AI-Powered Job Search Platform with Multi-Agent Resume Optimization

> **Next.js 15 • Firebase • OpenRouter AI • Multi-Agent System • Real-Time Streaming • Docker Ready**

[![Version](https://img.shields.io/badge/version-2.8.0-blue)](https://github.com/jsong1004/myjob)
[![Last Updated](https://img.shields.io/badge/last%20updated-December%202025-green)](https://github.com/jsong1004/myjob)
[![License](https://img.shields.io/badge/license-MIT-orange)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen)](DOCKER_README.md)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)

**MyJob** is a comprehensive, AI-driven platform revolutionizing the job search process with **8 specialized AI agents** for parallel resume optimization, intelligent job matching, AI-powered interview preparation, and real-time application tracking. Built with Next.js 15 App Router, Firebase, and Google Gemini AI.

**Keywords**: AI resume optimizer, job search automation, resume tailoring AI, cover letter generator, ATS optimization, AI interview coach, interview practice platform, Next.js job platform, Firebase authentication, multi-agent AI system, parallel AI processing, resume builder, job application tracker

**Perfect For**: Job seekers, career changers, resume optimization, technical interview prep, behavioral interview practice, recruiter screening preparation, ATS systems, recruiters, job search automation, career development

---

## 🚀 Quick Links

- **[📦 Docker Setup Guide](DOCKER_README.md)** - Complete containerization with Chromium/Puppeteer
- **[📚 Project Documentation](docs/PROJECT_INDEX.md)** - Comprehensive technical docs
- **[🔌 API Reference](docs/API_REFERENCE.md)** - 30 API endpoints documentation
- **[🧩 Component Guide](docs/COMPONENT_GUIDE.md)** - 60+ React components

---

## ✨ Core Features

### 🤖 Advanced AI-Powered Job Matching
- **Multi-Agent Scoring System:** 8 specialized AI agents analyze job compatibility across technical skills, experience depth, achievements, education, soft skills, career progression, strengths, and weaknesses
- **Parallel Processing:** 8x faster execution with weighted scoring algorithm providing detailed hiring manager insights
- **Smart Job Discovery:** Comprehensive pagination fetching hundreds of jobs from multiple sources
- **Intelligent Filtering:** Location-based matching with remote work opportunities and deduplication logic

### 📄 Intelligent Resume Management
- **Parallel Multi-Agent Resume Tailoring:** 8 specialized agents running simultaneously for 4-8x faster optimization
  - Technical Skills, Experience Reframing, Achievement Amplification
  - ATS Optimization, Professional Summary, Education & Certifications
  - Gap Mitigation, Industry Alignment with Strategic Orchestration
- **Real-Time Streaming:** Live progress updates as each agent completes with copy-to-clipboard functionality
- **Advanced File Processing:** Support for PDF, DOCX, TXT, and Markdown with intelligent formatting preservation
- **Interactive AI Chat:** Real-time resume editing and optimization with AI assistance
- **Version Control:** Multiple resume management with default selection and download capabilities
- **Search & Sort:** Search resumes by name and sort by job title or creation date
- **Batch Operations:** Manage multiple resumes with efficient UI controls

### 💌 Professional Cover Letter Generation
- **AI-Powered Creation:** Personalized cover letters tailored to specific jobs and companies
- **Interactive Refinement:** Chat-based editing and optimization with AI assistance
- **Professional Formatting:** Modern format without outdated traditional headers
- **Template Variants:** Professional, Creative, Technical, and Entry-Level templates

### 📊 Comprehensive Application Tracking
- **Status Management:** Custom tracking (Saved, Applied, Interviewing, Offer, Rejected, Withdrawn, No Longer Available) with color-coded indicators
- **Reminder System:** Set follow-up reminders with custom notes and notifications
- **Advanced Filtering:** Filter by job title, company, status with sortable columns and default "Saved" view
- **Manual Job Addition:** Add custom job opportunities with full AI scoring integration
- **Smart Job Filtering:** Content-based deduplication preventing duplicate job listings
- **Visual Feedback:** Loading states and completion indicators for user actions

### 👤 Enhanced Profile & Onboarding
- **Quick Start Onboarding:** 3-step guided setup for new users with progress tracking
- **Comprehensive Profile:** Professional details, job preferences, and photo upload
- **Smart Autocomplete:** 50+ job titles and 100+ locations with intelligent suggestions
- **Preference Management:** Target roles, salary expectations, employment types, and visa sponsorship

### 🔍 Advanced Search & Discovery
- **Unauthenticated Search:** Public job discovery without registration requirement
- **Full Pagination:** Access to hundreds of jobs across multiple pages with safety limits
- **Smart Deduplication:** Backend logic preventing duplicate results
- **Sortable Results:** Sort by title, company, location, date, and salary with visual indicators

### 📄 Professional Document Generation
- **Markdown to PDF:** High-quality PDF generation with professional styling
- **Job Match Analysis PDFs:** Downloadable detailed scoring reports with visual breakdowns
- **File Attachment Support:** Upload images and documents for feedback submissions

### 🎤 AI-Powered Interview Preparation
- **5 Specialized Interview Types:** Comprehensive practice for every interview stage
  - Interview Tips & Guidance - General preparation strategies
  - Recruiter Screening - HR and initial phone screen practice
  - Technical Assessment - Coding challenges and problem-solving
  - Technical & Behavioral - Combined technical + STAR method questions
  - Team & Culture Fit - Collaboration and values alignment
- **Type-Specific Tips:** Each interview type provides unique, specialized preparation guidance
  - Recruiter Screening: Salary negotiation, background verification, timeline management
  - Technical Assessment: Problem-solving frameworks, algorithm strategies, live coding tips
  - Technical & Behavioral: Technical STAR method, leadership examples, impact storytelling
  - Team & Culture Fit: Conflict resolution, DEI contributions, cultural awareness
- **Interactive Practice Sessions:** Real-time Q&A with AI-powered feedback
  - Question generation tailored to job description and resume
  - Answer analysis with strengths, improvements, and suggested responses
  - Rating system (1-10 score) with constructive feedback
- **Auto-Display Tips:** Immediate access to relevant tips when switching interview types
- **Session Management:** Track progress across all interview types with separate conversation histories

### 🔐 Secure Authentication & Admin
- **Multi-Provider Auth:** Email/password and Google OAuth with Firebase Authentication
- **Admin Dashboard:** Comprehensive user management, GitHub issue tracking, and system monitoring
- **User Management:** Admin deletion capabilities with complete data cleanup and timestamp management
- **Session Security:** Automatic timeout with 1-hour idle protection
- **User Activity Tracking:** Detailed user statistics including resumes, saved jobs, and cover letters
- **Advanced Admin Tools:** User data correction utilities and robust error handling

## 🎯 Advanced AI Features

### Multi-Agent Job Scoring
- **Technical Skills Assessment (25%):** Framework proficiency, programming languages, technical competencies
- **Experience Depth Evaluation (25%):** Years of experience, role progression, industry alignment
- **Achievements Analysis (20%):** Quantifiable accomplishments, impact metrics, leadership examples
- **Education Verification (10%):** Degree relevance, certifications, continuous learning
- **Soft Skills Assessment (10%):** Communication, teamwork, problem-solving capabilities
- **Career Progression Review (10%):** Growth trajectory, role advancement, skill development

### Parallel Multi-Agent Resume Tailoring
- **8 Specialized Agents Running Simultaneously:**
  - Technical Skills Optimization
  - Experience Reframing
  - Achievement Amplification
  - ATS Keyword Optimization
  - Professional Summary Enhancement
  - Education & Certifications Alignment
  - Gap Mitigation Strategy
  - Industry-Specific Alignment
- **Real-Time Streaming Updates:** Live progress as each agent completes
- **Orchestration Engine:** Intelligent synthesis of all agent outputs
- **Performance:** 30-60 second completion vs. 4+ minute timeouts

### Centralized Prompt Management
- **Comprehensive Prompt Library:** 40+ prompts for job matching, resume processing, cover letter generation, interview preparation
- **PromptManager System:** Caching, retry logic, error handling, usage statistics
- **Multiple Variants:** Professional, Creative, Technical, Entry-Level templates
- **Streaming Support:** Real-time content delivery with SSE

### Intelligent Interview Preparation System
- **Type-Specific Prompt Engineering:** 5 specialized prompt functions for each interview stage
  - General Interview Tips: 8-section comprehensive preparation guide
  - Recruiter Screening: 10-section HR screening strategy with salary negotiation
  - Technical Assessment: 12-section coding interview framework with problem-solving approach
  - Technical & Behavioral: Hybrid STAR method combining technical depth and soft skills
  - Team & Culture Fit: 11-section guide for cultural alignment and collaboration
- **Adaptive Question Generation:** Context-aware questions based on:
  - Job description requirements and company culture
  - Candidate's resume and experience level
  - Interview type and assessment goals
  - Previous questions to avoid repetition
- **AI-Powered Answer Analysis:** Structured feedback system providing:
  - Overall rating (excellent, good, needs improvement)
  - Numerical score (1-10 scale)
  - Specific strengths identified in the answer
  - Actionable improvement suggestions
  - Suggested enhanced answer incorporating feedback
- **Session Intelligence:** Separate conversation tracking per interview type with persistent state

### Enhanced Loading Experiences
- **Educational Content:** Rotating tips and insights during processing
- **Real-time Progress:** Stage indicators for AI processing steps
- **Market Insights:** Job market data, salary trends, company statistics
- **Personalized Guidance:** User-specific recommendations and platform statistics

## 🛠️ Technology Stack

### Frontend & Framework
- **[Next.js 15](https://nextjs.org/)** - App Router with TypeScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Custom design system with responsive layouts
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library built on Radix UI primitives

### Backend & Database
- **[Firebase Authentication](https://firebase.google.com/docs/auth)** - Multi-provider authentication
- **[Cloud Firestore](https://firebase.google.com/docs/firestore)** - Document database with composite indexes
- **[Firebase Storage](https://firebase.google.com/docs/storage)** - File storage for photos and documents

### AI & External Services
- **[Google Gemini AI](https://ai.google.dev/)** - Primary AI processing with Gemini 2.0 Flash Exp
  - Single prompt optimization for 5-second resume tailoring (97%+ faster than previous system)
  - Cost-effective alternative to complex multi-agent workflows
  - High-quality results with simplified architecture
  - Intelligent prompt engineering for job matching and resume optimization
- **[OpenRouter API](https://openrouter.ai/)** - Secondary AI service for specialized tasks
  - GPT-4o-mini for complex analysis and Q&A functionality
  - Fallback system ensuring service reliability
- **[SerpApi](https://serpapi.com/)** - Comprehensive job listing aggregation
- **[The Companies API](https://thecompaniesapi.com/)** - Company information and metrics
- **[Playwright](https://playwright.dev/)** - Free browser automation for job scraping (replaces expensive API services)
  - Headless browser automation with Chrome, Firefox, Safari support
  - Anti-detection features with stealth mode and user agent rotation
  - Dynamic content rendering for JavaScript-heavy job sites
  - Cost-effective alternative to paid scraping APIs ($0/month vs $99+/month)

### Document Processing
- **[Puppeteer](https://pptr.dev/)** - PDF generation for resumes and reports
- **[Marked](https://marked.js.org/)** - Markdown parsing and HTML conversion
- **[pdf-parse](https://www.npmjs.com/package/pdf-parse)** - PDF text extraction

### Development Tools
- **[TypeScript](https://www.typescriptlang.org/)** - Strict mode with comprehensive type definitions
- **[pnpm](https://pnpm.io/)** - Fast, efficient package management
- **[ESLint & Prettier](https://eslint.org/)** - Code quality and formatting

## 🔄 Recent Improvements (December 2025)

### 🚀 Revolutionary AI Architecture Overhaul
- **Switch to Google Gemini AI:** Migrated from complex multi-agent LangGraph system to streamlined Gemini 2.0 Flash Exp
- **97%+ Performance Improvement:** Resume tailoring now completes in ~5 seconds vs 97+ seconds previously
- **Simplified Architecture:** Eliminated streaming complexity in favor of fast, reliable single-prompt optimization
- **Cost Optimization:** Reduced AI processing costs while maintaining high-quality results

### Enhanced User Experience
- **Copy-to-Clipboard Functionality:** Added one-click copy buttons to all LLM chat interfaces
  - Resume tailoring conversations
  - Resume edit chat assistance
  - Cover letter generation and editing
- **Instant Response:** No more loading spinners - immediate AI responses with professional results
- **Cleaner Interface:** Removed streaming complexity for simpler, more reliable user interactions

### Performance Metrics
- **Before:** Multi-agent LangGraph system with 97+ second processing times and frequent timeouts
- **After:** Gemini AI single prompt completing in ~5 seconds with 100% reliability
- **User Experience:** Instant feedback with professional-quality results

### Technical Improvements
- **Gemini AI Integration:** New `lib/gemini-client.ts` with optimized prompt engineering
- **Streaming Removal:** Eliminated all Server-Sent Events (SSE) complexity for reliability
- **Architecture Simplification:** Reduced codebase complexity while improving performance
- **Error Recovery:** Simplified error handling with more predictable outcomes
- **Legacy Cleanup:** Removed unused LangGraph, streaming components, and complex orchestration code

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.18.0 or later
- **pnpm** package manager
- **Firebase project** with authentication and Firestore enabled

### 1. Repository Setup
```bash
git clone https://github.com/jsong1004/myjob
cd myjob
pnpm install
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```

Configure your `.env.local` with:
- Firebase project credentials (API keys, project ID, etc.)
- **Gemini API key** for primary AI processing (resume tailoring, job analysis)
- SerpApi key for job search functionality
- OpenRouter API key for secondary AI features (Q&A, complex analysis)
- GitHub token for issue management
- The Companies API token for company data
- Note: ScrapFly API is no longer required (replaced with free Playwright automation)

### 3. Firebase Configuration

#### Authentication Setup
1. Enable **Email/Password** and **Google** providers in Firebase Console
2. Configure authorized domains for production deployment

#### Firestore Database
1. Create database in **Production mode**
2. Create composite index for `resumes` collection:
   - `userId` (Ascending)
   - `createdAt` (Descending)

#### Service Account (Local Development)
1. Generate service account key in Firebase Console
2. Save as `service-account-key.json` in project root
3. Required for PDF/DOCX processing and admin features

### 4. Development Server
```bash
pnpm dev
```

Access the application at [http://localhost:3000](http://localhost:3000)

## 📂 Project Architecture

```
myjob/
├── app/                          # Next.js App Router
│   ├── api/                      # 30+ API endpoints
│   │   ├── jobs/                 # Job search, scoring, matching
│   │   ├── resumes/              # Resume management, tailoring
│   │   ├── resume/               # Streaming resume APIs (SSE)
│   │   │   └── tailor-stream/    # Real-time multi-agent tailoring
│   │   ├── cover-letters/        # Cover letter generation
│   │   ├── interview/            # Interview chat and AI interactions
│   │   ├── interview-sessions/   # Interview session management
│   │   ├── openrouter/           # AI service integration (parallel agents)
│   │   ├── admin/                # Admin dashboard APIs
│   │   └── ...
│   ├── (pages)/                  # Application routes
│   │   ├── search/               # Job search interface
│   │   ├── profile/              # User profile management
│   │   ├── resumes/              # Resume management
│   │   ├── saved-jobs/           # Application tracking
│   │   ├── cover-letters/        # Cover letter library
│   │   ├── interview-prep/       # AI interview preparation
│   │   └── admin/                # Admin dashboard
│   └── globals.css               # Global styles
├── components/                   # 60+ React components
│   ├── ui/                       # shadcn/ui components
│   ├── admin/                    # Admin-specific components
│   ├── interview/                # Interview prep components
│   │   ├── type-navigation.tsx   # Interview type switcher
│   │   ├── interview-chat.tsx    # Chat interface with Q&A
│   │   ├── feedback-panel.tsx    # Answer feedback display
│   │   └── session-card.tsx      # Session summary cards
│   ├── auth-provider.tsx         # Authentication context
│   ├── job-search.tsx            # Job search interface
│   ├── enhanced-job-search.tsx   # Advanced search features
│   ├── streaming-markdown.tsx    # Real-time markdown with copy functionality
│   └── ...
├── lib/                          # Core utilities and logic
│   ├── gemini-client.ts          # Google Gemini AI integration (primary AI)
│   ├── prompts/                  # Centralized AI prompt management
│   │   ├── job-matching/         # Job scoring and analysis
│   │   ├── resume/               # Resume processing and tailoring
│   │   ├── cover-letter/         # Cover letter generation
│   │   ├── interview/            # Interview preparation (5 specialized tip functions)
│   │   └── shared/               # Common templates and utilities
│   ├── firebase.ts               # Firebase client configuration
│   ├── firebase-admin-init.ts    # Firebase Admin SDK
│   ├── types.ts                  # TypeScript definitions
│   └── utils.ts                  # Shared utilities
├── docs/                         # Comprehensive documentation
│   ├── PROJECT_INDEX.md          # Master documentation hub
│   ├── API_REFERENCE.md          # Complete API documentation
│   ├── COMPONENT_GUIDE.md        # Component development guide
│   └── ...
└── public/                       # Static assets
```

## 🌐 Cloud Infrastructure

### Production Deployment
- **Platform:** Google Cloud Run with Docker containers
- **URL:** `https://myjob-service-7a7zpf65aq-uw.a.run.app`
- **Build System:** Cloud Build with automated CI/CD
- **Monitoring:** Admin dashboard with real-time metrics

### Automated Batch Processing
- **Schedule:** Nightly job processing (2 AM PST, Monday-Friday)
- **Orchestration:** Cloud Scheduler with timezone-aware execution
- **Manual Triggers:** Force run capability with `?force=true` parameter
- **Monitoring:** Real-time batch status in admin dashboard

### Database & Storage
- **Firestore:** Production database with composite indexes
- **Firebase Storage:** File uploads, profile photos, document attachments
- **Security:** Comprehensive Firestore rules and authentication middleware

## 📚 Documentation

### Core Documentation
- **[📋 Project Index](docs/PROJECT_INDEX.md)** - Master hub with complete project overview
- **[🔌 API Reference](docs/API_REFERENCE.md)** - Detailed documentation for all 30 endpoints
- **[🧩 Component Guide](docs/COMPONENT_GUIDE.md)** - Component architecture and patterns

### Technical Guides
- **[Multi-Agent Scoring](docs/multi-agent-scoring-guide.md)** - AI scoring system architecture
- **[Batch Job Processing](docs/batch-job-search-plan.md)** - Automated job processing
- **[Firebase Indexes](docs/firestore-indexes.md)** - Required database configuration
- **[Google Cloud Setup](docs/google-cloud-setup-checklist.md)** - Deployment guide

### Implementation Resources
- **[lib/types.ts](lib/types.ts)** - Complete TypeScript definitions
- **[lib/prompts/](lib/prompts/)** - Centralized AI prompt management
- **[components/](components/)** - 60+ React components with shadcn/ui
- **[app/api/](app/api/)** - 30 API endpoints for platform functionality

## 🤝 Contributing

### Development Workflow
1. **Setup:** Follow [Getting Started](#-getting-started) instructions
2. **Architecture:** Review [Project Index](docs/PROJECT_INDEX.md) for overview
3. **APIs:** Consult [API Reference](docs/API_REFERENCE.md) for endpoint details
4. **Components:** Use [Component Guide](docs/COMPONENT_GUIDE.md) for UI development
5. **Testing:** Ensure Firebase integration and AI feature testing

### Code Quality Standards
- **TypeScript:** Strict mode with comprehensive type definitions
- **Security:** Proper Firestore rules and authentication middleware
- **Error Handling:** User-friendly error messages and graceful degradation
- **Performance:** Optimized AI processing with caching and parallel execution

### Contribution Guidelines
- Follow existing code patterns and component structure
- Add appropriate TypeScript types for new features
- Include proper error handling and loading states
- Update documentation for new features or changes
- Test Firebase integration and AI functionality thoroughly

---

## ❓ Frequently Asked Questions

### How does the AI resume optimization work?

MyJob uses **8 specialized AI agents** running in parallel to optimize your resume:
1. **Technical Skills Agent** - Matches and highlights relevant technical skills
2. **Experience Reframing Agent** - Rewrites experience to match job requirements
3. **Achievement Amplification Agent** - Quantifies and emphasizes accomplishments
4. **ATS Optimization Agent** - Ensures keyword optimization for Applicant Tracking Systems
5. **Professional Summary Agent** - Crafts compelling executive summaries
6. **Education & Certifications Agent** - Aligns qualifications with job needs
7. **Gap Mitigation Agent** - Strategically addresses career gaps
8. **Industry Alignment Agent** - Tailors language for specific industries

**Processing time**: 30-60 seconds (vs. 4+ minutes with sequential processing)
**Result**: Real-time streaming updates with copy-to-clipboard functionality

### What AI model does MyJob use?

MyJob uses **OpenRouter API** with access to multiple state-of-the-art models:
- **Primary**: GPT-4, Claude Sonnet, and other frontier models
- **Fallback**: Intelligent model switching for reliability
- **Streaming**: Real-time response streaming for better UX

All prompts are managed through a centralized **PromptManager** system with caching, retry logic, and usage statistics.

### How accurate is the job matching score?

The multi-agent scoring system provides **weighted analysis across 6 dimensions**:
- Technical Skills: 25%
- Experience Depth: 25%
- Achievements: 20%
- Education: 10%
- Soft Skills: 10%
- Career Progression: 10%

**Accuracy**: Based on comprehensive resume analysis and job description parsing
**Transparency**: Detailed breakdown showing strengths, weaknesses, and improvement suggestions
**Validation**: Tested against hundreds of job applications with positive feedback

### Is my resume data secure and private?

**Yes**. Security is a top priority:
- ✅ **Firebase Authentication**: Industry-standard auth with Google OAuth
- ✅ **Firestore Security Rules**: Strict data access controls
- ✅ **HTTPS Only**: All data transmitted securely
- ✅ **No Data Sharing**: Your resumes and data are never shared with third parties
- ✅ **User Ownership**: You own your data and can delete it anytime
- ✅ **Session Security**: Automatic timeout after 1 hour of inactivity

See [Firestore rules](firestore.rules) for complete security implementation.

### Can I use this for free?

**Yes!** MyJob is free to use with:
- ✅ Unlimited job searches
- ✅ AI-powered resume optimization
- ✅ Cover letter generation
- ✅ Application tracking
- ✅ PDF generation

**Note**: OpenRouter API usage may incur costs based on your API key usage. Set up your own OpenRouter API key in environment variables.

### What file formats are supported for resume upload?

Supported formats with intelligent text extraction:
- ✅ **PDF** (.pdf) - Using pdf-parse library
- ✅ **DOCX** (.docx) - Using mammoth library
- ✅ **Markdown** (.md) - Native support
- ✅ **Text** (.txt) - Plain text

**Max file size**: 10MB
**Processing**: Automatic text extraction with formatting preservation
**Validation**: File type and size validation with user-friendly error messages

### How do I deploy this to production?

**Recommended**: Google Cloud Run (fully containerized)

**Quick deployment**:
```bash
# Build Docker image
docker build -t gcr.io/YOUR_PROJECT/myapp .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT/myapp

# Deploy to Cloud Run
gcloud run deploy myapp --image gcr.io/YOUR_PROJECT/myapp
```

**Complete guide**: See [DOCKER_README.md](DOCKER_README.md) and [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

**Alternative platforms**:
- AWS ECS/Fargate
- Azure Container Apps
- DigitalOcean App Platform
- Railway/Render

### What's the difference between this and other job search platforms?

**MyJob advantages**:
1. **Multi-Agent AI System**: 8 specialized agents vs. single-model processing
2. **Parallel Processing**: 4-8x faster resume optimization
3. **Real-Time Streaming**: Live progress updates during AI processing
4. **Open Source**: Full transparency and customization
5. **Self-Hosted**: Complete data ownership and privacy
6. **Modern Stack**: Next.js 15, React 19, TypeScript, Firebase
7. **Comprehensive**: Job search, resume optimization, cover letters, and tracking in one platform

### How do I set up the development environment?

**Quick start**:
```bash
# Clone repository
git clone https://github.com/jsong1004/myjob.git
cd myjob

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
pnpm dev
```

**Requirements**:
- Node.js 18+
- pnpm (or npm/yarn)
- Firebase project
- OpenRouter API key
- SerpAPI key (for job search)

**Complete setup**: See [Getting Started](#-getting-started) section above

### Can I customize the AI prompts and scoring?

**Yes!** MyJob has a centralized prompt management system:

**Location**: `lib/prompts/` directory
- `manager.ts` - PromptManager with caching and retry logic
- `types.ts` - TypeScript definitions for all prompts
- `job-matching/` - Job scoring agent prompts
- `resume-tailoring-engine.ts` - Resume optimization prompts
- `cover-letter-variants.ts` - Cover letter templates
- `interview/` - Interview preparation prompts (5 specialized tip functions + question generation)

**Customization**:
1. Edit prompts in respective files
2. Adjust scoring weights in job-matching agents
3. Add new prompt variants
4. Modify system roles in `shared/system-roles.ts`

**Best practices**: Test prompt changes thoroughly and maintain prompt versioning

### Does this work with Applicant Tracking Systems (ATS)?

**Yes!** MyJob includes dedicated **ATS Optimization Agent**:
- ✅ Keyword matching and density optimization
- ✅ ATS-friendly formatting (no complex layouts)
- ✅ Proper section headers and structure
- ✅ Standard fonts and readable text
- ✅ Avoids images, tables, and graphics in critical sections

**PDF Generation**: Creates ATS-compatible PDFs with proper text extraction

### How does the AI interview preparation work?

MyJob provides **comprehensive interview preparation** with 5 specialized practice modes:

**Interview Types**:
1. **Interview Tips & Guidance** - General preparation strategies covering STAR method, common questions, body language
2. **Recruiter Screening** - HR phone screen practice with salary negotiation and background verification strategies
3. **Technical Assessment** - Coding challenges with 5-step problem-solving framework and algorithm practice
4. **Technical & Behavioral** - Hybrid questions combining technical depth with STAR method storytelling
5. **Team & Culture Fit** - Collaboration scenarios, conflict resolution, and cultural alignment assessment

**How it works**:
1. **Auto-Display Tips**: When you select an interview type, specialized tips appear immediately (no generic intro)
2. **Type-Specific Guidance**: Each type provides unique, actionable preparation content
   - Recruiter: Salary scripts, timeline prep, red flags to avoid
   - Technical: Problem-solving frameworks, live coding tips, when you're stuck strategies
   - Behavioral: Technical STAR method, leadership without being a manager
   - Culture: DEI contributions, culture add vs fit, conflict resolution examples
3. **Interactive Practice**: Click "Start Practice" to begin Q&A
   - AI generates questions based on your resume and job description
   - You answer the question
   - AI analyzes your answer with rating (1-10), strengths, improvements, suggested answer
   - Next question automatically generated
4. **Session Tracking**: Each interview type maintains separate conversation history

**AI Intelligence**:
- **Context-aware questions**: Tailored to job requirements and your experience
- **No repetition**: Tracks previous questions to avoid duplicates
- **Structured feedback**: Rating, score, strengths, improvements, enhanced answer suggestion
- **Persistent state**: Switch between types anytime, progress is saved

**Result**: Complete interview preparation covering every stage from HR screening to final culture fit assessment.

### How do I run this with Docker?

**Quick start with Docker Compose**:
```bash
# Build and run with docker-compose
docker-compose up --build

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f
```

**Application available at**: http://localhost:3000

**Docker Compose Features**:
- ✅ Automatic environment variable loading from `.env.local`
- ✅ Chromium/Puppeteer configuration with proper security settings
- ✅ 2GB shared memory for browser automation
- ✅ Health checks and auto-restart
- ✅ Service account key mounting for local development
- ✅ Production-ready configuration

**Complete Docker guides**:
- **[DOCKER_README.md](DOCKER_README.md)** - Dockerfile details and manual Docker commands
- **[DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)** - Google Cloud Run deployment guide

**Manual Docker Build** (without compose):
```bash
# Build image
docker build -t myjob .

# Run container
docker run -p 3000:3000 --env-file .env.local myjob
```

**Features**:
- ✅ Complete Next.js 15 build with 51/51 static pages
- ✅ Chromium for PDF generation and web scraping
- ✅ Firebase integration with service account support
- ✅ ~1.2GB optimized multi-stage image
- ✅ 232ms startup time with health monitoring

---

## 🏷️ SEO Keywords & Topics

**Primary Keywords**: AI resume builder, job search automation, resume optimization AI, ATS resume checker, cover letter generator AI, job application tracker, career development tools, AI interview practice, interview preparation platform

**Technology Keywords**: Next.js 15 app, React 19, Firebase authentication, OpenRouter AI, Google Gemini AI, multi-agent system, parallel AI processing, TypeScript job platform, Docker containerization, Google Cloud Run

**Use Cases**: Resume tailoring, job matching algorithm, career transition, interview preparation, ATS optimization, professional resume builder, AI career coach, job search organization, technical interview practice, behavioral interview training, recruiter screening prep, culture fit assessment

**Interview Keywords**: AI interview coach, technical interview prep, behavioral interview practice, STAR method training, recruiter screening tips, salary negotiation strategies, coding interview practice, system design interview, culture fit questions, interview feedback AI

**Developer Keywords**: Next.js Docker setup, Firebase integration, AI prompt engineering, multi-agent orchestration, streaming API responses, TypeScript best practices, React Server Components

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**MyJob** - Empowering job seekers with intelligent AI-driven tools for modern career success.

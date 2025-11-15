import type { Metadata } from 'next'
import { generateMetadata, SEO_KEYWORDS } from '@/lib/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Resume Manager - Upload, Edit & Optimize Your Resume',
  description: 'Upload your resume in PDF, DOCX, or Markdown format. Edit, optimize, and manage multiple versions. Get AI-powered suggestions to improve your resume for ATS compatibility and better job matches.',
  keywords: [
    'resume upload',
    'resume editor',
    'resume optimizer',
    'ATS-friendly resume',
    'resume manager',
    'resume versions',
    'PDF resume',
    'DOCX resume',
    'markdown resume',
    ...SEO_KEYWORDS.core,
    ...SEO_KEYWORDS.features,
  ],
  canonicalUrl: '/resumes',
})

export default function ResumesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

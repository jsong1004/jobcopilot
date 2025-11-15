import type { Metadata } from 'next'
import { generateMetadata, SEO_KEYWORDS } from '@/lib/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Cover Letter Generator - AI-Powered Personalized Cover Letters',
  description: 'Generate professional, personalized cover letters with AI. Choose from multiple styles (Professional, Creative, Technical, Entry-Level) and customize for each job application.',
  keywords: [
    'cover letter generator',
    'AI cover letter writer',
    'personalized cover letter',
    'professional cover letter',
    'cover letter templates',
    'automated cover letter',
    ...SEO_KEYWORDS.core,
    ...SEO_KEYWORDS.features,
  ],
  canonicalUrl: '/cover-letters',
})

export default function CoverLettersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

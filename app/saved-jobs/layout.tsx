import type { Metadata } from 'next'
import { generateMetadata, SEO_KEYWORDS } from '@/lib/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Saved Jobs - Job Application Tracker',
  description: 'Track all your job applications in one place. Monitor application status, set reminders, add notes, and manage your job search pipeline with AI-powered matching scores.',
  keywords: [
    'job application tracker',
    'saved jobs',
    'job search organizer',
    'application status tracking',
    'job pipeline management',
    ...SEO_KEYWORDS.features,
  ],
  canonicalUrl: '/saved-jobs',
})

export default function SavedJobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

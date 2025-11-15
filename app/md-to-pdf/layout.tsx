import type { Metadata } from 'next'
import { generateMetadata, SEO_KEYWORDS } from '@/lib/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Markdown to PDF Converter - Professional Resume PDFs',
  description: 'Convert your Markdown resume to a professionally formatted PDF with one click. Perfect for ATS systems and modern job applications. Free online Markdown to PDF converter.',
  keywords: [
    'markdown to pdf',
    'resume converter',
    'markdown resume pdf',
    'pdf generator',
    'resume pdf converter',
    'markdown converter',
    'free pdf converter',
    ...SEO_KEYWORDS.core,
  ],
  canonicalUrl: '/md-to-pdf',
})

export default function MdToPdfLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

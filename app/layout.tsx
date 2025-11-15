import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/auth-provider'
import { Footer } from '@/components/footer'
import { StructuredData } from '@/components/structured-data'
import {
  generateMetadata as createSEOMetadata,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSoftwareAppSchema,
  SEO_KEYWORDS
} from '@/lib/seo'

export const metadata: Metadata = createSEOMetadata({
  title: 'JobCopilot - AI-Powered Job Search, Resume Tailoring & Application Tracking',
  description: 'Transform your job search with AI-powered matching scores, intelligent resume tailoring, automated cover letters, and comprehensive application tracking. Land your dream job faster with JobCopilot.',
  keywords: [
    ...SEO_KEYWORDS.core,
    ...SEO_KEYWORDS.features,
    ...SEO_KEYWORDS.industry,
  ],
  canonicalUrl: '/',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData
          data={[
            generateOrganizationSchema(),
            generateWebSiteSchema(),
            generateSoftwareAppSchema(),
          ]}
        />
      </head>
      <body className={GeistSans.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col bg-background">
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  ogType?: 'website' | 'article' | 'profile'
  canonicalUrl?: string
  noIndex?: boolean
  structuredData?: Record<string, any>
}

const DEFAULT_SITE_NAME = 'JobCopilot'
const DEFAULT_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jobcopilot.app'
const DEFAULT_OG_IMAGE = `${DEFAULT_URL}/og-image.png`

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    ogImage = DEFAULT_OG_IMAGE,
    ogType = 'website',
    canonicalUrl,
    noIndex = false,
  } = config

  const fullTitle = title.includes(DEFAULT_SITE_NAME) ? title : `${title} | ${DEFAULT_SITE_NAME}`

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: DEFAULT_SITE_NAME }],
    creator: DEFAULT_SITE_NAME,
    publisher: DEFAULT_SITE_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(DEFAULT_URL),
    alternates: {
      canonical: canonicalUrl || DEFAULT_URL,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl || DEFAULT_URL,
      siteName: DEFAULT_SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: '@jobcopilot',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
  }
}

// SEO-optimized keywords for job search and AI resume tools
export const SEO_KEYWORDS = {
  core: [
    'job search',
    'AI job matching',
    'resume builder',
    'resume tailoring',
    'cover letter generator',
    'job application tracker',
    'career tools',
    'AI resume optimizer',
  ],
  features: [
    'AI matching scores',
    'resume analyzer',
    'job compatibility score',
    'ATS optimization',
    'resume keywords',
    'job tracking',
    'application management',
    'career advancement',
  ],
  longTail: [
    'how to tailor resume for job',
    'AI-powered job search',
    'automated resume optimization',
    'job application tracking system',
    'resume ATS score checker',
    'job matching algorithm',
    'AI cover letter writer',
    'resume keyword optimizer',
  ],
  industry: [
    'tech jobs',
    'software engineer jobs',
    'data scientist jobs',
    'product manager jobs',
    'remote jobs',
    'startup jobs',
    'entry level jobs',
    'senior positions',
  ],
}

// Structured data generators for rich snippets
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DEFAULT_SITE_NAME,
    url: DEFAULT_URL,
    logo: `${DEFAULT_URL}/logo.png`,
    description: 'AI-powered job search platform with resume tailoring and application tracking',
    sameAs: [
      'https://twitter.com/jobcopilot',
      'https://linkedin.com/company/jobcopilot',
      'https://github.com/jobcopilot',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@jobcopilot.app',
      contactType: 'Customer Support',
    },
  }
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: DEFAULT_SITE_NAME,
    url: DEFAULT_URL,
    description: 'AI-powered job search with resume tailoring and application tracking',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${DEFAULT_URL}/saved-jobs?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateJobPostingSchema(job: {
  id: string
  title: string
  company: string
  location: string
  description: string
  datePosted?: string
  employmentType?: string
  salary?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    identifier: {
      '@type': 'PropertyValue',
      name: DEFAULT_SITE_NAME,
      value: job.id,
    },
    datePosted: job.datePosted || new Date().toISOString(),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    },
    employmentType: job.employmentType || 'FULL_TIME',
    ...(job.salary && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: {
          '@type': 'QuantitativeValue',
          value: job.salary,
        },
      },
    }),
  }
}

export function generateSoftwareAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: DEFAULT_SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1247',
    },
    description: 'AI-powered job search platform that analyzes matching scores, tailors resumes, and tracks applications',
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${DEFAULT_URL}${item.url}`,
    })),
  }
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// AI crawler-friendly metadata
export function generateAIMetadata(config: {
  purpose: string
  capabilities: string[]
  targetAudience: string
  dataTypes: string[]
}) {
  return {
    'ai:purpose': config.purpose,
    'ai:capabilities': config.capabilities.join(', '),
    'ai:target-audience': config.targetAudience,
    'ai:data-types': config.dataTypes.join(', '),
    'ai:interaction': 'conversational, search, recommendation',
  }
}

import * as cheerio from 'cheerio'
import { parseLinkedIn } from './linkedin'
import { parseIndeed } from './indeed'
import { parseWellfound } from './wellfound'
import { parseGrabJobs } from './grabjobs'
import { parseGeneric } from './generic'

export interface ParsedJob {
  title?: string
  company?: string
  location?: string
  salary?: string
  description?: string
  applyUrl?: string
  source: string
  postedAt?: string
  qualifications?: string[]
  responsibilities?: string[]
  benefits?: string[]
}

export async function parseFromUrl(url: string, htmlFetcher: (u: string) => Promise<string>): Promise<ParsedJob> {
  const domain = new URL(url).hostname.replace(/^www\./, '')
  const fetchHtml = async () => htmlFetcher(url)

  if (domain.includes('linkedin.com')) {
    return await parseLinkedIn(url, fetchHtml)
  }
  if (domain.includes('indeed.com')) {
    return await parseIndeed(url, fetchHtml)
  }
  if (domain.includes('wellfound.com') || domain.includes('angel.co')) {
    return await parseWellfound(url, fetchHtml)
  }
  if (domain.includes('grabjobs.com') || domain.includes('jobcopilot.com')) {
    return await parseGrabJobs(url, fetchHtml)
  }

  const html = await fetchHtml()
  return parseGeneric(url, html)
}

export function extractJsonLdJobPosting($: cheerio.CheerioAPI): any | null {
  const scripts = $('script[type="application/ld+json"]').toArray()
  for (const s of scripts) {
    try {
      const text = $(s).contents().text()
      const data = JSON.parse(text)
      if (Array.isArray(data)) {
        const job = data.find((x) => x['@type'] === 'JobPosting')
        if (job) return job
      } else if (data && (data['@type'] === 'JobPosting' || data['@graph'])) {
        if (data['@type'] === 'JobPosting') return data
        const fromGraph = (data['@graph'] || []).find((x: any) => x['@type'] === 'JobPosting')
        if (fromGraph) return fromGraph
      }
    } catch {}
  }
  return null
}

export function cleanText(input?: string): string {
  if (!input) return ''
  return input
    // Remove HTML tags first
    .replace(/<[^>]*>/g, ' ')
    // Handle HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Normalize whitespace and line breaks
    .replace(/\r\n|\r|\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+$/g, '')
    .trim()
}



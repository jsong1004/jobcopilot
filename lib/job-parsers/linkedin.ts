import * as cheerio from 'cheerio'
import { ParsedJob, cleanText } from './index'

async function fetchLinkedInGuestHtml(jobId: string, fetchHtml: (u: string) => Promise<string>): Promise<string> {
  const guestUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`
  return fetchHtml(guestUrl)
}

function extractJobIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const id = u.searchParams.get('currentJobId') || u.searchParams.get('trkId') || null
    if (id) return id
    const match = url.match(/(?:jobs|view)\/.*(?:\/|%2F)(\d{5,})/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export async function parseLinkedIn(url: string, fetchHtml: (u: string) => Promise<string>): Promise<ParsedJob> {
  const jobId = extractJobIdFromUrl(url)
  const html = await fetchLinkedInGuestHtml(jobId || '', fetchHtml).catch(() => '')
  const $ = cheerio.load(html)

  const title = $('h2.top-card-layout__title').text().trim() || $('h1').first().text().trim()
  const company = $('a.topcard__org-name-link').text().trim() || $('span.topcard__flavor').first().text().trim()
  const location = $('span.topcard__flavor--bullet').first().text().trim()
  const description = cleanText($('#job-details').text() || $('section.description').text())

  return {
    title: title || undefined,
    company: company || undefined,
    location: location || undefined,
    description: description || undefined,
    applyUrl: url,
    source: 'LinkedIn',
  }
}



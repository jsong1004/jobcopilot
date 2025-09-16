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
  // First try the direct job page
  let html = await fetchHtml(url).catch(() => '')
  let $ = cheerio.load(html)

  // Try multiple selector strategies for LinkedIn's changing layout
  let title = ''
  let company = ''
  let location = ''
  let description = ''

  // Strategy 1: Modern LinkedIn job page selectors
  title = $('h1[data-test-id="job-title"], h1.t-24.t-bold.inline, .jobs-unified-top-card__job-title h1, h1.topcard__title').first().text().trim()
  company = $('a[data-test-id="job-details-company-name"], .jobs-unified-top-card__company-name a, .job-details-company__company-information a, a.topcard__org-name-link').first().text().trim()
  location = $('[data-test-id="job-details-location"], .jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__primary-description-container .tvm__text, .topcard__flavor--bullet').first().text().trim()

  // Try multiple selectors for description
  const descriptionSelectors = [
    '.jobs-description__container',
    '.jobs-description-content__text',
    '.jobs-description',
    '[data-test-id="job-details-description"]',
    '.job-details-description-text',
    '.description__text',
    '.show-more-less-html__markup',
    'div[class*="description"] section',
    '#job-details'
  ]

  for (const selector of descriptionSelectors) {
    const desc = $(selector).first().text().trim()
    if (desc && desc.length > 100) {
      description = cleanText(desc)
      break
    }
  }

  // Extract salary information
  let salary = ''

  // First try to get it from the description since LinkedIn often includes it there
  if (description) {
    // Look for patterns like "$120,000 - $150,000" or "$120,000-$150,000/yr"
    const salaryMatch = description.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\/yr|\/year|\/hour|\/hr|annually)?/gi)
    if (salaryMatch && salaryMatch.length > 0) {
      // If multiple matches, prefer the one with a range (contains dash)
      const rangeMatch = salaryMatch.find(s => s.includes('-') || s.includes('–'))
      salary = rangeMatch || salaryMatch[0]
    }
  }

  // If not found in description, try specific salary selectors
  if (!salary) {
    const salaryText = $('span:contains("$"), div:contains("$"), .compensation__salary, [class*="salary"], [class*="compensation"]').text()
    if (salaryText) {
      const salaryMatch = salaryText.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\/yr|\/year|\/hour|\/hr)?/i)
      if (salaryMatch) {
        salary = salaryMatch[0]
      }
    }
  }

  // Strategy 2: If still no results, try guest API approach
  if (!title && !company) {
    const jobId = extractJobIdFromUrl(url)
    if (jobId) {
      try {
        const guestHtml = await fetchLinkedInGuestHtml(jobId, fetchHtml)
        $ = cheerio.load(guestHtml)
        title = $('h2.top-card-layout__title, h1').first().text().trim()
        company = $('a.topcard__org-name-link, span.topcard__flavor').first().text().trim()
        location = $('span.topcard__flavor--bullet').first().text().trim()
        description = cleanText($('#job-details, section.description').first().text())
      } catch {
        // Guest API failed, continue with existing parsing
      }
    }
  }

  // Strategy 3: More generic selectors if still no results
  if (!title) {
    title = $('h1, .job-title, [class*="job-title"], [class*="title"]').first().text().trim()
  }
  if (!company) {
    company = $('[class*="company"], [data-test*="company"]').first().text().trim()
  }
  if (!location) {
    location = $('[class*="location"], [data-test*="location"]').first().text().trim()
  }
  if (!description) {
    description = cleanText($('[class*="description"], [class*="job-details"], .description, #job-details').first().text())
  }

  // Clean up extracted text
  title = title.replace(/\s+/g, ' ').trim()
  company = company.replace(/\s+/g, ' ').trim()
  location = location.replace(/\s+/g, ' ').trim()

  return {
    title: title || undefined,
    company: company || undefined,
    location: location || undefined,
    description: description || undefined,
    salary: salary || undefined,
    applyUrl: url,
    source: 'LinkedIn',
  }
}



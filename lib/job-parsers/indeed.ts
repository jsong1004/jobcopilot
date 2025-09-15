import * as cheerio from 'cheerio'
import { ParsedJob, extractJsonLdJobPosting, cleanText } from './index'

function normalizeIndeedUrl(url: string): string[] {
  try {
    const u = new URL(url)
    const vjk = u.searchParams.get('vjk')
    const jk = u.searchParams.get('jk')

    const urlsToTry = [url] // Start with original URL

    if (vjk) {
      urlsToTry.push(`https://www.indeed.com/viewjob?jk=${vjk}`)
      urlsToTry.push(`https://www.indeed.com/jobs?vjk=${vjk}`)
    }

    if (jk) {
      urlsToTry.push(`https://www.indeed.com/viewjob?jk=${jk}`)
    }

    // Try mobile version as fallback
    if (u.hostname.includes('indeed.com')) {
      urlsToTry.push(url.replace('www.indeed.com', 'm.indeed.com'))
    }

    return Array.from(new Set(urlsToTry)) // Remove duplicates
  } catch {
    return [url]
  }
}

export async function parseIndeed(url: string, fetchHtml: (u: string) => Promise<string>): Promise<ParsedJob> {
  const urlsToTry = normalizeIndeedUrl(url)
  let lastError: Error | null = null

  // Try each URL format until one works
  for (const tryUrl of urlsToTry) {
    try {
      const html = await fetchHtml(tryUrl)
      const $ = cheerio.load(html)

      // Check if we got blocked or empty content
      if (html.includes('blocked') || html.includes('captcha') || html.includes('robot') || html.length < 100) {
        continue // Try next URL
      }

      const jobLd = extractJsonLdJobPosting($)
      if (jobLd) {
        return {
          title: jobLd.title,
          company: jobLd.hiringOrganization?.name,
          location: jobLd.jobLocation?.address?.addressLocality || jobLd.jobLocation?.address?.addressRegion || '',
          salary: jobLd.baseSalary?.value?.value,
          description: cleanText(jobLd.description),
          postedAt: jobLd.datePosted,
          applyUrl: url, // Return original URL
          source: 'Indeed',
        }
      }

      // Try different selectors for Indeed
      const selectors = [
        { title: 'h1', company: '[data-company-name] a', location: '.jobsearch-CompanyInfoContainer div', description: '#jobDescriptionText' },
        { title: '.jobsearch-JobInfoHeader-title', company: '.jobsearch-InlineCompanyRating a', location: '[data-testid="job-location"]', description: '#jobDescriptionText' },
        { title: '[data-testid="jobTitle"]', company: '[data-testid="inlineHeader-companyName"]', location: '[data-testid="job-location"]', description: '#jobDescriptionText' },
      ]

      for (const selector of selectors) {
        const title = $(selector.title).first().text().trim()
        const company = $(selector.company).first().text().trim()
        const location = $(selector.location).first().text().trim()
        const description = cleanText($(selector.description).text())

        if (title && company) {
          return {
            title: title || undefined,
            company: company || undefined,
            location: location || undefined,
            description: description || undefined,
            applyUrl: url, // Return original URL
            source: 'Indeed',
          }
        }
      }
    } catch (error) {
      lastError = error as Error
      continue // Try next URL
    }
  }

  // If all URLs failed, throw the last error
  if (lastError) {
    throw lastError
  }

  // Return minimal object if nothing worked
  return {
    title: undefined,
    company: undefined,
    location: undefined,
    description: undefined,
    applyUrl: url,
    source: 'Indeed',
  }
}



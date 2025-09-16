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
  console.log(`[Indeed] Starting parse for URL: ${url}`)
  const urlsToTry = normalizeIndeedUrl(url)
  console.log(`[Indeed] URLs to try: ${urlsToTry.join(', ')}`)
  let lastError: Error | null = null

  // Try each URL format until one works
  for (const tryUrl of urlsToTry) {
    try {
      console.log(`[Indeed] Fetching HTML from: ${tryUrl}`)
      const html = await fetchHtml(tryUrl)
      console.log(`[Indeed] HTML received, length: ${html.length} chars`)
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

        // Extract description and clean HTML tags better
        const descriptionElement = $(selector.description).first()
        let description = ''
        if (descriptionElement.length > 0) {
          // Convert HTML to text more effectively
          description = descriptionElement.text().trim()
          if (!description && descriptionElement.html()) {
            // If .text() doesn't work, try removing HTML tags manually
            description = descriptionElement.html()!
              .replace(/<[^>]*>/g, ' ') // Remove HTML tags
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim()
          }
          description = cleanText(description)
        }

        // Extract salary information from various Indeed salary elements
        let salary = ''
        const salarySelectors = [
          '.jobsearch-SalaryInfoContainer',
          '[data-testid="salary-snippet"]',
          '.metadata.salary-snippet-container',
          '.salary-snippet',
          '.salary',
          '.jobsearch-DesktopStickyContainer span:contains("$")',
          'span:contains("$")',
          'div:contains("$")'
        ]

        console.log(`[Indeed] Attempting salary extraction for ${title} at ${company}`)

        for (const salarySelector of salarySelectors) {
          const salaryElement = $(salarySelector).first()
          const salaryText = salaryElement.text().trim()
          console.log(`[Indeed] Checking selector "${salarySelector}": "${salaryText}"`)

          if (salaryText && salaryText.includes('$')) {
            // Extract salary range pattern
            const salaryMatch = salaryText.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:hour|hr|year|yr|annually))?/i)
            if (salaryMatch) {
              salary = salaryMatch[0]
              console.log(`[Indeed] Found salary: "${salary}" from selector "${salarySelector}"`)
              break
            }
          }
        }

        // Also try to extract salary from description if not found in dedicated fields
        if (!salary && description) {
          console.log(`[Indeed] No salary in selectors, checking description...`)
          const salaryInDesc = description.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:hour|hr|year|yr|annually))?/i)
          if (salaryInDesc) {
            salary = salaryInDesc[0]
            console.log(`[Indeed] Found salary in description: "${salary}"`)
          }
        }

        // Also check the entire page for any salary mentions
        if (!salary) {
          console.log(`[Indeed] No salary found, doing page-wide search...`)
          const pageText = $('body').text()
          const pageWideSalary = pageText.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:hour|hr|year|yr|annually))?/i)
          if (pageWideSalary) {
            salary = pageWideSalary[0]
            console.log(`[Indeed] Found salary in page text: "${salary}"`)
          }
        }

        console.log(`[Indeed] Final salary result: "${salary || 'none'}"`)
        console.log(`[Indeed] Final description length: ${description?.length || 0} chars`)

        if (title && company) {
          return {
            title: title || undefined,
            company: company || undefined,
            location: location || undefined,
            description: description || undefined,
            salary: salary || undefined,
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



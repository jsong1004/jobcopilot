import * as cheerio from 'cheerio'
import { ParsedJob, cleanText } from './index'

export async function parseGrabJobs(url: string, fetchHtml: (u: string) => Promise<string>): Promise<ParsedJob> {
  console.log(`[GrabJobs] Starting parse for URL: ${url}`)

  try {
    const html = await fetchHtml(url)
    console.log(`[GrabJobs] HTML received, length: ${html.length} chars`)

    // Log first 500 chars for debugging
    console.log(`[GrabJobs] HTML preview: ${html.substring(0, 500)}`)

    const $ = cheerio.load(html)

    // Enhanced SPA content validation
    if (html.includes('captcha') || html.includes('challenge-platform')) {
      console.log(`[GrabJobs] Captcha detected`)
      throw new Error('Captcha detected')
    }

    // Check for empty SPA shell (common issue)
    if (html.length < 1000) {
      console.log(`[GrabJobs] Content too short (${html.length} chars), likely SPA shell`)
      throw new Error('SPA shell without content')
    }

    // Check for typical SPA loading indicators that weren't replaced
    if (html.includes('Loading...') && !html.includes('job') && !html.includes('position')) {
      console.log(`[GrabJobs] Page still showing loading state`)
      throw new Error('Page still loading')
    }

    // Check if we got just the Next.js/React shell
    if (html.includes('__NEXT_DATA__') && html.split('__NEXT_DATA__').length === 2) {
      const nextDataMatch = html.match(/__NEXT_DATA__.*?>(.*?)<\/script/)
      if (nextDataMatch) {
        try {
          const nextData = JSON.parse(nextDataMatch[1])
          if (!nextData.props || Object.keys(nextData.props).length === 0) {
            console.log(`[GrabJobs] Next.js data present but empty props`)
            throw new Error('Next.js data incomplete')
          }
        } catch {
          console.log(`[GrabJobs] Could not parse Next.js data`)
        }
      }
    }

    let title = ''
    let company = ''
    let location = ''
    let description = ''
    let salary = ''

    // Enhanced selector strategies for SPA-loaded content
    const selectors = [
      {
        title: 'h1.job-title, .job-title h1, [data-testid="job-title"], .title, [class*="JobTitle"], [class*="job-title"]',
        company: '.company-name, .employer-name, [data-testid="company-name"], .company, [class*="Company"], [class*="company"]',
        location: '.job-location, .location, [data-testid="location"], [class*="Location"], [class*="location"]',
        description: '.job-description, .description, .job-details, .details, [class*="Description"], [class*="description"], [class*="JobDetails"]'
      },
      {
        title: 'h1, .page-title, .main-title, [role="heading"][aria-level="1"], main h1',
        company: '.company, .employer, .organization, [class*="employer"], [class*="org"]',
        location: '.location, .address, .workplace, [class*="address"], [class*="place"]',
        description: '.content, .job-content, .main-content, main div, article div'
      },
      {
        // More generic fallbacks for dynamically generated content
        title: 'h1:not(:empty), [class*="title"]:not(:empty), [class*="Title"]:not(:empty)',
        company: '[class*="company"]:not(:empty), [class*="Company"]:not(:empty), [class*="employer"]:not(:empty)',
        location: '[class*="location"]:not(:empty), [class*="Location"]:not(:empty), [class*="address"]:not(:empty)',
        description: '[class*="description"]:not(:empty), [class*="Description"]:not(:empty), [class*="detail"]:not(:empty), [class*="Detail"]:not(:empty)'
      }
    ]

    console.log(`[GrabJobs] Trying different selector strategies...`)

    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i]
      console.log(`[GrabJobs] Trying selector strategy ${i + 1}`)

      title = $(selector.title).first().text().trim()
      company = $(selector.company).first().text().trim()
      location = $(selector.location).first().text().trim()

      // Extract description and clean HTML
      const descriptionElement = $(selector.description).first()
      if (descriptionElement.length > 0) {
        description = cleanText(descriptionElement.text() || descriptionElement.html() || '')
      }

      console.log(`[GrabJobs] Strategy ${i + 1} results: title="${title}", company="${company}", location="${location}", desc_length=${description.length}`)

      if (title && (company || description)) {
        break
      }
    }

    // Fallback: Try to extract from Next.js data if selectors failed
    if (!title && html.includes('__NEXT_DATA__')) {
      console.log(`[GrabJobs] Attempting Next.js data extraction as fallback`)
      try {
        const nextDataMatch = html.match(/__NEXT_DATA__.*?>(.*?)<\/script/)
        if (nextDataMatch) {
          const nextData = JSON.parse(nextDataMatch[1])
          console.log(`[GrabJobs] Next.js data keys:`, Object.keys(nextData))

          // Try to find job data in various nested locations
          const searchForJobData = (obj: any, path = ''): any => {
            if (typeof obj !== 'object' || obj === null) return null

            // Look for job-related keys
            const jobKeys = ['job', 'position', 'title', 'company', 'description']
            for (const key of Object.keys(obj)) {
              if (jobKeys.some(jk => key.toLowerCase().includes(jk))) {
                console.log(`[GrabJobs] Found potential job data at ${path}.${key}`)
                return obj[key]
              }
            }

            // Recurse into nested objects
            for (const [key, value] of Object.entries(obj)) {
              if (typeof value === 'object' && value !== null) {
                const result = searchForJobData(value, path ? `${path}.${key}` : key)
                if (result) return result
              }
            }

            return null
          }

          const jobData = searchForJobData(nextData)
          if (jobData) {
            console.log(`[GrabJobs] Found job data in Next.js:`, Object.keys(jobData))

            // Extract fields from the job data object
            if (jobData.title || jobData.name || jobData.position) {
              title = jobData.title || jobData.name || jobData.position
            }
            if (jobData.company || jobData.employer || jobData.organization) {
              company = jobData.company || jobData.employer || jobData.organization
            }
            if (jobData.location || jobData.address || jobData.place) {
              location = jobData.location || jobData.address || jobData.place
            }
            if (jobData.description || jobData.details || jobData.content) {
              description = cleanText(jobData.description || jobData.details || jobData.content)
            }
            if (jobData.salary || jobData.pay || jobData.compensation) {
              salary = jobData.salary || jobData.pay || jobData.compensation
            }
          }
        }
      } catch (error) {
        console.log(`[GrabJobs] Next.js data extraction failed:`, error)
      }
    }

    // Extract salary information
    const salarySelectors = [
      '.salary, .pay, .compensation, .wage',
      '[data-testid="salary"], [data-testid="pay"]',
      'span:contains("$"), div:contains("$")',
      '.job-salary, .salary-info, .pay-info'
    ]

    console.log(`[GrabJobs] Attempting salary extraction...`)

    for (const salarySelector of salarySelectors) {
      const salaryText = $(salarySelector).first().text().trim()
      console.log(`[GrabJobs] Checking salary selector "${salarySelector}": "${salaryText}"`)

      if (salaryText && salaryText.includes('$')) {
        const salaryMatch = salaryText.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:hour|hr|year|yr|annually|monthly|mo))?/i)
        if (salaryMatch) {
          salary = salaryMatch[0]
          console.log(`[GrabJobs] Found salary: "${salary}" from selector "${salarySelector}"`)
          break
        }
      }
    }

    // Also try to extract salary from description
    if (!salary && description) {
      console.log(`[GrabJobs] No salary in selectors, checking description...`)
      const salaryInDesc = description.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:hour|hr|year|yr|annually|monthly|mo))?/i)
      if (salaryInDesc) {
        salary = salaryInDesc[0]
        console.log(`[GrabJobs] Found salary in description: "${salary}"`)
      }
    }

    // Fallback: search entire page for salary
    if (!salary) {
      console.log(`[GrabJobs] No salary found, doing page-wide search...`)
      const pageText = $('body').text()
      const pageWideSalary = pageText.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:hour|hr|year|yr|annually|monthly|mo))?/i)
      if (pageWideSalary) {
        salary = pageWideSalary[0]
        console.log(`[GrabJobs] Found salary in page text: "${salary}"`)
      }
    }

    console.log(`[GrabJobs] Final results:`)
    console.log(`[GrabJobs] - Title: "${title}"`)
    console.log(`[GrabJobs] - Company: "${company}"`)
    console.log(`[GrabJobs] - Location: "${location}"`)
    console.log(`[GrabJobs] - Salary: "${salary || 'none'}"`)
    console.log(`[GrabJobs] - Description length: ${description?.length || 0} chars`)

    return {
      title: title || undefined,
      company: company || undefined,
      location: location || undefined,
      description: description || undefined,
      salary: salary || undefined,
      applyUrl: url,
      source: 'GrabJobs',
    }

  } catch (error) {
    console.error(`[GrabJobs] Error parsing job:`, error)
    throw error
  }
}
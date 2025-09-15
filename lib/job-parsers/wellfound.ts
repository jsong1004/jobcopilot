import * as cheerio from 'cheerio'
import { ParsedJob, extractJsonLdJobPosting, cleanText } from './index'

export async function parseWellfound(url: string, fetchHtml: (u: string) => Promise<string>): Promise<ParsedJob> {
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  const jobLd = extractJsonLdJobPosting($)
  if (jobLd) {
    return {
      title: jobLd.title,
      company: jobLd.hiringOrganization?.name,
      location: jobLd.jobLocation?.address?.addressLocality || jobLd.jobLocation?.address?.addressRegion || '',
      salary: jobLd.baseSalary?.value?.value,
      description: cleanText(jobLd.description),
      postedAt: jobLd.datePosted,
      applyUrl: url,
      source: 'Wellfound',
    }
  }

  const title = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim()
  const company = $('a[href*="/company/"]').first().text().trim()
  const description = cleanText($('[data-testid="job-description"], #job-details, .styles_description__').text())

  return {
    title: title || undefined,
    company: company || undefined,
    description: description || undefined,
    applyUrl: url,
    source: 'Wellfound',
  }
}



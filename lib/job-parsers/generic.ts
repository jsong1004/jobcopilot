import * as cheerio from 'cheerio'
import { ParsedJob, extractJsonLdJobPosting, cleanText } from './index'

export function parseGeneric(url: string, html: string): ParsedJob {
  const $ = cheerio.load(html)

  const jobLd = extractJsonLdJobPosting($)
  if (jobLd) {
    const title = jobLd.title || jobLd.name
    const hiringOrg = jobLd.hiringOrganization?.name || jobLd.hiringOrganization
    return {
      title: title ? String(title) : undefined,
      company: hiringOrg ? String(hiringOrg) : undefined,
      location: jobLd.jobLocation?.address?.addressLocality || jobLd.jobLocation?.address?.addressRegion || jobLd.jobLocation?.address?.addressCountry || '',
      salary: jobLd.baseSalary?.value?.value ? `${jobLd.baseSalary.value.value} ${jobLd.baseSalary.value.currency || ''}` : undefined,
      description: cleanText(jobLd.description),
      postedAt: jobLd.datePosted,
      applyUrl: jobLd.hiringOrganization?.sameAs || url,
      source: new URL(url).hostname.replace(/^www\./, ''),
    }
  }

  const title = $('meta[property="og:title"]').attr('content') || $('title').text()
  const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || ''
  const site = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname.replace(/^www\./, '')

  let company: string | undefined
  if (title && title.includes(' at ')) {
    company = title.split(' at ').pop()?.trim()
  }

  return {
    title: title?.trim(),
    company,
    description: cleanText(description),
    applyUrl: url,
    source: site,
  }
}



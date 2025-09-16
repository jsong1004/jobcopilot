import { ParsedJob, parseFromUrl } from '@/lib/job-parsers'
import { PlaywrightService, getPlaywrightService } from './playwright-service'
import { getScrapingStrategy, getMaxAttempts, getDomainInfo, ScrapingConfig } from './config'

export interface ScrapeResult {
  job: ParsedJob
  debug: {
    service: string
    success: boolean
    attempts: number
    totalTime: number
    strategies: Array<{
      strategy: ScrapingConfig
      success: boolean
      error?: string
      duration?: number
    }>
    finalStrategy?: ScrapingConfig
    domainInfo?: any
  }
}

export class JobScrapingService {
  private playwrightService: PlaywrightService

  constructor() {
    this.playwrightService = getPlaywrightService()
  }

  async scrapeJob(url: string, options: { debug?: boolean } = {}): Promise<ScrapeResult> {
    const startTime = Date.now()
    const maxAttempts = getMaxAttempts(url)
    const domainInfo = getDomainInfo(url)

    const debugInfo = {
      service: 'hybrid',
      success: false,
      attempts: 0,
      totalTime: 0,
      strategies: [] as Array<{
        strategy: ScrapingConfig
        success: boolean
        error?: string
        duration?: number
      }>,
      domainInfo,
    }

    let lastError: Error | null = null

    // Try each strategy in order of priority
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const strategy = getScrapingStrategy(url, attempt)
      debugInfo.attempts = attempt + 1

      const strategyStart = Date.now()
      const strategyResult = {
        strategy,
        success: false,
        duration: 0,
        error: undefined as string | undefined,
      }

      try {
        console.log(`[JobScraping] Attempt ${attempt + 1}/${maxAttempts} using ${strategy.service} for ${url}`)

        let htmlFetcher: (u: string) => Promise<string>

        if (strategy.service === 'playwright') {
          htmlFetcher = async (u: string) => {
            const result = await this.playwrightService.scrapeJobUrl(u, {
              headless: process.env.NODE_ENV === 'production',
              timeout: strategy.timeout,
              retries: strategy.retries,
              stealth: true,
            })
            return result.html
          }
        } else if (strategy.service === 'scrapfly') {
          // ScrapFly is no longer used, fall back to HTTP
          console.log('[JobScraping] ScrapFly service deprecated, falling back to HTTP')
          htmlFetcher = async (u: string) => {
            const { html } = await this.fetchWithHttp(u)
            return html
          }
        } else {
          // HTTP method (existing implementation)
          htmlFetcher = async (u: string) => {
            const { html } = await this.fetchWithHttp(u)
            return html
          }
        }

        const job = await parseFromUrl(url, htmlFetcher)

        strategyResult.duration = Date.now() - strategyStart
        strategyResult.success = true
        debugInfo.strategies.push(strategyResult)
        debugInfo.success = true
        debugInfo.totalTime = Date.now() - startTime
        debugInfo.finalStrategy = strategy

        console.log(`[JobScraping] Success with ${strategy.service} on attempt ${attempt + 1}`)

        return {
          job,
          debug: debugInfo,
        }

      } catch (error) {
        strategyResult.duration = Date.now() - strategyStart
        strategyResult.error = error instanceof Error ? error.message : 'Unknown error'
        debugInfo.strategies.push(strategyResult)
        lastError = error as Error

        console.log(`[JobScraping] Attempt ${attempt + 1} failed with ${strategy.service}: ${strategyResult.error}`)

        // If this isn't the last attempt, continue to next strategy
        if (attempt < maxAttempts - 1) {
          // Add delay between attempts
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
      }
    }

    // All attempts failed
    debugInfo.totalTime = Date.now() - startTime

    console.error(`[JobScraping] All ${maxAttempts} attempts failed for ${url}`)

    // Return minimal job object so UI can continue
    const domain = new URL(url).hostname.replace(/^www\./, '')
    return {
      job: {
        applyUrl: url,
        source: domain,
      },
      debug: debugInfo,
    }
  }

  // Fallback HTTP method (existing implementation)
  private async fetchWithHttp(url: string): Promise<{ html: string; debug: any }> {
    const USER_AGENTS = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ]

    const DEFAULT_HEADERS: Record<string, string> = {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    }

    const debugInfo = {
      service: 'http',
      startTime: Date.now(),
    }

    try {
      const response = await fetch(url, {
        headers: DEFAULT_HEADERS,
        redirect: 'follow',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      return { html, debug: debugInfo }

    } catch (error) {
      throw Object.assign(error as Error, { debug: debugInfo })
    }
  }

  // Test Playwright connectivity
  async testPlaywright(): Promise<boolean> {
    try {
      return await this.playwrightService.testConnection()
    } catch {
      return false
    }
  }

  // Get service status
  async getServiceStatus(): Promise<{
    playwright: boolean
    http: boolean
  }> {
    return {
      playwright: await this.testPlaywright(),
      http: true, // HTTP is always available
    }
  }
}
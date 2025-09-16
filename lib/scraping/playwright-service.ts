import { chromium, Browser, BrowserContext, Page, type BrowserLaunchOptions } from 'playwright'

export interface PlaywrightConfig {
  headless?: boolean
  timeout?: number
  retries?: number
  stealth?: boolean
  userAgent?: string
  viewport?: { width: number; height: number }
  proxy?: {
    server: string
    username?: string
    password?: string
  }
}

export interface ScrapeResult {
  html: string
  url: string
  success: boolean
  duration: number
  screenshot?: Buffer
  debug: any
}

export class PlaywrightService {
  private browser: Browser | null = null
  private contexts: Map<string, BrowserContext> = new Map()
  private defaultConfig: PlaywrightConfig = {
    headless: true,
    timeout: 30000,
    retries: 2,
    stealth: true,
    viewport: { width: 1920, height: 1080 }
  }

  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
  ]

  constructor(private config: PlaywrightConfig = {}) {
    this.config = { ...this.defaultConfig, ...config }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      const launchOptions: BrowserLaunchOptions = {
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      }

      if (this.config.proxy) {
        launchOptions.proxy = this.config.proxy
      }

      this.browser = await chromium.launch(launchOptions)
    }
    return this.browser
  }

  private getRandomUserAgent(): string {
    return this.config.userAgent || this.userAgents[Math.floor(Math.random() * this.userAgents.length)]
  }

  private async createStealthContext(contextId: string): Promise<BrowserContext> {
    const browser = await this.getBrowser()

    const context = await browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: this.config.viewport,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: [],
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Upgrade-Insecure-Requests': '1'
      }
    })

    // Add stealth modifications
    if (this.config.stealth) {
      await context.addInitScript(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        })

        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        })

        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        })

        // Remove automation indicators
        delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array
        delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise
        delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol

        // Mock chrome object for better detection evasion
        if (!(window as any).chrome) {
          (window as any).chrome = {
            runtime: {},
            loadTimes: function() {},
            csi: function() {},
            app: {}
          }
        }
      })
    }

    this.contexts.set(contextId, context)
    return context
  }

  async scrapeUrl(url: string, options: Partial<PlaywrightConfig> = {}): Promise<ScrapeResult> {
    const startTime = Date.now()
    const finalConfig = { ...this.config, ...options }
    const contextId = `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const debugInfo: any = {
      url,
      startTime: new Date(startTime).toISOString(),
      config: finalConfig,
      contextId,
      userAgent: this.getRandomUserAgent(),
    }

    let page: Page | undefined
    let context: BrowserContext | undefined

    try {
      context = await this.createStealthContext(contextId)
      page = await context.newPage()

      // Set timeout
      page.setDefaultTimeout(finalConfig.timeout || 30000)

      // Block unnecessary resources for faster loading
      await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType()
        if (['image', 'font', 'media'].includes(resourceType)) {
          route.abort()
        } else {
          route.continue()
        }
      })

      debugInfo.navigationStart = Date.now()

      // Navigate with wait for network idle
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: finalConfig.timeout || 30000
      })

      debugInfo.navigationEnd = Date.now()
      debugInfo.navigationDuration = debugInfo.navigationEnd - debugInfo.navigationStart

      // Wait for page to be ready
      await page.waitForLoadState('domcontentloaded')

      // Special handling for LinkedIn to ensure content loads
      if (url.includes('linkedin.com')) {
        try {
          // Wait for job description container to be visible
          await page.waitForSelector('.jobs-description, .job-details, [class*="description"]', {
            timeout: 10000,
            state: 'visible'
          })
          // Scroll to load lazy content
          await page.evaluate(() => {
            window.scrollBy(0, 500)
            window.scrollBy(0, -250)
          })
          await page.waitForTimeout(1500)
        } catch {
          // Continue even if selectors not found
        }
      }

      // Add random delay to mimic human behavior
      const delay = Math.random() * 2000 + 500 // 500-2500ms
      await page.waitForTimeout(delay)
      debugInfo.humanDelay = delay

      // Get final URL (in case of redirects)
      const finalUrl = page.url()
      debugInfo.finalUrl = finalUrl

      // Extract HTML
      const html = await page.content()
      debugInfo.htmlLength = html.length

      // Take screenshot for debugging (optional)
      let screenshot: Buffer | undefined
      if (process.env.NODE_ENV === 'development') {
        try {
          screenshot = await page.screenshot({
            fullPage: false,
            clip: { x: 0, y: 0, width: 1200, height: 800 }
          })
          debugInfo.screenshotTaken = true
        } catch (screenshotError) {
          debugInfo.screenshotError = screenshotError instanceof Error ? screenshotError.message : 'Unknown screenshot error'
        }
      }

      const duration = Date.now() - startTime
      debugInfo.totalDuration = duration
      debugInfo.success = true

      return {
        html,
        url: finalUrl,
        success: true,
        duration,
        screenshot,
        debug: debugInfo
      }

    } catch (error: any) {
      const duration = Date.now() - startTime
      debugInfo.totalDuration = duration
      debugInfo.success = false
      debugInfo.error = error.message
      debugInfo.errorName = error.name

      console.error('[Playwright] Scraping failed:', {
        url,
        error: error.message,
        duration,
        contextId
      })

      // Take screenshot on error for debugging
      let screenshot: Buffer | undefined
      if (page) {
        try {
          screenshot = await page.screenshot()
          debugInfo.errorScreenshotTaken = true
        } catch {
          // Ignore screenshot errors
        }
      }

      return {
        html: '',
        url,
        success: false,
        duration,
        screenshot,
        debug: debugInfo
      }
    } finally {
      // Cleanup
      try {
        if (page) await page.close()
        if (context) {
          await context.close()
          this.contexts.delete(contextId)
        }
      } catch (cleanupError) {
        console.warn('[Playwright] Cleanup error:', cleanupError)
      }
    }
  }

  async scrapeJobUrl(url: string, options: Partial<PlaywrightConfig> = {}): Promise<{ html: string; debug: any }> {
    const result = await this.scrapeUrl(url, options)

    if (!result.success) {
      const error = new Error(`Playwright scraping failed: ${result.debug.error || 'Unknown error'}`)
      ;(error as any).debug = result.debug
      throw error
    }

    return {
      html: result.html,
      debug: result.debug
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.scrapeUrl('https://httpbin.org/html', {
        timeout: 10000
      })
      return result.success
    } catch {
      return false
    }
  }

  async close(): Promise<void> {
    // Close all contexts
    for (const [contextId, context] of this.contexts.entries()) {
      try {
        await context.close()
        this.contexts.delete(contextId)
      } catch (error) {
        console.warn(`[Playwright] Failed to close context ${contextId}:`, error)
      }
    }

    // Close browser
    if (this.browser) {
      try {
        await this.browser.close()
        this.browser = null
      } catch (error) {
        console.warn('[Playwright] Failed to close browser:', error)
      }
    }
  }
}

// Factory function
export function createPlaywrightService(config: PlaywrightConfig = {}): PlaywrightService {
  return new PlaywrightService(config)
}

// Singleton instance for global use
let globalPlaywrightService: PlaywrightService | null = null

export function getPlaywrightService(): PlaywrightService {
  if (!globalPlaywrightService) {
    globalPlaywrightService = new PlaywrightService({
      headless: process.env.NODE_ENV === 'production',
      timeout: 30000,
      retries: 2,
      stealth: true
    })
  }
  return globalPlaywrightService
}

// Cleanup on process exit
process.on('exit', () => {
  if (globalPlaywrightService) {
    globalPlaywrightService.close()
  }
})

process.on('SIGINT', () => {
  if (globalPlaywrightService) {
    globalPlaywrightService.close()
  }
  process.exit(0)
})

process.on('SIGTERM', () => {
  if (globalPlaywrightService) {
    globalPlaywrightService.close()
  }
  process.exit(0)
})
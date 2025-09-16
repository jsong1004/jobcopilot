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

      // Block unnecessary resources for faster loading (SPA-friendly)
      await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType()
        const url = route.request().url()

        // Don't block critical SPA resources
        if (url.includes('/_next/') || url.includes('/static/') ||
            url.includes('.js') || url.includes('.css') ||
            url.includes('/api/') || url.includes('graphql')) {
          route.continue()
        } else if (['image', 'font', 'media'].includes(resourceType)) {
          // Still block heavy media resources
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

      // Special handling for GrabJobs/JobCopilot SPAs
      if (url.includes('grabjobs.com') || url.includes('jobcopilot.com') || url.includes('app.jobcopilot.com')) {
        try {
          console.log('[Playwright] Special SPA handling for GrabJobs/JobCopilot')

          // Step 1: Wait for network idle with longer timeout for SPA initialization
          await page.waitForLoadState('networkidle', { timeout: 20000 })
          console.log('[Playwright] Network idle reached')

          // Step 2: Wait for React/Next.js app to initialize
          await page.evaluate(async () => {
            return new Promise((resolve) => {
              const checkReactReady = () => {
                // Check for React root or Next.js app indicators
                const reactRoot = document.querySelector('#__next, #root, [data-reactroot]')
                const hasReactContent = document.querySelector('[class*="react"], [class*="next"]')

                if (reactRoot && (reactRoot.children.length > 0 || hasReactContent)) {
                  console.log('React/Next.js app initialized')
                  resolve(true)
                } else {
                  setTimeout(checkReactReady, 100)
                }
              }
              checkReactReady()
              // Fallback after 10 seconds
              setTimeout(() => resolve(true), 10000)
            })
          })

          // Step 3: Wait for specific API calls to complete
          const apiCallsComplete = page.evaluate(async () => {
            return new Promise((resolve) => {
              let apiCallCount = 0
              let completedCalls = 0

              // Monitor fetch requests
              const originalFetch = window.fetch
              window.fetch = async (...args) => {
                apiCallCount++
                console.log(`API call started: ${args[0]}`)
                try {
                  const response = await originalFetch(...args)
                  completedCalls++
                  console.log(`API call completed: ${args[0]} (${completedCalls}/${apiCallCount})`)
                  return response
                } catch (error) {
                  completedCalls++
                  console.log(`API call failed: ${args[0]} (${completedCalls}/${apiCallCount})`)
                  throw error
                }
              }

              // Wait for API calls to settle
              const checkAPIsComplete = () => {
                if (apiCallCount > 0 && completedCalls >= apiCallCount) {
                  console.log('All API calls completed')
                  resolve(true)
                } else {
                  setTimeout(checkAPIsComplete, 500)
                }
              }

              // Start monitoring
              setTimeout(checkAPIsComplete, 1000)
              // Fallback after 15 seconds
              setTimeout(() => {
                console.log(`API timeout: ${completedCalls}/${apiCallCount} calls completed`)
                resolve(true)
              }, 15000)
            })
          })

          await apiCallsComplete
          console.log('[Playwright] API calls monitoring complete')

          // Step 4: Wait for content to be populated
          const contentSelectors = [
            // Job title selectors
            'h1:not(:empty)',
            '[class*="title"]:not(:empty)',
            '[class*="job"]:not(:empty)',
            '[data-testid*="title"]:not(:empty)',
            // Content areas
            '[class*="content"]:not(:empty)',
            '[class*="description"]:not(:empty)',
            '[class*="detail"]:not(:empty)',
            // Company info
            '[class*="company"]:not(:empty)',
            '[class*="employer"]:not(:empty)'
          ]

          let contentFound = false
          for (const selector of contentSelectors) {
            try {
              await page.waitForSelector(selector, {
                timeout: 5000,
                state: 'visible'
              })

              // Verify the element has meaningful text content
              const hasContent = await page.evaluate((sel) => {
                const element = document.querySelector(sel)
                return element && element.textContent && element.textContent.trim().length > 10
              }, selector)

              if (hasContent) {
                console.log(`[Playwright] Content found with selector: ${selector}`)
                contentFound = true
                break
              }
            } catch {
              // Continue to next selector
            }
          }

          if (!contentFound) {
            console.log('[Playwright] No content selectors matched, waiting for any text content')
            // Fallback: wait for any substantial text content
            await page.evaluate(async () => {
              return new Promise((resolve) => {
                const checkForContent = () => {
                  const bodyText = document.body.innerText
                  if (bodyText && bodyText.length > 500) {
                    console.log(`Found ${bodyText.length} chars of content`)
                    resolve(true)
                  } else {
                    setTimeout(checkForContent, 500)
                  }
                }
                checkForContent()
                // Fallback after 10 seconds
                setTimeout(() => resolve(true), 10000)
              })
            })
          }

          // Step 5: Trigger lazy loading with intelligent scrolling
          await page.evaluate(async () => {
            return new Promise((resolve) => {
              let scrollPosition = 0
              const scrollStep = 300
              const maxScrolls = 10
              let scrollCount = 0

              const smoothScroll = () => {
                if (scrollCount >= maxScrolls) {
                  window.scrollTo(0, 0) // Return to top
                  setTimeout(() => resolve(true), 1000)
                  return
                }

                scrollPosition += scrollStep
                window.scrollTo(0, scrollPosition)
                scrollCount++

                // Wait for potential lazy loading
                setTimeout(smoothScroll, 800)
              }

              smoothScroll()
            })
          })

          // Step 6: Final wait for any remaining dynamic content
          await page.waitForTimeout(2000)

          console.log('[Playwright] GrabJobs SPA handling completed successfully')

        } catch (error) {
          console.error('[Playwright] GrabJobs SPA handling error:', error)
          // Fallback: basic wait strategy
          await page.waitForTimeout(5000)
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
import { NextRequest, NextResponse } from 'next/server'
import { parseFromUrl } from '@/lib/job-parsers'
import { JobScrapingService } from '@/lib/scraping/job-scraping-service'

// Force dynamic rendering to avoid build-time static analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Simple in-memory rate limiting (resets on server restart)
const rateLimiter = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10

const USER_AGENTS = [
  // Latest Chrome versions with different OS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // Latest Firefox versions
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',

  // Latest Safari
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Safari/605.1.15',

  // Edge
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
]

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

const DEFAULT_HEADERS: Record<string, string> = {
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
}

async function fetchHtml(url: string, retryCount = 0): Promise<{ html: string; debug: any }> {
  const maxRetries = 2
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000) // Increase timeout to 25s

  // Add small random delay to avoid predictable request patterns
  const delay = Math.random() * 1000 + 500 // 500-1500ms delay
  if (retryCount === 0) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  const debugInfo: any = {
    url,
    attempt: retryCount + 1,
    timestamp: new Date().toISOString(),
  }
  
  try {
    const u = new URL(url)
    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
      'User-Agent': getRandomUserAgent(),
    }
    
    // Site-specific headers
    if (u.hostname.includes('linkedin.com')) {
      headers['Referer'] = 'https://www.google.com/'
      headers['Sec-Fetch-Site'] = 'cross-site'
      headers['Sec-Fetch-Mode'] = 'navigate'
      headers['Sec-Fetch-Dest'] = 'document'
      headers['Sec-Fetch-User'] = '?1'
      headers['Upgrade-Insecure-Requests'] = '1'
      debugInfo.specialHeaders = 'LinkedIn'
    } else if (u.hostname.includes('indeed.com')) {
      // More realistic headers for Indeed
      headers['Referer'] = Math.random() > 0.5 ? 'https://www.google.com/' : 'https://www.indeed.com/'
      headers['Sec-Fetch-Site'] = 'cross-site'
      headers['Sec-Fetch-Mode'] = 'navigate'
      headers['Sec-Fetch-Dest'] = 'document'
      headers['Sec-Fetch-User'] = '?1'
      headers['Upgrade-Insecure-Requests'] = '1'
      headers['DNT'] = '1'
      headers['Connection'] = 'keep-alive'
      headers['Sec-CH-UA'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"'
      headers['Sec-CH-UA-Mobile'] = '?0'
      headers['Sec-CH-UA-Platform'] = Math.random() > 0.5 ? '"macOS"' : '"Windows"'
      debugInfo.specialHeaders = 'Indeed Enhanced'
    } else if (u.hostname.includes('wellfound.com') || u.hostname.includes('angel.co')) {
      headers['Referer'] = 'https://www.google.com/'
      debugInfo.specialHeaders = 'Wellfound'
    }
    
    debugInfo.headers = headers
    debugInfo.fetchStartTime = Date.now()
    
    const res = await fetch(url, { 
      headers, 
      signal: controller.signal, 
      redirect: 'follow', 
      cache: 'no-store',
      credentials: 'omit',
    })
    
    debugInfo.fetchEndTime = Date.now()
    debugInfo.fetchDuration = debugInfo.fetchEndTime - debugInfo.fetchStartTime
    debugInfo.status = res.status
    debugInfo.statusText = res.statusText
    debugInfo.responseHeaders = Object.fromEntries(Array.from(res.headers.entries()))
    debugInfo.finalUrl = res.url
    
    if (!res.ok) {
      debugInfo.error = `HTTP ${res.status}: ${res.statusText}`
      
      // If forbidden, try Jina Reader fallback once
      if (res.status === 403) {
        try {
          const originalUrl = new URL(url)
          const jinaUrl = `https://r.jina.ai/http://${originalUrl.hostname}${originalUrl.pathname}${originalUrl.search}`
          debugInfo.jinaFallbackUrl = jinaUrl
          const jinaStart = Date.now()
          const jinaRes = await fetch(jinaUrl, { signal: controller.signal, redirect: 'follow', cache: 'no-store' })
          debugInfo.jinaStatus = jinaRes.status
          debugInfo.jinaFetchDuration = Date.now() - jinaStart
          if (jinaRes.ok) {
            const jtext = await jinaRes.text()
            debugInfo.jinaUsed = true
            debugInfo.htmlLength = jtext.length
            debugInfo.htmlPreview = jtext.substring(0, 500)
            // Basic block detection on fallback
            if (jtext.toLowerCase().includes('blocked') || jtext.toLowerCase().includes('captcha') || jtext.toLowerCase().includes('robot')) {
              debugInfo.possibleBlock = true
              debugInfo.blockKeywords = ['blocked', 'captcha', 'robot'].filter(k => jtext.toLowerCase().includes(k))
            }
            const cappedText = jtext.slice(0, 2_000_000)
            if (jtext.length > 2_000_000) {
              debugInfo.htmlTruncated = true
              debugInfo.originalLength = jtext.length
            }
            return { html: cappedText, debug: debugInfo }
          }
        } catch (jinaErr: any) {
          debugInfo.jinaError = jinaErr?.message || 'Unknown Jina error'
        }
      }
      
      // Retry logic for specific status codes
      if ((res.status === 429 || res.status === 503 || res.status >= 500) && retryCount < maxRetries) {
        console.log(`[jobs/parse] Retrying after ${res.status} error (attempt ${retryCount + 1}/${maxRetries})`)
        clearTimeout(timeout)
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))) // Exponential backoff
        return fetchHtml(url, retryCount + 1)
      }
      
      const e = new Error(`Failed to fetch (${res.status} ${res.statusText})`)
      ;(e as any).debug = debugInfo
      throw e
    }
    
    const text = await res.text()
    debugInfo.htmlLength = text.length
    debugInfo.htmlPreview = text.substring(0, 500)
    
    // Check if we got a blocking page
    if (text.includes('blocked') || text.includes('captcha') || text.includes('robot') || text.includes('forbidden')) {
      debugInfo.possibleBlock = true
      debugInfo.blockKeywords = ['blocked', 'captcha', 'robot', 'forbidden'].filter(k => text.toLowerCase().includes(k))
    }
    
    // Check for common error pages
    if (text.includes('404') || text.includes('not found') || text.includes('page does not exist')) {
      debugInfo.possible404 = true
    }
    
    // Cap size to avoid huge responses
    const cappedText = text.slice(0, 2_000_000)
    if (text.length > 2_000_000) {
      debugInfo.htmlTruncated = true
      debugInfo.originalLength = text.length
    }
    
    return { html: cappedText, debug: debugInfo }
  } catch (error: any) {
    debugInfo.fetchError = error.message
    debugInfo.errorName = error.name
    debugInfo.errorStack = error.stack?.split('\n').slice(0, 3).join('\n')
    
    // Retry on timeout or network errors
    if ((error.name === 'AbortError' || error.message.includes('network')) && retryCount < maxRetries) {
      console.log(`[jobs/parse] Retrying after ${error.name} (attempt ${retryCount + 1}/${maxRetries})`)
      clearTimeout(timeout)
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
      return fetchHtml(url, retryCount + 1)
    }
    
    if (!error.debug) {
      ;(error as any).debug = debugInfo
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    if (!['http:', 'https:'].includes(u.protocol)) return false
    // Disallow IPs for safety
    if (/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) return false
    return true
  } catch {
    return false
  }
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const clientData = rateLimiter.get(clientId)

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize
    rateLimiter.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return false // Rate limited
  }

  clientData.count++
  return true
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let debugInfo: any = {
    startTime: new Date(startTime).toISOString(),
    endpoint: '/api/jobs/parse',
  }

  try {
    // Simple rate limiting based on IP
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(clientId)) {
      console.warn(`[jobs/parse] Rate limit exceeded for client: ${clientId}`)
      return NextResponse.json({
        error: 'Rate limit exceeded. Please try again later.',
        rateLimited: true
      }, { status: 429 })
    }

    const body = await req.json()
    const { url, debug: requestDebug } = body
    debugInfo.requestedUrl = url
    debugInfo.debugMode = requestDebug || false
    debugInfo.clientId = clientId
    
    if (!url || !isValidHttpUrl(url)) {
      debugInfo.error = 'Invalid URL'
      debugInfo.validation = { url, isValid: false }
      console.error('[jobs/parse] Invalid URL:', url)
      return NextResponse.json({ 
        error: 'Invalid URL',
        debug: debugInfo
      }, { status: 400 })
    }
    
    const domain = new URL(url).hostname.replace(/^www\./, '')
    debugInfo.domain = domain
    
    console.log(`[jobs/parse] Starting parse for ${domain}: ${url}`)

    // Use the new enhanced scraping service
    const scrapingService = new JobScrapingService()
    const result = await scrapingService.scrapeJob(url, { debug: requestDebug })

    // Merge debug information
    debugInfo.scrapingDebug = result.debug
    debugInfo.parsedResult = {
      hasTitle: !!result.job.title,
      hasCompany: !!result.job.company,
      hasLocation: !!result.job.location,
      hasDescription: !!result.job.description,
      descriptionLength: result.job.description?.length || 0,
      hasSalary: !!result.job.salary,
      hasPostedAt: !!result.job.postedAt,
      source: result.job.source,
    }

    // Calculate success score
    const fields = ['title', 'company', 'location', 'description']
    const filledFields = fields.filter(f => result.job[f as keyof typeof result.job])
    debugInfo.successScore = `${filledFields.length}/${fields.length}`
    debugInfo.filledFields = filledFields
    debugInfo.missingFields = fields.filter(f => !result.job[f as keyof typeof result.job])

    const totalTime = Date.now() - startTime
    debugInfo.totalTime = totalTime
    debugInfo.success = result.debug.success

    console.log(`[jobs/parse] Parse completed for ${domain} (${debugInfo.successScore} fields, ${totalTime}ms, service: ${result.debug.finalStrategy?.service || 'unknown'})`)

    const response: any = { job: result.job }
    if (requestDebug) {
      response.debug = debugInfo
    }

    return NextResponse.json(response)
  } catch (err: any) {
    const totalTime = Date.now() - startTime
    debugInfo.totalTime = totalTime
    debugInfo.success = false
    debugInfo.error = err?.message || 'Unknown error'
    debugInfo.errorName = err?.name
    debugInfo.errorStack = err?.stack?.split('\n').slice(0, 5).join('\n')
    if (!debugInfo.fetchDebug && err?.debug) {
      debugInfo.fetchDebug = err.debug
    }
    
    console.error('[jobs/parse] Parse failed:', {
      url: debugInfo.requestedUrl,
      domain: debugInfo.domain,
      error: err?.message,
      scrapingDebug: debugInfo.scrapingDebug,
      totalTime,
    })
    
    // Graceful fallback: return minimal object so UI can continue manual entry
    const domain = debugInfo.domain || (debugInfo.requestedUrl ? new URL(debugInfo.requestedUrl).hostname.replace(/^www\./, '') : 'unknown')
    
    const response: any = { 
      job: { 
        applyUrl: debugInfo.requestedUrl || '', 
        source: domain 
      }
    }
    
    if (debugInfo.debugMode) {
      response.debug = debugInfo
      response.error = err?.message || 'Parse failed'
    }
    
    return NextResponse.json(response)
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { JobScrapingService } from '@/lib/scraping/job-scraping-service'
import { getDomainInfo } from '@/lib/scraping/config'

// Force dynamic rendering to avoid build-time static analysis
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Test URLs for different job sites
const TEST_URLS = {
  linkedin: 'https://www.linkedin.com/jobs/view/3766565837',
  indeed: 'https://www.indeed.com/viewjob?jk=test123',
  wellfound: 'https://wellfound.com/l/test',
  lever: 'https://jobs.lever.co/example/test',
  greenhouse: 'https://boards.greenhouse.io/example/jobs/test',
  httpbin: 'https://httpbin.org/html', // Simple test URL
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const testUrl = searchParams.get('url')
  const service = searchParams.get('service') // 'scrapfly', 'http', or 'auto'
  const verbose = searchParams.get('verbose') === 'true'

  try {
    const scrapingService = new JobScrapingService()

    // If no URL provided, return test options
    if (!testUrl) {
      const serviceStatus = await scrapingService.getServiceStatus()

      return NextResponse.json({
        message: 'ScrapFly Job Parsing Test Endpoint',
        usage: 'Add ?url=<job_url>&service=<scrapfly|http|auto>&verbose=true',
        testUrls: TEST_URLS,
        serviceStatus,
        examples: [
          '/api/jobs/parse/test?url=https://httpbin.org/html&service=scrapfly&verbose=true',
          '/api/jobs/parse/test?url=https://www.indeed.com/viewjob?jk=test&service=auto&verbose=true'
        ]
      })
    }

    // Validate URL
    try {
      new URL(testUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      )
    }

    console.log(`[ScrapFly Test] Testing URL: ${testUrl} with service: ${service || 'auto'}`)

    const startTime = Date.now()

    // Get domain info
    const domainInfo = getDomainInfo(testUrl)

    // Test the scraping
    const result = await scrapingService.scrapeJob(testUrl, { debug: true })

    const endTime = Date.now()
    const totalTime = endTime - startTime

    // Calculate success metrics
    const fields = ['title', 'company', 'location', 'description']
    const filledFields = fields.filter(f => result.job[f as keyof typeof result.job])
    const successScore = `${filledFields.length}/${fields.length}`

    const response: any = {
      success: result.debug.success,
      url: testUrl,
      totalTime,
      successScore,
      filledFields,
      domainInfo,
      job: {
        title: result.job.title || null,
        company: result.job.company || null,
        location: result.job.location || null,
        hasDescription: !!result.job.description,
        descriptionLength: result.job.description?.length || 0,
        salary: result.job.salary || null,
        source: result.job.source,
      }
    }

    if (verbose) {
      response.debug = result.debug
      response.fullJob = result.job
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[ScrapFly Test] Error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      url: testUrl,
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { urls, service = 'auto', verbose = false } = body

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of URLs to test' },
        { status: 400 }
      )
    }

    if (urls.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 URLs allowed for batch testing' },
        { status: 400 }
      )
    }

    const scrapingService = new JobScrapingService()
    const results = []

    for (const url of urls) {
      try {
        console.log(`[ScrapFly Batch Test] Testing: ${url}`)

        const startTime = Date.now()
        const result = await scrapingService.scrapeJob(url, { debug: verbose })
        const endTime = Date.now()

        const fields = ['title', 'company', 'location', 'description']
        const filledFields = fields.filter(f => result.job[f as keyof typeof result.job])

        results.push({
          url,
          success: result.debug.success,
          successScore: `${filledFields.length}/${fields.length}`,
          service: result.debug.finalStrategy?.service || 'unknown',
          attempts: result.debug.attempts,
          totalTime: endTime - startTime,
          filledFields,
          job: verbose ? result.job : {
            title: result.job.title || null,
            company: result.job.company || null,
            hasDescription: !!result.job.description,
          },
          debug: verbose ? result.debug : undefined,
        })

      } catch (error) {
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      // Small delay between requests to be nice to services
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Calculate overall statistics
    const successCount = results.filter(r => r.success).length
    const totalAttempts = results.reduce((sum, r) => sum + (r.attempts || 0), 0)
    const avgTime = results.reduce((sum, r) => sum + (r.totalTime || 0), 0) / results.length

    return NextResponse.json({
      summary: {
        total: urls.length,
        successful: successCount,
        successRate: `${Math.round((successCount / urls.length) * 100)}%`,
        averageTime: Math.round(avgTime),
        totalAttempts,
      },
      results,
    })

  } catch (error) {
    console.error('[ScrapFly Batch Test] Error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
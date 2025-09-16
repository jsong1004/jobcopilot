export interface ScrapingConfig {
  service: 'playwright' | 'scrapfly' | 'http' | 'browserless'
  jsRendering: boolean
  proxyType: 'datacenter' | 'residential'
  retries: number
  timeout: number
  priority: number // 1 = highest priority
}

export interface DomainConfig {
  domain: string
  configs: ScrapingConfig[]
  blockingLevel: 'low' | 'medium' | 'high' | 'extreme'
  requiresJs: boolean
  notes?: string
}

// Domain-specific configurations based on known blocking patterns
export const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    domain: 'linkedin.com',
    blockingLevel: 'extreme',
    requiresJs: true,
    configs: [
      {
        service: 'playwright',
        jsRendering: true,
        proxyType: 'datacenter',
        retries: 2,
        timeout: 45000,
        priority: 1,
      },
      {
        service: 'http',
        jsRendering: false,
        proxyType: 'datacenter',
        retries: 1,
        timeout: 25000,
        priority: 2,
      },
    ],
    notes: 'LinkedIn has extremely aggressive bot detection',
  },
  {
    domain: 'indeed.com',
    blockingLevel: 'high',
    requiresJs: true,
    configs: [
      {
        service: 'playwright',
        jsRendering: true,
        proxyType: 'datacenter',
        retries: 2,
        timeout: 35000,
        priority: 1,
      },
      {
        service: 'http',
        jsRendering: false,
        proxyType: 'datacenter',
        retries: 2,
        timeout: 25000,
        priority: 2,
      },
    ],
    notes: 'Indeed blocks aggressively but sometimes allows simple requests',
  },
  {
    domain: 'glassdoor.com',
    blockingLevel: 'high',
    requiresJs: true,
    configs: [
      {
        service: 'playwright',
        jsRendering: true,
        proxyType: 'datacenter',
        retries: 2,
        timeout: 35000,
        priority: 1,
      },
      {
        service: 'http',
        jsRendering: false,
        proxyType: 'datacenter',
        retries: 1,
        timeout: 25000,
        priority: 2,
      },
    ],
    notes: 'Glassdoor requires residential proxies',
  },
  {
    domain: 'wellfound.com',
    blockingLevel: 'medium',
    requiresJs: true,
    configs: [
      {
        service: 'playwright',
        jsRendering: true,
        proxyType: 'datacenter',
        retries: 2,
        timeout: 30000,
        priority: 1,
      },
      {
        service: 'http',
        jsRendering: false,
        proxyType: 'datacenter',
        retries: 1,
        timeout: 20000,
        priority: 2,
      },
    ],
    notes: 'AngelList/Wellfound has moderate protection',
  },
  {
    domain: 'lever.co',
    blockingLevel: 'low',
    requiresJs: false,
    configs: [
      {
        service: 'http',
        jsRendering: false,
        proxyType: 'datacenter',
        retries: 2,
        timeout: 20000,
        priority: 1,
      },
      {
        service: 'playwright',
        jsRendering: true,
        proxyType: 'datacenter',
        retries: 1,
        timeout: 25000,
        priority: 2,
      },
    ],
    notes: 'Lever usually allows simple HTTP requests',
  },
  {
    domain: 'greenhouse.io',
    blockingLevel: 'low',
    requiresJs: false,
    configs: [
      {
        service: 'http',
        jsRendering: false,
        proxyType: 'datacenter',
        retries: 2,
        timeout: 20000,
        priority: 1,
      },
    ],
    notes: 'Greenhouse is generally bot-friendly',
  },
]

// Default fallback configuration for unknown domains
export const DEFAULT_CONFIG: ScrapingConfig[] = [
  {
    service: 'http',
    jsRendering: false,
    proxyType: 'datacenter',
    retries: 1,
    timeout: 20000,
    priority: 1,
  },
  {
    service: 'playwright',
    jsRendering: true,
    proxyType: 'datacenter',
    retries: 1,
    timeout: 30000,
    priority: 2,
  },
]

export function getScrapingStrategy(url: string, attempt: number = 0): ScrapingConfig {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '')

    // Find domain-specific configuration
    const domainConfig = DOMAIN_CONFIGS.find(config =>
      domain.includes(config.domain) || config.domain.includes(domain)
    )

    const configs = domainConfig?.configs || DEFAULT_CONFIG

    // Return configuration based on attempt number
    if (attempt < configs.length) {
      return configs[attempt]
    }

    // Fallback to last configuration if we've exceeded attempts
    return configs[configs.length - 1]
  } catch {
    // Invalid URL, return default
    return DEFAULT_CONFIG[0]
  }
}

export function getDomainInfo(url: string): DomainConfig | null {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '')
    return DOMAIN_CONFIGS.find(config =>
      domain.includes(config.domain) || config.domain.includes(domain)
    ) || null
  } catch {
    return null
  }
}

export function getMaxAttempts(url: string): number {
  const domainConfig = getDomainInfo(url)
  return domainConfig?.configs.length || DEFAULT_CONFIG.length
}
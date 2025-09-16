import { NextResponse } from 'next/server'

export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY
  const allEnvVars = Object.keys(process.env).filter(key => 
    key.includes('GEMINI') || key.includes('GMAIL') || key.includes('OPENROUTER') || key.includes('SERPAPI')
  )
  
  return NextResponse.json({
    geminiKey: {
      present: !!geminiKey,
      length: geminiKey?.length || 0,
      firstChars: geminiKey?.substring(0, 10) || 'undefined',
      lastChars: geminiKey?.substring(-10) || 'undefined'
    },
    relevantEnvVars: allEnvVars.reduce((acc, key) => {
      acc[key] = {
        present: !!process.env[key],
        length: process.env[key]?.length || 0,
        firstChars: process.env[key]?.substring(0, 10) || 'undefined'
      }
      return acc
    }, {} as any),
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    serverInfo: {
      platform: process.platform,
      nodeVersion: process.version
    }
  })
}


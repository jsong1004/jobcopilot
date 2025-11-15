import { NextRequest, NextResponse } from "next/server"
import puppeteer from 'puppeteer'

export async function POST(req: NextRequest) {
  try {
    const analysisData = await req.json()
    
    // Generate HTML content for the PDF
    const htmlContent = generateAnalysisHTML(analysisData)
    
    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Overcome limited resource problems in Docker
      ]
    })
    
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    })
    
    await browser.close()
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${analysisData.job.title.replace(/[^a-zA-Z0-9]/g, '_')}_Match_Analysis.pdf"`
      }
    })
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generateAnalysisHTML(analysisData: any) {
  const { job, enhancedScoreDetails } = analysisData

  // Helper function to get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#16a34a' // green-600
    if (score >= 80) return '#059669' // green-700
    if (score >= 70) return '#D97706' // orange-600
    if (score >= 60) return '#F59E0B' // yellow-500
    if (score >= 45) return '#EF4444' // red-500
    return '#DC2626' // red-600
  }

  // Helper function to get score icon
  const getScoreIcon = (score: number) => {
    if (score >= 80) return '✅'
    if (score >= 60) return '⚠️'
    return '❌'
  }

  // Helper function to render markdown-like text as HTML
  const renderMarkdown = (text: string) => {
    if (!text) return ''
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '•')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
  }

  // Helper function to extract weaknesses with improvement plans
  const extractWeaknesses = (gaps: any): Array<{weakness: string, impact: string, plan: {shortTerm: string, midTerm: string, longTerm: string}}> => {
    if (!gaps) return []
    if (Array.isArray(gaps)) {
      return gaps.map(gap => {
        if (typeof gap === 'object' && gap !== null) {
          return {
            weakness: gap.weakness || gap.description || 'Unknown weakness',
            impact: gap.impact || 'Impact not specified',
            plan: gap.improvementPlan || {
              shortTerm: 'No short-term plan',
              midTerm: 'No mid-term plan',
              longTerm: 'No long-term plan'
            }
          }
        }
        return {
          weakness: String(gap),
          impact: 'Impact not specified',
          plan: { shortTerm: 'Develop skills', midTerm: 'Build experience', longTerm: 'Master competency' }
        }
      })
    }
    return []
  }

  // 4-category mapping from enhanced breakdown
  const categories = enhancedScoreDetails?.breakdown ? [
    {
      key: 'technicalSkills',
      title: 'Technical Competency',
      icon: '🛠️',
      score: enhancedScoreDetails.breakdown.technicalSkills?.score || 0,
      reasoning: enhancedScoreDetails.breakdown.technicalSkills?.reasoning || '',
      strengths: enhancedScoreDetails.breakdown.technicalSkills?.strengths || [],
      gaps: extractWeaknesses(enhancedScoreDetails.breakdown.technicalSkills?.gaps)
    },
    {
      key: 'experienceDepth',
      title: 'Experience & Growth',
      icon: '💼',
      score: enhancedScoreDetails.breakdown.experienceDepth?.score || 0,
      reasoning: enhancedScoreDetails.breakdown.experienceDepth?.reasoning || '',
      strengths: enhancedScoreDetails.breakdown.experienceDepth?.strengths || [],
      gaps: extractWeaknesses(enhancedScoreDetails.breakdown.experienceDepth?.gaps)
    },
    {
      key: 'achievements',
      title: 'Impact & Achievements',
      icon: '🏆',
      score: enhancedScoreDetails.breakdown.achievements?.score || 0,
      reasoning: enhancedScoreDetails.breakdown.achievements?.reasoning || '',
      strengths: enhancedScoreDetails.breakdown.achievements?.strengths || [],
      gaps: extractWeaknesses(enhancedScoreDetails.breakdown.achievements?.gaps)
    },
    {
      key: 'education',
      title: 'Cultural & Educational Fit',
      icon: '🎓',
      score: enhancedScoreDetails.breakdown.education?.score || 0,
      reasoning: enhancedScoreDetails.breakdown.education?.reasoning || '',
      strengths: enhancedScoreDetails.breakdown.education?.strengths || [],
      gaps: extractWeaknesses(enhancedScoreDetails.breakdown.education?.gaps)
    }
  ] : []
  
  // Global insights arrays (fallback if per-category strengths/gaps are not present)
  const asArray = (v: any) => Array.isArray(v) ? v : (v ? [v] : [])
  const globalStrengths: string[] = asArray(enhancedScoreDetails?.keyStrengths).map((s: any) => typeof s === 'string' ? s : JSON.stringify(s))
  const globalWeaknesses: any[] = asArray(enhancedScoreDetails?.keyWeaknesses)
  
  const renderWeaknessItem = (w: any) => {
    try {
      const obj = typeof w === 'string' ? JSON.parse(w) : w
      const title = obj?.weakness || obj?.description || (typeof w === 'string' ? w : JSON.stringify(w))
      const impact = obj?.impact
      const plan = obj?.improvementPlan || obj?.plan || {}
      return `
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="breakdown-title">${title}</span>
          </div>
          ${impact ? `<div class=\"breakdown-reasoning\"><strong>Impact:</strong> ${impact}</div>` : ''}
          ${(plan.shortTerm || plan.midTerm || plan.longTerm) ? `
            <div class=\"breakdown-reasoning\" style=\"margin-top:6px;\">
              ${plan.shortTerm ? `<div><strong>Short term:</strong> ${plan.shortTerm}</div>` : ''}
              ${plan.midTerm ? `<div><strong>Mid term:</strong> ${plan.midTerm}</div>` : ''}
              ${plan.longTerm ? `<div><strong>Long term:</strong> ${plan.longTerm}</div>` : ''}
            </div>
          ` : ''}
        </div>
      `
    } catch {
      return `
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="breakdown-title">${typeof w === 'string' ? w : JSON.stringify(w)}</span>
          </div>
        </div>
      `
    }
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Job Match Analysis - ${job.title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #1e293b;
        }
        .company {
          font-size: 18px;
          color: #64748b;
          margin-bottom: 10px;
        }
        .overall-score {
          font-size: 48px;
          font-weight: bold;
          color: #2563eb;
          margin: 20px 0;
        }
        .category-section {
          margin: 25px 0;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          break-inside: avoid;
        }
        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .category-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
        }
        .category-icon {
          font-size: 20px;
        }
        .score-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: bold;
          font-size: 16px;
        }
        .progress-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          margin: 15px 0;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        .reasoning-section {
          background: #f8fafc;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
          font-size: 14px;
          line-height: 1.5;
        }
        .strengths-section, .gaps-section {
          margin: 15px 0;
        }
        .section-title {
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .strength-item, .gap-item {
          margin-bottom: 6px;
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
        }
        .gap-item {
          background: #fef3c7;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 10px;
          border-bottom: none;
        }
        .gap-weakness {
          font-weight: 600;
          color: #92400e;
          margin-bottom: 4px;
        }
        .gap-impact {
          color: #78716c;
          font-style: italic;
          margin-bottom: 8px;
        }
        .improvement-plan {
          background: #fff;
          padding: 8px;
          border-radius: 4px;
          border-left: 3px solid #f59e0b;
        }
        .plan-item {
          margin-bottom: 4px;
          font-size: 12px;
        }
        .plan-label {
          font-weight: 600;
          color: #92400e;
        }
        .page-break {
          page-break-before: always;
        }
        .summary-section {
          background: #dbeafe;
          padding: 20px;
          border-radius: 8px;
          margin: 30px 0;
        }
        strong {
          font-weight: 600;
        }
        em {
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Job Match Analysis</div>
        <div class="company">${job.title} at ${job.company}</div>
        <div class="overall-score">${job.matchingScore}%</div>
        <div>Overall Match Score</div>
      </div>

      ${categories.map(category => `
        <div class="category-section">
          <div class="category-header">
            <div class="category-title">
              <span class="category-icon">${category.icon}</span>
              <span>${category.title}</span>
            </div>
            <div class="score-badge" style="color: ${getScoreColor(category.score)}">
              <span>${getScoreIcon(category.score)}</span>
              <span>${category.score}%</span>
            </div>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" style="width: ${category.score}%; background: ${getScoreColor(category.score)}"></div>
          </div>

          ${category.reasoning ? `
            <div class="reasoning-section">
              <div>${renderMarkdown(category.reasoning)}</div>
            </div>
          ` : ''}

          ${category.strengths && category.strengths.length > 0 ? `
            <div class="strengths-section">
              <div class="section-title" style="color: #166534;">✅ Key Strengths</div>
              ${category.strengths.map((strength: string) => `
                <div class="strength-item">• ${strength}</div>
              `).join('')}
            </div>
          ` : ''}

          ${category.gaps && category.gaps.length > 0 ? `
            <div class="gaps-section">
              <div class="section-title" style="color: #92400e;">⚠️ Areas for Improvement</div>
              ${category.gaps.map((gap: any) => `
                <div class="gap-item">
                  <div class="gap-weakness">${gap.weakness}</div>
                  <div class="gap-impact">Impact: ${gap.impact}</div>
                  <div class="improvement-plan">
                    <div class="plan-item"><span class="plan-label">Short-term (1 month):</span> ${gap.plan.shortTerm}</div>
                    <div class="plan-item"><span class="plan-label">Mid-term (3 months):</span> ${gap.plan.midTerm}</div>
                    <div class="plan-item"><span class="plan-label">Long-term (6+ months):</span> ${gap.plan.longTerm}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}

      ${(globalStrengths.length > 0 || globalWeaknesses.length > 0) ? `
        <div class="page-break">
          <h2>AI Insights</h2>
          ${globalStrengths.length > 0 ? `
            <div class="insights-section">
              <h3 style="color: #166534;">Key Strengths</h3>
              ${globalStrengths.map((s: string) => `
                <div class="insight-item">
                  <div class="insight-bullet" style="background: #16a34a;"></div>
                  <span>${s}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${globalWeaknesses.length > 0 ? `
            <div class="insights-section">
              <h3 style="color: #ca8a04;">Areas to Improve</h3>
              ${globalWeaknesses.map(renderWeaknessItem).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${enhancedScoreDetails?.hiringRecommendation ? `
        <div class="summary-section">
          <h3 style="margin-top: 0; color: #2563eb;">Hiring Recommendation</h3>
          <p><strong>Overall Assessment:</strong></p>
          <p>${enhancedScoreDetails.hiringRecommendation}</p>

          <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 6px;">
            <strong>Match Category:</strong>
            ${job.matchingScore >= 90 ? '🌟 Exceptional Match - Fast Track to Final Round' :
              job.matchingScore >= 80 ? '🎯 Strong Candidate - Proceed to Technical Interview' :
              job.matchingScore >= 70 ? '👍 Good Potential - Standard Interview Process' :
              job.matchingScore >= 60 ? '🤔 Fair Match - Phone Screen First' :
              job.matchingScore >= 45 ? '⚠️ Weak Match - Consider for Junior/Alternative Roles' : '❌ Poor Match - Do Not Proceed'}
          </div>
        </div>
      ` : ''}

      ${enhancedScoreDetails?.interviewFocus && enhancedScoreDetails.interviewFocus.length > 0 ? `
        <div class="page-break">
          <h3 style="color: #2563eb; margin-bottom: 15px;">🎯 Interview Focus Areas</h3>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px;">
            ${enhancedScoreDetails.interviewFocus.map((focus: string) => `
              <div style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                <span style="color: #2563eb; margin-right: 8px;">•</span>
                <span>${focus}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </body>
    </html>
  `
}
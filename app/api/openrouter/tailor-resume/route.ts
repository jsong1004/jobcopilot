import { NextRequest, NextResponse } from "next/server"
import { logActivity } from "@/lib/activity-logger";
import { initFirebaseAdmin } from "@/lib/firebase-admin-init";
import { getAuth } from "firebase-admin/auth";
import { executeResumeTailoring, executeMultiAgentResumeTailoring } from "@/lib/prompts/api-helpers";
import { MODELS } from "@/lib/prompts/constants";

// Configure route timeout - 5 minutes for complex multi-agent operations
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { 
    message, 
    resume, 
    jobTitle, 
    company, 
    jobDescription, 
    mode = 'agent',
    multiAgent = false,
    scoringAnalysis 
  } = await req.json()
  
  // Debug logging
  console.log('[TailoringAPI] Request parameters:', {
    hasMessage: !!message,
    hasResume: !!resume,
    resumeLength: resume?.length || 0,
    hasJobTitle: !!jobTitle,
    hasCompany: !!company,
    hasJobDescription: !!jobDescription,
    mode,
    multiAgent,
    hasScoring: !!scoringAnalysis
  });
  
  // If resume is missing or empty, try to load default resume
  let finalResume = resume;
  if (!finalResume || !finalResume.trim()) {
    console.log('[TailoringAPI] Resume is missing, attempting to load default resume');
    
    try {
      const token = req.headers.get('Authorization')?.split('Bearer ')[1];
      if (!token) {
        return NextResponse.json({ 
          error: "Resume content is required and user authentication is missing", 
          details: "Cannot load default resume without authentication" 
        }, { status: 401 });
      }

      // Initialize Firebase Admin and get user ID
      initFirebaseAdmin();
      const decodedToken = await getAuth().verifyIdToken(token);
      const userId = decodedToken.uid;

      // Fetch user's default resume from Firestore
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      // Query the resumes collection with userId filter (not subcollection)
      const resumesRef = db.collection('resumes');
      const snapshot = await resumesRef
        .where('userId', '==', userId)
        .where('isDefault', '==', true)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const defaultResumeDoc = snapshot.docs[0];
        const defaultResumeData = defaultResumeDoc.data();
        finalResume = defaultResumeData.content || '';
        console.log('[TailoringAPI] Loaded default resume, length:', finalResume.length);
      } else {
        // Try to get any resume if no default is set
        const allResumesSnapshot = await resumesRef
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        if (!allResumesSnapshot.empty) {
          const anyResumeDoc = allResumesSnapshot.docs[0];
          const anyResumeData = anyResumeDoc.data();
          finalResume = anyResumeData.content || '';
          console.log('[TailoringAPI] Loaded first available resume, length:', finalResume.length);
        }
      }
    } catch (error) {
      console.error('[TailoringAPI] Error loading default resume:', error);
    }
    
    // Final check - if still no resume, return error
    if (!finalResume || !finalResume.trim()) {
      console.error('[TailoringAPI] No resume available after trying to load default');
      return NextResponse.json({ 
        error: "No resume content available", 
        details: "Please upload a resume first or ensure resume content is provided" 
      }, { status: 400 });
    }
  }
  
  try {
    const startTime = Date.now();
    
    // Skip job scoring for resume tailoring - scoring will be done when users save jobs or trigger manual analysis
    console.log('[TailoringAPI] Skipping job scoring - focusing on resume tailoring only');
    let scoringContext = null;
    
    // Get user ID for cache optimization
    let userId = 'anonymous';
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (token) {
      try {
        initFirebaseAdmin();
        const decodedToken = await getAuth().verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        console.warn('[TailoringAPI] Failed to decode token for cache optimization:', error);
      }
    }

    // Use Gemini AI single prompt system for fast, efficient tailoring
    console.log('[TailoringAPI] Starting Gemini AI single prompt tailoring system');
    console.log('[TailoringAPI] Resume length:', finalResume.length, 'characters');
    console.log('[TailoringAPI] Job description length:', jobDescription.length, 'characters');

    // Import Gemini client
    // Ask mode: return direct answer instead of tailoring
    if (mode === 'ask') {
      const { generateQAAnswer } = await import('@/lib/gemini-client')
      const answer = await generateQAAnswer({
        resume: finalResume,
        jobDescription,
        userRequest: message,
        jobTitle: jobTitle || 'Position',
        company: company || 'Company',
        history: (await req.json().catch(() => ({} as any)))?.history || []
      })

      return NextResponse.json({
        success: true,
        reply: answer.reply,
        updatedResume: undefined,
        keyChanges: [],
        matchingScore: undefined,
        usage: { totalTokens: Math.floor((finalResume.length + jobDescription.length) / 4) }
      })
    }

    const { geminiClient } = await import('@/lib/gemini-client');

    const result = await geminiClient.generateResumeTailoring({
      resume: finalResume,
      jobDescription: jobDescription,
      userRequest: message,
      jobTitle: jobTitle || 'Position',
      company: company || 'Company'
    });

    console.log('[TailoringAPI] Gemini AI tailoring completed successfully');

    const timeTaken = (Date.now() - startTime) / 1000;
    
    // Debug token usage for suggestion generation
    if (message?.includes('Generate 3 short, specific suggestions')) {
      console.log('[TailoringAPI] AI Suggestion Generation Debug:', {
        mode,
        hasUsage: !!result.usage,
        totalTokens: result.usage?.totalTokens || 0,
        promptTokens: result.usage?.promptTokens || 0,
        completionTokens: result.usage?.completionTokens || 0,
        cachedTokens: result.usage?.cachedTokens || 0,
        responseType: typeof result,
        responseKeys: Object.keys(result)
      });
    }

    // Log activity (userId already extracted above)
    if (userId !== 'anonymous') {
      await logActivity({
        userId,
        activityType: 'resume_generation',
        tokenUsage: result.usage?.totalTokens || 0,
        timeTaken,
        metadata: { 
          model: MODELS.GPT5_MINI, 
          mode: mode, 
          user_prompt: message,
          prompt_system: 'centralized-legacy',
          multi_agent: false,
          agents_executed: 1,
          resume_loaded_from_db: !resume && !!finalResume,
          scoring_generated: !scoringAnalysis && !!scoringContext,
          cache_enabled: true,
          ...(result.usage && {
            prompt_tokens: result.usage.promptTokens,
            completion_tokens: result.usage.completionTokens,
            cached_tokens: result.usage.cachedTokens || 0,
            cache_hit_rate: result.usage.cachedTokens && result.usage.promptTokens 
              ? (result.usage.cachedTokens / result.usage.promptTokens * 100).toFixed(1) + '%'
              : '0%',
            estimated_cost: result.usage.estimatedCost || 0,
            cost_savings: result.usage.costSavings || 0
          })
        },
      });
    }

    // Map Gemini response to expected format
    const enhancedResult = {
      success: result.success,
      updatedResume: result.tailoredResume,
      reply: result.optimizationSummary,
      keyChanges: result.keyChanges,
      matchingScore: result.matchingScore,
      // Metadata
      multiAgent: false,
      resumeLoadedFromDb: !resume && !!finalResume,
      scoringGenerated: false, // Job scoring skipped for performance
      tailoringMode: 'gemini-single-prompt',
      cacheOptimized: false,
      userId: userId !== 'anonymous' ? userId : undefined,
      usage: {
        totalTokens: Math.floor(finalResume.length / 4 + jobDescription.length / 4), // Estimate
        promptTokens: Math.floor((finalResume.length + jobDescription.length) / 4),
        completionTokens: Math.floor((result.tailoredResume?.length || 0) / 4)
      }
    };

    return NextResponse.json(enhancedResult);
  } catch (err) {
    console.error("Resume tailoring error:", err)
    return NextResponse.json({ 
      error: "Failed to process resume tailoring request", 
      details: err instanceof Error ? err.message : String(err) 
    }, { status: 500 })
  }
}

// Legacy code removed - now using centralized prompt system 
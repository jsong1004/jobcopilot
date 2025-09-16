import { NextRequest, NextResponse } from "next/server"
import { initFirebaseAdmin } from "@/lib/firebase-admin-init"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { SavedJob, JobSearchResult } from "@/lib/types"
import { executeMultiAgentJobScoring, executeEnhancedJobScoring } from "@/lib/prompts/api-helpers"
import { logActivity } from "@/lib/activity-logger"
import { MODELS } from "@/lib/prompts/constants"

export async function GET(req: NextRequest) {
  try {
    initFirebaseAdmin()
    const adminAuth = getAuth()
    const adminDb = getFirestore()

    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = await adminAuth.verifyIdToken(token)
    const userId = decoded.uid

    const snapshot = await adminDb.collection("savedJobs")
      .where("userId", "==", userId)
      .orderBy("savedAt", "desc")
      .get()
    const savedJobs: SavedJob[] = []
    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      savedJobs.push({ id: doc.id, ...doc.data() } as SavedJob)
    })
    return NextResponse.json({ savedJobs })
  } catch (error) {
    console.error("[SavedJobs][GET] Error:", error)
    return NextResponse.json({ error: "Failed to fetch saved jobs" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    initFirebaseAdmin()
    const adminAuth = getAuth()
    const adminDb = getFirestore()

    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = await adminAuth.verifyIdToken(token)
    const userId = decoded.uid
    const body = await req.json()
    const { jobId, title, company, location, summary, salary, matchingScore, scoreDetails, matchingSummary, originalData, useMultiAgent = true } = body
    if (!jobId || !title || !company) {
      return NextResponse.json({ error: "Missing required job fields" }, { status: 400 })
    }

    // Enhanced duplicate prevention: check both jobId and content-based duplicates
    // First check for exact jobId match (existing logic)
    const existingById = await adminDb.collection("savedJobs")
      .where("userId", "==", userId)
      .where("jobId", "==", jobId)
      .get()
    if (!existingById.empty) {
      return NextResponse.json({ error: "Job already saved" }, { status: 409 })
    }

    // Also check for content-based duplicates (same title, company, location)
    // This prevents saving the same job from different sources or manual additions
    const existingByContent = await adminDb.collection("savedJobs")
      .where("userId", "==", userId)
      .get() // Get all user's saved jobs to check content similarity

    // Check for content-based duplicates
    const contentDuplicate = existingByContent.docs.find(doc => {
      const data = doc.data()
      const existingTitle = (data.title || "").toLowerCase().trim()
      const existingCompany = (data.company || "").toLowerCase().trim()
      const existingLocation = (data.location || "").toLowerCase().trim()
      
      const newTitle = title.toLowerCase().trim()
      const newCompany = company.toLowerCase().trim()
      const newLocation = (location || "").toLowerCase().trim()
      
      // Consider it a duplicate if title, company, and location all match
      return existingTitle === newTitle && 
             existingCompany === newCompany && 
             existingLocation === newLocation
    })
    
    if (contentDuplicate) {
      const duplicateData = contentDuplicate.data()
      return NextResponse.json({ 
        error: "Similar job already saved",
        duplicate: {
          id: contentDuplicate.id,
          title: duplicateData.title,
          company: duplicateData.company,
          location: duplicateData.location
        }
      }, { status: 409 })
    }

    // Save job immediately with pending scoring status
    console.log(`[SavedJobs] Saving job ${jobId} immediately, will score in background`)

    const docRef = await adminDb.collection("savedJobs").add({
      userId,
      jobId,
      title,
      company,
      location,
      summary: summary || "",
      salary: salary || "",
      matchingScore: 0, // Will be updated by background scoring
      matchingSummary: "",
      scoreDetails: {},
      savedAt: new Date(),
      appliedAt: null, // Initialize as null, can be updated later
      // New application tracking fields
      status: 'saved', // Default status
      notes: null,
      reminderDate: null,
      reminderNote: null,
      // Background scoring fields
      scoringStatus: 'pending',
      scoringStartedAt: null,
      scoringCompletedAt: null,
      originalData: originalData || {},
    })
    const doc = await docRef.get()
    const savedJobData = {
      id: doc.id,
      ...doc.data()
    }

    // Trigger background scoring (fire and forget)
    try {
      console.log(`[SavedJobs] Triggering background scoring for job ${jobId}`)

      // Make async call to background scoring endpoint
      const host = req.headers.get('host') || 'localhost:3000'
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      const backgroundScoringUrl = `${protocol}://${host}/api/jobs/score-background`

      // Use fetch with no await (fire and forget)
      fetch(backgroundScoringUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId,
          useMultiAgent
        })
      }).catch(error => {
        console.error(`[SavedJobs] Background scoring request failed for job ${jobId}:`, error)
      })

      console.log(`[SavedJobs] Background scoring triggered for job ${jobId}`)
    } catch (error) {
      console.error(`[SavedJobs] Failed to trigger background scoring for job ${jobId}:`, error)
      // Don't fail the save operation if background scoring trigger fails
    }

    return NextResponse.json(savedJobData)
  } catch (error) {
    console.error("[SavedJobs][POST] Error:", error)
    return NextResponse.json({ error: "Failed to save job" }, { status: 500 })
  }
} 
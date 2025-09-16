import { NextRequest, NextResponse } from "next/server"
import { initFirebaseAdmin } from "@/lib/firebase-admin-init"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { SavedJob, JobSearchResult } from "@/lib/types"
import { safeJsonParse } from "@/lib/utils/json-parser"
import { logActivity } from "@/lib/activity-logger"

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
    const { title, company, location, description, applyUrl, salary, source } = body

    if (!title || !company) {
      return NextResponse.json({ error: "Title and company are required" }, { status: 400 })
    }

    // Enhanced duplicate prevention: check for content-based duplicates before creating new job
    // Check for content-based duplicates (same title, company, location)
    const existingJobsByContent = await adminDb.collection("savedJobs")
      .where("userId", "==", userId)
      .get() // Get all user's saved jobs to check content similarity

    // Check for content-based duplicates
    const contentDuplicate = existingJobsByContent.docs.find(doc => {
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

    // Generate a unique jobId for manually added jobs
    const jobId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create original data structure to match existing jobs
    const originalData = {
      id: jobId,
      title,
      company,
      location: location || "",
      description: description || "",
      salary: salary || "",
      postedAt: new Date().toISOString(),
      applyUrl: applyUrl || "",
      source: source || "manual",
      summary: description || ""
    }

    // Save job immediately with pending scoring status
    console.log(`[AddManual] Saving job ${jobId} immediately, will score in background`)

    const docRef = await adminDb.collection("savedJobs").add({
      userId,
      jobId,
      title,
      company,
      location: location || "",
      summary: description || "",
      salary: salary || "",
      source: source || "manual",
      matchingScore: 0, // Will be updated by background scoring
      matchingSummary: "",
      scoreDetails: {},
      savedAt: new Date(),
      appliedAt: null,
      status: 'saved',
      notes: null,
      reminderDate: null,
      reminderNote: null,
      // Background scoring fields
      scoringStatus: 'pending',
      scoringStartedAt: null,
      scoringCompletedAt: null,
      originalData: originalData,
    })

    const doc = await docRef.get()
    const savedJob = { id: doc.id, ...doc.data() } as SavedJob

    // Trigger background scoring (fire and forget)
    try {
      console.log(`[AddManual] Triggering background scoring for job ${jobId}`)

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
          useMultiAgent: true // Use multi-agent for manual jobs
        })
      }).catch(error => {
        console.error(`[AddManual] Background scoring request failed for job ${jobId}:`, error)
      })

      console.log(`[AddManual] Background scoring triggered for job ${jobId}`)
    } catch (error) {
      console.error(`[AddManual] Failed to trigger background scoring for job ${jobId}:`, error)
      // Don't fail the save operation if background scoring trigger fails
    }

    return NextResponse.json({ savedJob })
  } catch (error) {
    console.error("[SavedJobs][AddManual] Error:", error)
    return NextResponse.json({ error: "Failed to add job manually" }, { status: 500 })
  }
}

// Legacy scoring function removed - now using enhanced scoring from api-helpers
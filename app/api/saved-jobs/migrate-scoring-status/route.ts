import { NextRequest, NextResponse } from "next/server"
import { initFirebaseAdmin } from "@/lib/firebase-admin-init"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

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

    console.log(`[MigrateScoringStatus] Starting migration for user ${userId}`)

    // Get all saved jobs for this user that don't have scoringStatus
    const savedJobsSnapshot = await adminDb.collection("savedJobs")
      .where("userId", "==", userId)
      .get()

    let updatedCount = 0
    const batch = adminDb.batch()

    savedJobsSnapshot.forEach((doc) => {
      const data = doc.data()

      // Only update if scoringStatus doesn't exist
      if (!data.scoringStatus) {
        let scoringStatus = 'pending'

        // If the job already has a score, mark it as completed
        if (data.matchingScore !== undefined && data.matchingScore > 0) {
          scoringStatus = 'completed'
        }

        batch.update(doc.ref, {
          scoringStatus,
          scoringStartedAt: null,
          scoringCompletedAt: scoringStatus === 'completed' ? new Date() : null,
        })

        updatedCount++
      }
    })

    if (updatedCount > 0) {
      await batch.commit()
      console.log(`[MigrateScoringStatus] Updated ${updatedCount} saved jobs for user ${userId}`)
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} saved jobs with scoring status`
    })
  } catch (error) {
    console.error("[MigrateScoringStatus] Error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
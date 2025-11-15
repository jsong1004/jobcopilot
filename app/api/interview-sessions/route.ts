import { NextRequest, NextResponse } from "next/server"
import { initFirebaseAdmin } from "@/lib/firebase-admin-init"
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import type { InterviewSession } from "@/lib/types"

/**
 * GET /api/interview-sessions
 * List all interview sessions for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    initFirebaseAdmin()
    const adminAuth = getAuth()
    const adminDb = getFirestore()

    // Authenticate user
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const userId = decoded.uid

    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') // 'active' or 'completed'

    // Query sessions
    let query = adminDb.collection("interviewSessions")
      .where("userId", "==", userId)

    if (status && (status === 'active' || status === 'completed')) {
      query = query.where("status", "==", status)
    }

    const snapshot = await query.orderBy("createdAt", "desc").get()

    const sessions: InterviewSession[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()

      // Filter out old sessions that don't have the new schema
      // This prevents corrupted data from breaking the frontend
      if (!data.currentType) {
        console.log(`Skipping legacy session ${doc.id} - missing currentType field`)
        return
      }

      sessions.push({ id: doc.id, ...data } as InterviewSession)
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("[InterviewSessions][GET] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch interview sessions" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/interview-sessions
 * Create a new interview session
 */
export async function POST(req: NextRequest) {
  try {
    initFirebaseAdmin()
    const adminAuth = getAuth()
    const adminDb = getFirestore()

    // Authenticate user
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const userId = decoded.uid

    // Parse request body
    const body = await req.json()
    const { jobId, jobTitle, company, jobDescription, resume } = body

    // Validate required fields
    if (!jobId || !jobTitle || !company) {
      return NextResponse.json(
        { error: "Missing required fields: jobId, jobTitle, company" },
        { status: 400 }
      )
    }

    // Check for existing active session for this job
    const existingActive = await adminDb.collection("interviewSessions")
      .where("userId", "==", userId)
      .where("jobId", "==", jobId)
      .where("status", "==", "active")
      .get()

    if (!existingActive.empty) {
      // Return existing active session
      const existingDoc = existingActive.docs[0]
      return NextResponse.json({
        session: {
          id: existingDoc.id,
          ...existingDoc.data()
        },
        isExisting: true
      })
    }

    // Create new session with empty conversations for each type
    const now = Timestamp.now()
    const newSession: Omit<InterviewSession, 'id'> = {
      userId,
      jobId,
      jobTitle,
      company,
      jobDescription: jobDescription || '',
      resume: resume || '',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      currentType: 'interview_tips', // Start with interview tips
      conversationsByType: {
        interview_tips: {
          messages: [],
          questions: [],
          tipsShown: false
        },
        recruiter_screen: {
          messages: [],
          questions: [],
          tipsShown: false
        },
        technical_assessment: {
          messages: [],
          questions: [],
          tipsShown: false
        },
        technical_behavioral: {
          messages: [],
          questions: [],
          tipsShown: false
        },
        team_culture_fit: {
          messages: [],
          questions: [],
          tipsShown: false
        }
      }
    }

    const docRef = await adminDb.collection("interviewSessions").add(newSession)

    return NextResponse.json({
      session: {
        id: docRef.id,
        ...newSession
      },
      isExisting: false
    }, { status: 201 })
  } catch (error) {
    console.error("[InterviewSessions][POST] Error:", error)
    return NextResponse.json(
      { error: "Failed to create interview session" },
      { status: 500 }
    )
  }
}

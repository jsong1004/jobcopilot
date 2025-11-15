import { NextRequest, NextResponse } from "next/server"
import { initFirebaseAdmin } from "@/lib/firebase-admin-init"
import { getFirestore, Timestamp } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import type { InterviewSession } from "@/lib/types"

/**
 * GET /api/interview-sessions/[id]
 * Get a specific interview session
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get session ID from params
    const { id: sessionId } = await params

    // Get session document
    const docRef = adminDb.collection("interviewSessions").doc(sessionId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const session = { id: doc.id, ...doc.data() } as InterviewSession

    // Verify ownership
    if (session.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("[InterviewSession][GET] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch interview session" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/interview-sessions/[id]
 * Update an interview session
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get session ID from params
    const { id: sessionId } = await params

    // Get session document
    const docRef = adminDb.collection("interviewSessions").doc(sessionId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const session = doc.data() as InterviewSession

    // Verify ownership
    if (session.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse update data
    const body = await req.json()
    const { status, currentType, conversationsByType, totalScore, completedAt } = body

    // Build update object
    const updates: Partial<InterviewSession> = {
      updatedAt: Timestamp.now()
    }

    if (status) updates.status = status
    if (currentType) updates.currentType = currentType
    if (conversationsByType) updates.conversationsByType = conversationsByType
    if (totalScore !== undefined) updates.totalScore = totalScore
    if (completedAt !== undefined) updates.completedAt = completedAt || Timestamp.now()

    // Update document
    await docRef.update(updates as any)

    // Get updated session
    const updatedDoc = await docRef.get()
    const updatedSession = { id: updatedDoc.id, ...updatedDoc.data() } as InterviewSession

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error("[InterviewSession][PATCH] Error:", error)
    return NextResponse.json(
      { error: "Failed to update interview session" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/interview-sessions/[id]
 * Delete an interview session
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get session ID from params
    const { id: sessionId } = await params

    // Get session document
    const docRef = adminDb.collection("interviewSessions").doc(sessionId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const session = doc.data() as InterviewSession

    // Verify ownership
    if (session.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete document
    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[InterviewSession][DELETE] Error:", error)
    return NextResponse.json(
      { error: "Failed to delete interview session" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Notification handler using Gmail SMTP via Nodemailer.
// Required envs: GMAIL_USER, GMAIL_PASS (App Password recommended).
// Optional: NOTIFY_TO default fallback recipient, GMAIL_FROM custom from email.

async function sendWithGmail(to: string, subject: string, text: string) {
  const user = process.env.GMAIL_USER?.trim()
  // Pass the app password as-is, including spaces if present
  const pass = process.env.GMAIL_PASS
  if (!user || !pass) return { used: false, reason: 'missing_credentials' }

  const from = process.env.GMAIL_FROM?.trim() || user

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })

  await transporter.sendMail({ from, to, subject, text })
  return { used: true }
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, message } = await req.json()
    const defaultTo = process.env.NOTIFY_TO || 'jsong@koreatous.com'
    const emailTo = typeof to === 'string' && to.includes('@') ? to : defaultTo
    const subj = subject || 'myJob notification'
    const text = typeof message === 'string' ? message : JSON.stringify(message)

    // Try Gmail SMTP first
    try {
      console.log('[notify] attempting gmail smtp -> to:', emailTo, 'subject:', subj)
      const gm: any = await sendWithGmail(emailTo, subj, text)
      if (gm.used) {
        // Always log to console for traceability, even when email is sent
        console.log('[notify] gmail -> to:', emailTo, 'subject:', subj, 'message:', text)
        return NextResponse.json({ ok: true, via: 'gmail' })
      } else {
        const hasUser = !!process.env.GMAIL_USER
        const hasPass = !!process.env.GMAIL_PASS
        console.warn('[notify] gmail not used:', gm?.reason || 'unknown', 'env:', { hasUser, hasPass })
        // Continue to fallback
      }
    } catch (err) {
      console.warn('[notify] Gmail SMTP failed, falling back to console:', (err as Error).message)
    }

    // Fallback: log to server console
    console.log('[notify] email fallback -> to:', emailTo, 'subject:', subj, 'message:', text)
    return NextResponse.json({ ok: true, via: 'console' })

  } catch (err: any) {
    console.error('[notify] error:', err?.message || err)
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 400 })
  }
}



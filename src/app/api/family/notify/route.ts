import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { checkRateLimit } from '@/lib/auth/rateLimit'

export const runtime = 'nodejs'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// POST /api/family/notify — Send notification email when a prompted story is answered
export async function POST(request: NextRequest) {
  try {
    // ── Internal auth check ───────────────────────────────────────────────
    const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || process.env.RESEND_API_KEY
    if (!INTERNAL_SECRET) {
      console.warn('[FamilyNotify] No internal secret configured. Blocking request.')
      return NextResponse.json({ sent: false, reason: 'Not configured' })
    }

    const providedSecret = request.headers.get('x-internal-secret')
    if (providedSecret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Rate limiting ─────────────────────────────────────────────────────
    const rateCheck = checkRateLimit('notify-endpoint', true)
    if (!rateCheck.allowed) {
      return NextResponse.json({ sent: false, reason: 'Rate limited' }, { status: 429 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('[FamilyNotify] RESEND_API_KEY not configured. Skipping notification.')
      return NextResponse.json({ sent: false, reason: 'Email not configured' })
    }

    const body = await request.json()
    const { submitterEmail, submitterName, submitterRelationship, storytellerName, storyTitle, storyId } = body

    if (!submitterEmail || !storytellerName) {
      return NextResponse.json({ sent: false, reason: 'Missing required fields' })
    }

    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
      from: 'Embers <notifications@loomiverse.ai>',
      to: submitterEmail,
      subject: `${escapeHtml(storytellerName)} answered your question!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background-color: #0a0a0a; color: #f5f0eb;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; color: #E86D48; margin: 0;">Embers</h1>
          </div>

          <div style="background-color: #1a1a2e; border-radius: 16px; padding: 24px; border: 1px solid rgba(232, 109, 72, 0.15);">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; color: #f5f0eb;">
              Hi ${escapeHtml(submitterName)},
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; color: #f5f0eb;">
              Great news — <strong>${escapeHtml(storytellerName)}</strong> answered your question!
              ${storyTitle ? `The story is called "<em>${escapeHtml(storyTitle)}</em>."` : 'A new story has been shared with you.'}
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; color: #f5f0eb;">
              Their voice, their memories, preserved for your family. This is something you'll treasure.
            </p>

            <div style="text-align: center; margin-top: 24px;">
              <p style="font-size: 14px; color: #9ca3af; margin: 0;">
                Want to ask another question?
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">
              You're receiving this because you asked ${escapeHtml(storytellerName)} a question on Embers.
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('[FamilyNotify] Resend error:', error)
      return NextResponse.json({ sent: false, reason: 'Email delivery failed' })
    }

    console.log(`[FamilyNotify] Notification sent for story by ${escapeHtml(storytellerName)}`)
    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error('[FamilyNotify] Error:', error)
    return NextResponse.json({ sent: false, reason: 'Internal error' })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/auth/rateLimit'
import { isValidE164 } from '@/lib/speech/parseSpokenPhone'

export const runtime = 'nodejs'

/**
 * POST /api/auth/phone/send-otp
 *
 * Triggers a Supabase phone auth OTP via Twilio.
 * Requires Supabase Phone Auth to be enabled in the dashboard with a Twilio provider.
 *
 * Body: { phone: "+15551234567" }
 * Returns: { success: true } or { error: string }
 *
 * Rate limit: 3 per phone number per hour.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body as { phone?: string }

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required.' },
        { status: 400 }
      )
    }

    if (!isValidE164(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Expected E.164 (e.g. +15551234567).' },
        { status: 400 }
      )
    }

    // Rate limit: 3 OTP sends per phone number per hour
    // (in addition to Supabase's own throttling)
    const phoneKey = `phone-otp:${phone}`
    const rateCheck = checkRateLimit(phoneKey, false)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many code requests. Please wait a minute and try again.' },
        { status: 429 }
      )
    }

    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        // Don't auto-create a session yet — wait for verify-otp
        shouldCreateUser: true,
      },
    })

    if (error) {
      // Supabase error codes for phone auth:
      //   "phone_provider_disabled"  → phone auth not enabled in dashboard
      //   "over_sms_send_rate_limit" → too many sends
      if (error.message.includes('provider_disabled') || error.message.includes('not enabled')) {
        console.error('[PhoneAuth] Phone provider not configured in Supabase dashboard:', error)
        return NextResponse.json(
          { error: 'Phone sign-in is not configured yet. Contact support.' },
          { status: 503 }
        )
      }

      if (error.message.includes('rate') || error.message.includes('limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait before requesting another code.' },
          { status: 429 }
        )
      }

      console.error('[PhoneAuth] send-otp error:', error)
      return NextResponse.json(
        { error: 'Could not send verification code. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PhoneAuth] send-otp unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}

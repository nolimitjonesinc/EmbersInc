import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/auth/rateLimit'
import { isValidE164 } from '@/lib/speech/parseSpokenPhone'

export const runtime = 'nodejs'

/**
 * POST /api/auth/phone/verify-otp
 *
 * Verifies the SMS OTP code and establishes a Supabase session.
 * On success, Supabase sets the auth cookies automatically (via server client).
 *
 * Body: { phone: "+15551234567", token: "123456" }
 * Returns: { success: true, userId: string } or { error: string }
 *
 * After this succeeds, the user is authenticated and their session
 * cookie is set — the front end can call useAuth() and get a real user.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, token } = body as { phone?: string; token?: string }

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required.' },
        { status: 400 }
      )
    }

    if (!isValidE164(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format.' },
        { status: 400 }
      )
    }

    if (!token || typeof token !== 'string' || !/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: 'A 6-digit verification code is required.' },
        { status: 400 }
      )
    }

    // Rate limit: 10 verify attempts per phone per hour
    const phoneKey = `phone-verify:${phone}`
    const rateCheck = checkRateLimit(phoneKey, false)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait before trying again.' },
        { status: 429 }
      )
    }

    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })

    if (error) {
      if (error.message.includes('expired') || error.message.includes('Token has expired')) {
        return NextResponse.json(
          { error: 'That code has expired. Please request a new one.' },
          { status: 400 }
        )
      }

      if (error.message.includes('invalid') || error.message.includes('Token not found')) {
        return NextResponse.json(
          { error: 'That code did not match. Please check and try again.' },
          { status: 400 }
        )
      }

      console.error('[PhoneAuth] verify-otp error:', error)
      return NextResponse.json(
        { error: 'Verification failed. Please try again.' },
        { status: 500 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Verification succeeded but no user was returned. Please try again.' },
        { status: 500 }
      )
    }

    // Ensure the user has a profile row in embers_users
    // (new phone-auth users won't have one yet)
    await ensureUserProfile(supabase, data.user.id, phone)

    return NextResponse.json({
      success: true,
      userId: data.user.id,
    })
  } catch (err) {
    console.error('[PhoneAuth] verify-otp unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}

/**
 * Create a user profile row if this is the first time this phone number has enrolled.
 * Uses upsert so it's safe to call on re-auth too.
 */
async function ensureUserProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  phone: string
): Promise<void> {
  try {
    await supabase
      .from('embers_users')
      .upsert(
        {
          id: userId,
          phone,
          // Name and email can be filled in later — phone-auth users start with neither
          email: null,
          name: null,
          subscription_tier: 'free',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
          ignoreDuplicates: true, // Don't overwrite if profile already exists
        }
      )
  } catch (err) {
    // Non-fatal — profile creation failure shouldn't break auth
    console.error('[PhoneAuth] Could not ensure user profile:', err)
  }
}

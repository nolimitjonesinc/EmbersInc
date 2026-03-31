'use client';

import { useState, useCallback, useRef } from 'react';
import { spokenToPhone, isValidE164 } from '@/lib/speech/parseSpokenPhone';

/**
 * Voice Phone Enrollment Hook
 *
 * State machine for voice-guided phone authentication:
 *
 *   idle
 *     → asking-number     (Ember asks "what's your phone number?")
 *     → confirming-number (Ember reads back the number, asks to confirm)
 *     → sending-otp       (API call in flight)
 *     → awaiting-code     (Ember says "check your texts for the 6-digit code")
 *     → verifying         (API call in flight)
 *     → enrolled          (success — session established)
 *     → error             (something went wrong — can retry)
 *
 * The hook handles all state transitions and API calls.
 * The component just renders whatever state this hook exposes.
 */

export type EnrollmentStage =
  | 'idle'
  | 'asking-number'
  | 'confirming-number'
  | 'sending-otp'
  | 'awaiting-code'
  | 'verifying'
  | 'enrolled'
  | 'error';

export interface EnrollmentState {
  stage: EnrollmentStage;
  phoneE164: string | null;      // "+15551234567"
  phoneDisplay: string | null;   // "(555) 123-4567"
  errorMessage: string | null;
  otpSentAt: Date | null;
}

interface UsePhoneEnrollmentOptions {
  onEnrolled?: (phone: string) => void;
  onPlayVoice: (text: string) => Promise<void>;
}

// How long to wait before the OTP code expires (Supabase default: 60s, shown to user as 5 min)
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export function usePhoneEnrollment({ onEnrolled, onPlayVoice }: UsePhoneEnrollmentOptions) {
  const [state, setState] = useState<EnrollmentState>({
    stage: 'idle',
    phoneE164: null,
    phoneDisplay: null,
    errorMessage: null,
    otpSentAt: null,
  });

  const lastSpokenRef = useRef<string>('');

  // ─────────────────────────────────────────────────────
  // STATE TRANSITIONS
  // ─────────────────────────────────────────────────────

  const startEnrollment = useCallback(async () => {
    setState(s => ({ ...s, stage: 'asking-number', errorMessage: null }));
    await onPlayVoice(
      "To save your stories safely, I'll link this to your phone number. " +
      "Don't worry — it's just so your stories follow you if you ever get a new device. " +
      "What's your phone number? You can say it digit by digit."
    );
  }, [onPlayVoice]);

  /**
   * Called with whatever the user spoke (raw transcript).
   * Tries to parse a phone number from it.
   */
  const submitSpokenNumber = useCallback(async (transcript: string) => {
    if (state.stage !== 'asking-number') return;

    lastSpokenRef.current = transcript;
    const parsed = spokenToPhone(transcript);

    if (!parsed || !isValidE164(parsed.e164)) {
      await onPlayVoice(
        "I didn't quite catch that. Try saying each digit slowly, like: " +
        "five, five, five, one, two, three, four, five, six, seven."
      );
      return;
    }

    setState(s => ({
      ...s,
      stage: 'confirming-number',
      phoneE164: parsed.e164,
      phoneDisplay: parsed.display,
    }));

    await onPlayVoice(
      `I heard ${parsed.display}. Is that right? Say yes to confirm, or say your number again if I got it wrong.`
    );
  }, [state.stage, onPlayVoice]);

  /**
   * User confirmed the number — send OTP.
   */
  const confirmNumber = useCallback(async () => {
    if (state.stage !== 'confirming-number' || !state.phoneE164) return;

    setState(s => ({ ...s, stage: 'sending-otp', errorMessage: null }));

    try {
      const res = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: state.phoneE164 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to send code (${res.status})`);
      }

      setState(s => ({
        ...s,
        stage: 'awaiting-code',
        otpSentAt: new Date(),
        errorMessage: null,
      }));

      await onPlayVoice(
        "Perfect. I just sent a 6-digit code to your phone. Check your text messages and read me the code, or type it below."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send the code. Please try again.';
      setState(s => ({ ...s, stage: 'error', errorMessage: message }));
      await onPlayVoice("I'm sorry, I couldn't send the code right now. Let's try again in a moment.");
    }
  }, [state.stage, state.phoneE164, onPlayVoice]);

  /**
   * User wants to re-enter their number (said "no" at the confirmation step).
   */
  const retryNumber = useCallback(async () => {
    setState(s => ({
      ...s,
      stage: 'asking-number',
      phoneE164: null,
      phoneDisplay: null,
      errorMessage: null,
    }));
    await onPlayVoice("No problem. What's your phone number?");
  }, [onPlayVoice]);

  /**
   * Called with the OTP code the user read aloud or typed.
   * Accepts 6-digit strings with optional spaces/dashes.
   */
  const submitOtpCode = useCallback(async (rawCode: string) => {
    if (state.stage !== 'awaiting-code' || !state.phoneE164) return;

    // Strip everything except digits
    const code = rawCode.replace(/\D/g, '');

    if (code.length !== 6) {
      await onPlayVoice(
        "That code should be 6 digits. Try reading it again slowly, one number at a time."
      );
      return;
    }

    setState(s => ({ ...s, stage: 'verifying', errorMessage: null }));

    try {
      const res = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: state.phoneE164, token: code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Verification failed (${res.status})`);
      }

      setState(s => ({ ...s, stage: 'enrolled', errorMessage: null }));
      await onPlayVoice(
        "You're all set! Your stories are now safely linked to your phone. " +
        "They'll be here whenever you need them."
      );
      onEnrolled?.(state.phoneE164);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'The code did not match. Please try again.';
      // Wrong code → go back to awaiting-code so they can retry
      setState(s => ({
        ...s,
        stage: 'awaiting-code',
        errorMessage: message,
      }));
      await onPlayVoice(
        "Hmm, that code didn't match. Try reading it again, or I can send you a new one."
      );
    }
  }, [state.stage, state.phoneE164, onPlayVoice, onEnrolled]);

  /**
   * Resend OTP — only allowed after cooldown.
   */
  const resendOtp = useCallback(async () => {
    if (state.stage !== 'awaiting-code' || !state.phoneE164) return;

    const elapsed = state.otpSentAt ? Date.now() - state.otpSentAt.getTime() : Infinity;
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
      await onPlayVoice(`Please wait ${waitSec} more seconds before requesting a new code.`);
      return;
    }

    // Go back through send-otp flow
    setState(s => ({ ...s, stage: 'confirming-number' }));
    await confirmNumber();
  }, [state.stage, state.phoneE164, state.otpSentAt, onPlayVoice, confirmNumber]);

  /**
   * Dismiss error and restart from scratch.
   */
  const resetEnrollment = useCallback(() => {
    setState({
      stage: 'idle',
      phoneE164: null,
      phoneDisplay: null,
      errorMessage: null,
      otpSentAt: null,
    });
  }, []);

  /**
   * Skip enrollment — user can dismiss without enrolling.
   * Stories stay local-only.
   */
  const skipEnrollment = useCallback(async () => {
    setState(s => ({ ...s, stage: 'idle' }));
    await onPlayVoice(
      "That's okay. Your stories are still saved on this device. " +
      "You can always link your phone number later from your profile."
    );
  }, [onPlayVoice]);

  return {
    state,
    startEnrollment,
    submitSpokenNumber,
    confirmNumber,
    retryNumber,
    submitOtpCode,
    resendOtp,
    resetEnrollment,
    skipEnrollment,
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhoneEnrollment } from '@/lib/hooks/usePhoneEnrollment';
import { useTTSPlayback } from '@/lib/hooks/useTTSPlayback';
import { useVoiceCommands } from '@/lib/hooks/useVoiceCommands';
import { useDraftMigration } from '@/lib/hooks/useDraftMigration';

/**
 * VoiceEnrollmentFlow
 *
 * Ember guides the user through phone-number enrollment entirely by voice.
 * The user speaks their phone number, speaks the SMS code, and they're in.
 *
 * Design principles:
 * - Every state change is announced by Ember's voice
 * - Typed fallback is always available (large, accessible inputs)
 * - No jargon: no "E.164", no "OTP", no "authentication"
 * - Can be skipped — not every session requires enrollment
 *
 * Props:
 *   onEnrolled  — called with the E.164 phone when enrollment succeeds
 *   onSkip      — called when the user dismisses without enrolling
 *   autoStart   — if true, Ember starts speaking immediately on mount
 */

interface VoiceEnrollmentFlowProps {
  onEnrolled?: (phone: string) => void;
  onSkip?: () => void;
  autoStart?: boolean;
  /** Automatically migrate any localStorage draft to the cloud after enrollment (default: true) */
  migrateDraftOnEnroll?: boolean;
}

export function VoiceEnrollmentFlow({
  onEnrolled,
  onSkip,
  autoStart = false,
  migrateDraftOnEnroll = true,
}: VoiceEnrollmentFlowProps) {
  const { playText, isSpeaking, isLoadingTTS } = useTTSPlayback();
  const { migrateDraftToCloud, hasLocalDraft } = useDraftMigration();

  const handleEnrolled = useCallback(async (phone: string) => {
    // Migrate any pre-enrollment stories to the cloud silently
    if (migrateDraftOnEnroll && hasLocalDraft()) {
      const result = await migrateDraftToCloud();
      if (result.migrated) {
        await playText(
          `I also moved your ${result.messageCount > 1 ? 'conversation' : 'story'} from earlier to the cloud. Everything is safe now.`
        );
      }
    }
    onEnrolled?.(phone);
  }, [migrateDraftOnEnroll, hasLocalDraft, migrateDraftToCloud, playText, onEnrolled]);

  const enrollment = usePhoneEnrollment({
    onEnrolled: handleEnrolled,
    onPlayVoice: playText,
  });

  const { stage, phoneDisplay, errorMessage } = enrollment.state;

  // Typed fallback state
  const [typedPhone, setTypedPhone] = useState('');
  const [typedCode, setTypedCode] = useState('');

  // Voice recognition
  const { transcript, isListening, startListening, stopListening, resetTranscript } =
    useVoiceCommands({
      continuous: false,
      stopOnCommand: true,
      enabled: stage !== 'idle' && stage !== 'sending-otp' && stage !== 'verifying' && stage !== 'enrolled',
    });

  // Auto-start when the component mounts (if opted in)
  useEffect(() => {
    if (autoStart && stage === 'idle') {
      enrollment.startEnrollment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // React to voice input based on current stage
  useEffect(() => {
    if (!transcript || isSpeaking) return;

    const lower = transcript.toLowerCase().trim();

    if (stage === 'asking-number') {
      enrollment.submitSpokenNumber(transcript);
      resetTranscript();
      return;
    }

    if (stage === 'confirming-number') {
      const isYes = ['yes', 'yeah', 'yep', 'that\'s right', "that's right", 'correct', 'right'].some(w => lower.includes(w));
      const isNo = ['no', 'nope', 'wrong', 'incorrect', 'try again'].some(w => lower.includes(w));

      if (isYes) {
        enrollment.confirmNumber();
      } else if (isNo) {
        enrollment.retryNumber();
      } else {
        // They may have re-spoken their number
        enrollment.submitSpokenNumber(transcript);
      }
      resetTranscript();
      return;
    }

    if (stage === 'awaiting-code') {
      const isResend = lower.includes('new code') || lower.includes('send again') || lower.includes('resend');
      if (isResend) {
        enrollment.resendOtp();
        resetTranscript();
        return;
      }
      // Try to extract a 6-digit code from the transcript
      enrollment.submitOtpCode(transcript);
      resetTranscript();
      return;
    }
  }, [transcript, stage, isSpeaking, enrollment, resetTranscript]);

  const handleTypedPhoneSubmit = useCallback(async () => {
    if (stage === 'asking-number' || stage === 'confirming-number') {
      await enrollment.submitSpokenNumber(typedPhone);
      setTypedPhone('');
    }
  }, [stage, typedPhone, enrollment]);

  const handleTypedCodeSubmit = useCallback(async () => {
    if (stage === 'awaiting-code') {
      await enrollment.submitOtpCode(typedCode);
      setTypedCode('');
    }
  }, [stage, typedCode, enrollment]);

  const handleSkip = useCallback(async () => {
    await enrollment.skipEnrollment();
    onSkip?.();
  }, [enrollment, onSkip]);

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      <AnimatePresence mode="wait">
        {/* IDLE — not started yet */}
        {stage === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-center space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-amber-800">
                Keep your stories safe
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Link your phone number so your stories are protected — even if you get a new device.
                No passwords, no emails. Just your phone number.
              </p>
            </div>

            <button
              onClick={() => enrollment.startEnrollment()}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg font-medium rounded-2xl shadow-lg shadow-amber-200 hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              Link my phone number
            </button>

            <button
              onClick={handleSkip}
              className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              Skip for now — keep stories on this device only
            </button>
          </motion.div>
        )}

        {/* ASKING FOR NUMBER */}
        {stage === 'asking-number' && (
          <motion.div
            key="asking-number"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <EmberSpeaking isSpeaking={isSpeaking} isLoading={isLoadingTTS} />

            <p className="text-gray-600 text-center">
              Say your phone number out loud, or type it below.
            </p>

            <div className="flex gap-2">
              <input
                type="tel"
                value={typedPhone}
                onChange={e => setTypedPhone(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleTypedPhoneSubmit(); }}
                placeholder="(555) 123-4567"
                className="flex-1 px-4 py-3 text-lg rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              />
              <button
                onClick={handleTypedPhoneSubmit}
                disabled={!typedPhone}
                className="px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-40 transition-all"
              >
                →
              </button>
            </div>

            <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} />
            <SkipLink onSkip={handleSkip} />
          </motion.div>
        )}

        {/* CONFIRMING NUMBER */}
        {stage === 'confirming-number' && (
          <motion.div
            key="confirming-number"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <EmberSpeaking isSpeaking={isSpeaking} isLoading={isLoadingTTS} />

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <p className="text-gray-500 text-sm mb-1">Your number</p>
              <p className="text-3xl font-semibold text-amber-800 tracking-wide">
                {phoneDisplay}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={enrollment.confirmNumber}
                className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg font-medium rounded-2xl shadow-lg shadow-amber-200 hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                Yes, that&apos;s right
              </button>
              <button
                onClick={enrollment.retryNumber}
                className="flex-1 py-4 bg-white border border-amber-200 text-amber-700 text-lg font-medium rounded-2xl hover:bg-amber-50 transition-all"
              >
                Try again
              </button>
            </div>

            <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} />
            <SkipLink onSkip={handleSkip} />
          </motion.div>
        )}

        {/* SENDING OTP */}
        {stage === 'sending-otp' && (
          <motion.div
            key="sending-otp"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-center space-y-4 py-8"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-3xl animate-pulse">📱</span>
            </div>
            <p className="text-gray-600">Sending your code&hellip;</p>
          </motion.div>
        )}

        {/* AWAITING CODE */}
        {stage === 'awaiting-code' && (
          <motion.div
            key="awaiting-code"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <EmberSpeaking isSpeaking={isSpeaking} isLoading={isLoadingTTS} />

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-gray-500 text-sm">Code sent to</p>
              <p className="text-xl font-semibold text-amber-800">{phoneDisplay}</p>
              <p className="text-gray-500 text-xs">Check your text messages</p>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm text-center">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={7} // 6 digits + possible space
                value={typedCode}
                onChange={e => setTypedCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') handleTypedCodeSubmit(); }}
                placeholder="6-digit code"
                className="flex-1 px-4 py-4 text-2xl text-center tracking-widest rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              />
              <button
                onClick={handleTypedCodeSubmit}
                disabled={typedCode.length !== 6}
                className="px-4 py-4 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-40 transition-all"
              >
                →
              </button>
            </div>

            <p className="text-center text-gray-500 text-sm">
              Or say the 6-digit code out loud
            </p>
            <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} />

            <button
              onClick={enrollment.resendOtp}
              className="w-full text-amber-600 hover:text-amber-700 text-sm transition-colors"
            >
              Send a new code
            </button>
          </motion.div>
        )}

        {/* VERIFYING */}
        {stage === 'verifying' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-center space-y-4 py-8"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-3xl animate-pulse">🔐</span>
            </div>
            <p className="text-gray-600">Verifying your code&hellip;</p>
          </motion.div>
        )}

        {/* ENROLLED */}
        {stage === 'enrolled' && (
          <motion.div
            key="enrolled"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center"
            >
              <span className="text-4xl">✅</span>
            </motion.div>
            <EmberSpeaking isSpeaking={isSpeaking} isLoading={isLoadingTTS} />
            <h2 className="text-2xl font-semibold text-gray-800">You&apos;re all set!</h2>
            <p className="text-gray-600">
              Your stories are now safely linked to your phone.
            </p>
          </motion.div>
        )}

        {/* ERROR */}
        {stage === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-center space-y-5 py-4"
          >
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-red-700">{errorMessage || 'Something went wrong.'}</p>
            </div>
            <button
              onClick={enrollment.resetEnrollment}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg font-medium rounded-2xl shadow-lg shadow-amber-200"
            >
              Try again
            </button>
            <SkipLink onSkip={handleSkip} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────

function EmberSpeaking({ isSpeaking, isLoading }: { isSpeaking: boolean; isLoading: boolean }) {
  if (!isSpeaking && !isLoading) return null;
  return (
    <div className="flex items-center justify-center gap-2 text-amber-700 text-sm">
      <span className="animate-pulse">🔥</span>
      <span>{isLoading ? 'Embers is thinking...' : 'Embers is speaking...'}</span>
    </div>
  );
}

function VoiceButton({
  isListening,
  onStart,
  onStop,
}: {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <button
      onClick={isListening ? onStop : onStart}
      className={`w-full py-4 rounded-2xl border-2 text-lg font-medium transition-all ${
        isListening
          ? 'bg-red-50 border-red-300 text-red-700 animate-pulse'
          : 'bg-white border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50'
      }`}
    >
      {isListening ? '🎙️ Listening... tap to stop' : '🎙️ Tap to speak'}
    </button>
  );
}

function SkipLink({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      onClick={onSkip}
      className="w-full text-gray-400 hover:text-gray-600 text-sm transition-colors py-2"
    >
      Skip — save stories locally only
    </button>
  );
}

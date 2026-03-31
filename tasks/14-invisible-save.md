# Invisible Save — Voice Enrollment

> Source: `created by Claude session — Phase 2`
> Progress: 7/7 tasks done

## Overview

Voice-guided identity enrollment. The user speaks their phone number, gets an SMS
code, and that links their device to a cloud account. No passwords, no emails, no
usernames. The phone number IS their identity.

Uses Supabase phone auth (Twilio SMS OTP).

---

## Phase 1: Voice-Guided Auto-Save (DONE)
- [x] `useVoiceGuidedAutoSave` hook — silence detection + voice prompts
- [x] `dualStorage.ts` — localStorage instant + Supabase queued
- [x] `/api/drafts` — cloud draft persistence
- [x] Integration into conversation page

---

## Phase 2: Voice Enrollment (THIS SPRINT)

- [x] Phone number speech parser — spoken digits → E.164 format (`parseSpokenPhone.ts`)
- [x] `usePhoneEnrollment` hook — state machine: idle → asking → confirmed → sending → awaiting-code → verifying → enrolled
- [x] API route `POST /api/auth/phone/send-otp` — triggers Supabase phone OTP via Twilio
- [x] API route `POST /api/auth/phone/verify-otp` — verifies code, establishes session
- [x] `VoiceEnrollmentFlow` component — full voice-guided UI with Ember's voice
- [x] Update `AuthContext` + types for phone-auth users (phone field, no email required)
- [x] Draft migration after enrollment — moves localStorage draft to cloud after phone auth

---

## Phase 3: Not started (future)

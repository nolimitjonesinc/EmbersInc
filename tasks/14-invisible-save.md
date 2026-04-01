# Invisible Save & Backup System

> Source: `PRD-INVISIBLE-SAVE.md`
> Progress: 12/24 tasks done
> Sprint: Active
> Depends on: Existing auth, Supabase, local autosave infrastructure

## Why This Matters

The current save model expects elderly users to understand browser storage and create accounts before their data is safe. For this audience, "easy" means automatic — not "explained better." This sprint makes saving and backup completely invisible to the user.

## Tasks

### Phase 1: Enhanced Local Autosave (Crash Cushion) — DONE

- [x] Upgrade autosave to save every 5 seconds during active conversation (currently only saves at specific events)
- [x] Add save triggers on browser blur, visibility change, and beforeunload
- [x] Implement 3-conversation local storage rotation (evict oldest non-backed-up)
- [x] Add draft recovery prompt: "Welcome back — continue where you left off?"
- [x] Remove misleading "saved" language for local-only state — use "protected on this device"

### Phase 2: Voice-Based Enrollment (Solo Mode B) — DONE

- [x] Phone number speech parser — spoken digits to E.164 format (`parseSpokenPhone.ts`)
- [x] `usePhoneEnrollment` hook — state machine: idle → asking → confirmed → sending → awaiting-code → verifying → enrolled
- [x] API route `POST /api/auth/phone/send-otp` — triggers Supabase phone OTP via Twilio
- [x] API route `POST /api/auth/phone/verify-otp` — verifies code, establishes session
- [x] `VoiceEnrollmentFlow` component — full voice-guided UI with Ember's voice
- [x] Update `AuthContext` + types for phone-auth users (phone field, no email required)
- [x] Draft migration after enrollment — moves localStorage draft to cloud after phone auth

### Phase 3: Family-Started Accounts (Mode A) — UP NEXT

- [ ] Create Supabase tables: `family_circles` and `family_circle_members`
- [ ] Build family member signup flow — "Set Up Embers for Someone You Love" landing variant
- [ ] Build family circle creation — enter elder's name, generate invite link
- [ ] Create invite link system — signed JWT with pre-created user ID, 7-day expiry, regeneratable
- [ ] Build elder onboarding from invite link — pre-authenticated, personalized greeting, straight to conversation
- [ ] Build family dashboard at /family — elder list, activity, story count, backup status, send new link
- [ ] Add "Suggest a Prompt" feature — family member sends conversation starter to elder

### Phase 4: Cloud Sync & Save Language

- [ ] Wire enrollment completion to trigger local-to-cloud migration (adapt existing `migrateLocalStories.ts`)
- [ ] Add ongoing dual-write after enrollment — every local save also writes to Supabase (debounced 10s)
- [ ] Create save language utility — returns correct string based on auth state + sync state
- [ ] Add subtle backup status indicator — green glow (backed up), amber pulse (syncing), hidden (local only)
- [ ] Implement offline queue — store writes when offline, sync on reconnect

### Phase 5: Session Recovery

- [ ] Build voice-guided re-auth: "It looks like we need to reconnect. Can you tell me your phone number?"
- [ ] Add family-triggered re-auth — family member sends new magic link from dashboard

## Order of Operations

1. ~~**Phase 1 first**~~ DONE
2. ~~**Phase 2 next**~~ DONE
3. **Phase 3 after** — family flow is the better path but more infrastructure
4. **Phase 4 alongside 3** — sync and language should evolve as enrollment flows land
5. **Phase 5 last** — recovery is important but only matters after enrollment exists

## Dependencies

- Supabase phone auth must be enabled (requires Twilio or similar SMS provider in Supabase config)
- Family dashboard requires new Supabase tables + RLS policies
- SMS costs: ~$0.01/message — budget consideration for OTP codes
- Existing `dualStorage.ts` and `migrateLocalStories.ts` are reusable foundations

## Files Created (Phase 1)
- `src/lib/conversation/draftStorage.ts` — 3-conversation rotation, honest language contract

## Files Created (Phase 2)
- `src/lib/speech/parseSpokenPhone.ts` — spoken phone number to E.164 parser
- `src/lib/hooks/usePhoneEnrollment.ts` — enrollment state machine hook
- `src/lib/hooks/useDraftMigration.ts` — local-to-cloud migration after enrollment
- `src/app/api/auth/phone/send-otp/route.ts` — Supabase phone OTP trigger
- `src/app/api/auth/phone/verify-otp/route.ts` — OTP verification + session
- `src/components/enrollment/VoiceEnrollmentFlow.tsx` — full voice-guided enrollment UI

## Files Modified
- `src/lib/hooks/useVoiceGuidedAutoSave.ts` — enhanced save frequency + triggers (Phase 1)
- `src/app/conversation/page.tsx` — enrollment trigger integration (Phase 1)
- `src/lib/auth/context.tsx` — phone auth support (Phase 2)
- `src/lib/supabase/types.ts` — phone field on user type (Phase 2)

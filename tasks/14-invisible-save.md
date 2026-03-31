# Invisible Save & Backup System

> Source: `PRD-INVISIBLE-SAVE.md`
> Progress: 5/24 tasks done
> Sprint: Next
> Depends on: Existing auth, Supabase, local autosave infrastructure

## Why This Matters

The current save model expects elderly users to understand browser storage and create accounts before their data is safe. For this audience, "easy" means automatic — not "explained better." This sprint makes saving and backup completely invisible to the user.

## Tasks

### Phase 1: Enhanced Local Autosave (Crash Cushion)

- [x] Upgrade autosave to save every 5 seconds during active conversation (currently only saves at specific events)
- [x] Add save triggers on browser blur, visibility change, and beforeunload
- [x] Implement 3-conversation local storage rotation (evict oldest non-backed-up)
- [x] Add draft recovery prompt: "Welcome back — continue where you left off?"
- [x] Remove misleading "saved" language for local-only state — use "protected on this device"

### Phase 2: Voice-Based Enrollment (Solo Mode B)

- [ ] Enable Supabase phone auth (OTP via SMS) — configure in Supabase dashboard
- [ ] Create voice enrollment prompt logic — trigger after 30-60 seconds of meaningful conversation
- [ ] Build phone number capture via voice: speech-to-text → parse phone number → confirm back via TTS
- [ ] Build SMS code entry screen — large font, 6-digit, 10-minute expiry, accessible
- [ ] Create email fallback enrollment — typed input for users without phone
- [ ] Add enrollment confirmation TTS: "You're backed up now. Everything you share is safe."
- [ ] Implement max-2-prompts-per-session rule (first at natural pause, second at session end)

### Phase 3: Family-Started Accounts (Mode A)

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

1. **Phase 1 first** — this is pure safety, no new features, protects users right now
2. **Phase 2 next** — solo enrollment is the biggest UX gap
3. **Phase 3 after** — family flow is the better path but more infrastructure
4. **Phase 4 alongside 2+3** — sync and language should evolve as enrollment flows land
5. **Phase 5 last** — recovery is important but only matters after enrollment exists

## Dependencies

- Supabase phone auth must be enabled (requires Twilio or similar SMS provider in Supabase config)
- Family dashboard requires new Supabase tables + RLS policies
- SMS costs: ~$0.01/message — budget consideration for OTP codes
- Existing `dualStorage.ts` and `migrateLocalStories.ts` are reusable foundations

## Files Likely Created
- `src/lib/enrollment/voiceEnrollment.ts`
- `src/lib/enrollment/phoneAuth.ts`
- `src/lib/enrollment/inviteLink.ts`
- `src/lib/enrollment/saveLang.ts`
- `src/components/enrollment/PhoneCapture.tsx`
- `src/components/enrollment/SMSCodeEntry.tsx`
- `src/components/enrollment/EnrollmentPrompt.tsx`
- `src/app/family/page.tsx`
- `src/app/family/dashboard/page.tsx`
- `src/app/invite/[token]/page.tsx`

## Files Likely Modified
- `src/lib/hooks/useVoiceGuidedAutoSave.ts` — enhanced save frequency + triggers ✓ DONE
- `src/lib/storage/dualStorage.ts` — post-enrollment dual-write
- `src/lib/subscription/migrateLocalStories.ts` — adapt for new enrollment flow
- `src/components/conversation/SessionEnding.tsx` — new save language
- `src/app/conversation/page.tsx` — enrollment trigger integration ✓ DONE

## Files Created (Phase 1)
- `src/lib/conversation/draftStorage.ts` — 3-conversation rotation, honest language contract ✓ DONE

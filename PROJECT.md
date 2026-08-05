# Embers Web

**Last updated:** August 4, 2026
**Status:** In progress ‹CHECK: task files show most core sprints (sections 02–11) complete, but section 13 "pre-launch security fixes" and section 14 "invisible save" are both mid-flight — is this actually launched to real users, or still pre-launch?›
**Lives at:** Target domain embersinc.org ‹CHECK: not confirmed live/deployed from anything in this folder — no deploy config or live-URL evidence found›

> **Truth rule:** every line below must be verifiable in this project's own files.
> Anything inferred, assumed, or remembered gets marked **‹CHECK›** so Danny can
> confirm or kill it. A doc that guesses silently is worse than no doc.

---

## 1. What it is

Embers is an AI voice-conversation app that helps people — especially elderly parents/grandparents — record their life stories by talking to a warm AI companion ("Ember"). The AI asks reminiscence-style questions, the user answers by voice or text, and answers get saved as stories organized into a 7-chapter "Life Book." Family members can invite the storyteller, suggest questions, and read/listen to what gets recorded.

## 2. Who it's for and what problem it solves

- **User:** The storyteller (an older adult) doing the talking, plus family members who invited them and want to read/listen to the stories. The PRD names Danny's own dad — 85, nearly blind — as the first real target user. ‹CHECK: is this still literally being built for Danny's dad, or has the audience broadened?›
- **Problem:** Getting an older relative to actually sit down and record their life story is hard — typing is a barrier, blank-page prompts don't work, and nothing captures the actual voice/personality, not just facts.
- **The bet:** Voice-first conversation with an AI interviewer (not a blank form) removes the friction; family involvement (invites, suggested prompts) creates the reason to keep going.

## 3. Goals

Pulled from `PRD-EMBERS-MVP.md` and `EMBERS_WEB_GOALS.md` (both dated Dec 2025–Feb 2026 — ‹CHECK: are these still the current goals or superseded by what's since been built?›):

1. Storyteller can open the app and start talking with minimal friction (voice-first, large touch targets, no password).
2. Every conversation — voice, transcript, and full message history — is saved and recoverable, not just a summary.
3. Stories are organized into the 7-chapter Life Book structure automatically.
4. Family members can be invited, without needing to install anything, and can suggest prompts / get notified of new stories.
5. There's a monetization path (free tier with limits → premium subscription via Stripe).

## 4. The mental model

One loop, repeated every session:

1. User opens `/conversation` (or is walked there from onboarding/`/ask/[familyId]` for a family-suggested prompt).
2. `useConversation` picks a starter prompt (personalized by past interests/context if returning) and the AI ("Ember") asks it — sent to `/api/chat` (OpenAI).
3. User replies by voice (`useSpeechRecognition` / `useContinuousRecorder`, Web Speech API in-browser) or by typing. Silence for a few seconds auto-triggers "send" (`SilenceProgressBar`).
4. AI reply comes back as text and is spoken aloud via `/api/tts` (OpenAI TTS) or AWS Polly.
5. Every turn is written to **both** `localStorage` (instant, works logged-out) and Supabase (`embers_drafts`/`embers_stories`) in the background — see `dualStorage.ts`. Nothing waits on the network to feel saved.
6. When the conversation naturally winds down, the exchange is classified into one of 7 Life Book chapters (`chapters.ts`) and optionally polished into narrative prose ("Ghostwriter," `/api/ghostwriter/polish`) before being shown in `/life-book` and `/stories`.
7. Family members reach a **separate, unauthenticated** flow at `/ask/[familyId]` to submit a prompt suggestion or read shared stories — no account needed on their end.

If a new session reads only one thing in this doc, it's this loop — nearly everything else in `src/` supports one of these seven steps.

## 5. Feature list — what exists today

Based on actual routes/files under `src/app` and `src/lib` (only things with a real page or route are listed; see section 8 for stubs):

### Conversation & voice
- Voice or typed conversation with the AI (`/conversation`), OpenAI-driven
- Speech-to-text via Web Speech API (`useSpeechRecognition`, `useContinuousRecorder`), with `/api/transcribe` (Whisper) as a route
- Text-to-speech playback (`useTTSPlayback`, `/api/tts`, plus AWS Polly dependency)
- Silence-based auto-save (`SilenceProgressBar`, `useVoiceGuidedAutoSave`)
- Voice command handling (`useVoiceCommands`)
- Ambient campfire visuals during conversation (`CampfireVisual`, `AmbientFire`, `EmberParticles`, `BreathingEmber`, `FlameButton`)
- Inactivity nudge (`InactivityPrompt`) and session-ending flow (`SessionEnding`)

### Stories & Life Book
- 7 fixed chapters (Who I Am / Where I Come From / What I've Loved / What's Been Hard / What I've Learned / What I'm Still Figuring Out / What I Want You to Know), each with its own prompt bank (`chapters.ts`)
- Story library (`/stories`) and per-story edit page (`/stories/[id]/edit`)
- Life Book view (`/life-book`)
- Timeline by decade (`/timeline`, `/era/[decade]`, `data/era-content/decades.ts`)
- "Ghostwriter" AI polish of raw transcript into narrative prose (`/api/ghostwriter/polish`, `narrativeGenerator.ts`)
- Draft recovery — in-progress conversations are saved and can resume (`draftStorage.ts`, `useDraftMigration.ts`, `/api/drafts`)
- Photo Detective — upload an old photo, AI extracts date/location (`/photo-detective`, `/api/photos/analyze`)

### Onboarding & accounts
- Interest-based onboarding (`/onboarding`, `CategorySection`, `InterestCard`, `data/interests.ts`) used to personalize starter prompts
- Email/magic-link login (`/login`, `(auth)/auth/callback`)
- Phone + OTP login routes exist (`/api/auth/phone/send-otp`, `/verify-otp`) — ‹CHECK: is phone login wired into a UI page, or API-only so far? Task file `03-voice-first-ux.md` lists "implement phone + SMS auth" as still unchecked, which conflicts with these routes already existing.›
- Profile page (`/profile`)

### Family features
- Family group dashboard (`/family`, `/api/family/dashboard`)
- Invite links, including regeneration (`/api/family/invite-link`, `/api/family/regenerate-invite`, `inviteCode.ts`)
- Public, no-login prompt-submission page for family (`/ask/[familyId]`)
- Family-suggested prompts stored and surfaced to the storyteller (`useFamilyPrompts`, `/api/family/prompts`)
- Family notification emails via Resend (`/api/family/notify`)

### Monetization & personalization
- Subscription tiers: anonymous (1 story, local-only) → free (3 stories, cloud) → premium (unlimited) — `tiers.ts`
- Stripe checkout, billing portal, and webhook (`/api/stripe/*`)
- Pricing page (`/pricing`), auth gate and upgrade prompt components (`AuthGate`, `UpgradePrompt`)
- Style/emotion detection from what the user says (`styleAnalyzer.ts`, `emotionalStateDetector.ts`, `userStyleService.ts`) feeding into `communication_style` on the user record
- Persistent conversation memory across sessions (`ConversationMemory.ts`, `memoryExtractor.ts`) — remembers people/themes mentioned before, drives "returning user" context

## 6. How it works underneath

- **Stack:** Next.js 16 (App Router) + React 19, TypeScript, Tailwind CSS 4, Radix UI, Framer Motion. Deployed target: Vercel.
- **Where data lives:**
  - Supabase Postgres tables (see `src/lib/supabase/types.ts`): `users`, `embers_stories`, `embers_drafts`, `family_groups`, `embers_family_members`, `embers_family_prompts`, `photos`.
  - Supabase Storage for uploaded photos and audio.
  - Browser `localStorage` for instant, logged-out-safe saves (interests, user name, drafts) — see "dual storage" below.
- **The key mechanism — dual storage:** every save writes to `localStorage` first (so nothing is lost even offline/anonymous), then syncs to Supabase in the background (`dualStorage.ts`, `SyncStatus`: synced/pending/offline/error). This is what lets an anonymous visitor start a story with zero signup before hitting the auth gate.
- **External services / API keys (names only, from `.env.local` — never values):** `OPENAI_API_KEY` (chat + Whisper transcription + TTS), `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`, `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` (Polly TTS), `RESEND_API_KEY` (family notification emails), `INTERNAL_API_SECRET`, `NEXT_PUBLIC_APP_URL`. Stripe keys are referenced in code (`src/lib/stripe/client.ts`) but not confirmed present in `.env.local` — ‹CHECK: is Stripe fully configured, or code-only pending keys?›
- **Auth/route protection:** `src/proxy.ts` (Next middleware) gates protected routes through Supabase session check, redirecting to `/login` if unauthenticated or if Supabase env vars are missing.
- **File map (high-value pointers):**
  - `src/app/conversation/` — the core voice-conversation screen
  - `src/lib/hooks/useConversation.ts` — conversation state machine (messages, name detection, personalized starter prompt)
  - `src/lib/storage/dualStorage.ts` — the local+cloud save mechanism described above
  - `src/lib/subscription/tiers.ts` — the monetization tier/feature-flag definitions
  - `src/lib/utils/chapters.ts` — the 7 Life Book chapters and their prompt banks
  - `src/app/ask/[familyId]/` — the public family-prompt-submission flow
  - `src/app/api/` — all server routes (chat, tts, transcribe, stories, stripe, family/*, ghostwriter, photos)

## 7. Rules of the house

Pulled from what the task files (`tasks/02` through `tasks/11`, all marked fully complete) show was deliberately built this way — treat these as settled decisions, not open questions:

1. **Dual storage is mandatory, not optional.** Every save path writes to `localStorage` immediately, then syncs to Supabase in the background. Do not add a save path that only writes to one.
2. **Anonymous users get exactly one free story, local-only.** The tier ladder (anonymous → free → premium) in `tiers.ts` is the monetization model — don't bypass the auth gate to give anonymous users cloud backup or extra stories.
3. **Family members never need an account.** The `/ask/[familyId]` flow is intentionally unauthenticated — this is the viral/no-friction loop; don't gate it behind login.
4. **Raw transcript is preserved separately from AI-polished prose.** The PRD is explicit that the exact spoken words are "gold" and more valuable than a cleaned-up version — `narrative_prose` and raw `content` are stored as separate fields, never overwriting one another.
5. **Silent failures are treated as bugs, not acceptable degradation** — an entire task sprint (`tasks/11-silent-failure-fixes.md`, `tasks/13-security-fixes.md`) exists specifically to find and kill places where something fails without telling the user. New code should surface errors, not swallow them.

## 8. Known gaps / not built yet

Straight from the task files' unchecked items — do not treat these as bugs, they're just not done:

- **Section 01 (core features):** end-to-end testing pass across all sprints hasn't been done/checked off.
- **Section 03 (voice-first UX):** phone+SMS auth listed as not-yet-implemented in the task file — though `/api/auth/phone/send-otp` and `/verify-otp` routes already exist in code, so this line item may just be stale ‹CHECK›. Also unchecked: voice-activating the Life Book, Stories, Profile, and Timeline pages (conversation page's voice activation is listed as "remaining work" too).
- **Section 12 (post-launch improvements, 0/13 done):** richer family notification emails (listen-now button, story preview snippet), a full family dashboard for viewing all stories/prompts/audio, photo-prompt and voice-recorded prompts from family, an AI "help me ask a better question" prompt helper, smart mid-conversation prompt matching, follow-up question chains, Life Book epigraphs crediting who asked the prompt, premium-gating audio playback, conversion-metric tracking, and switching the notification email domain from `@loomiverse.ai` to `@embersinc.org`.
- **Section 13 (pre-launch security/quality fixes, 9/19 done):** still open — `/api/family/notify` isn't yet locked down against external calls, guest-submission error states, RLS verification on all user-data tables, admin-client failure handling, race conditions on skip/decline/mark-answered, Life Book fetch-error messaging, file-size/length limits on audio uploads and Ghostwriter input, and a clean `npm run build`.
- **Section 14 (invisible save & family circles, 12/26 done):** the bigger unbuilt piece — dedicated `family_circles`/`family_circle_members` tables, a "set up Embers for someone you love" family-driven signup flow, invite-link-based elder onboarding (pre-authenticated), a real family dashboard at `/family` with backup status, ongoing dual-write after enrollment, an offline write queue, and voice-guided re-authentication.
- **Duplicate file:** `src/app/page 2.tsx` sits alongside `src/app/page.tsx` (372 lines each) — `PROJECTS.md` already flags this as leftover cruft to clean up. ‹CHECK: safe to delete, or is one of these mid-edit and intentionally kept?›

## 9. Deeper history

No build-log file exists yet for this project at `../build-logs/logs/embers-web.md` — this doc is being written from the code and task files directly, not from a prior build log. ‹CHECK: is there build history living elsewhere under a different project slug?›
Reusable parts extracted from here: `../CAPABILITIES.md`

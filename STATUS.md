# EmbersInc — Status
_Auto-updated by Status Brain on every push. Last change: Add Status Brain workflow and script for automated status tracking._

**Status:** In progress  
**What it is:** A voice-first web app that guides elders through recording life stories in conversation with an AI interviewer, saving them into publishable "Embers" with family sharing.  
**Stack:** Next.js 16, React 19, TypeScript, Supabase (auth + database), OpenAI (chat + TTS), AWS Polly (voice), Stripe (payments), Tailwind CSS.

## What works right now
- **Onboarding flow** — voice-based phone OTP enrollment, name confirmation, interest selection
- **Conversation engine** — AI interviewer with emotional state detection, context memory, and multi-persona support
- **Voice I/O** — speech recognition input, text-to-speech playback with mobile fallback on iPhone
- **Auto-save system** — invisible draft saving on rotation/inactivity, no data loss on crash
- **Story persistence** — local + cloud dual storage, migration from local to authenticated accounts
- **Family features** — invite-link sharing, parent-child prompted Q&A ("Between You & Me" category), family dashboard
- **Story editing** — drafted stories, chapter classification, ghostwriter polish suggestions
- **Photo detective** — image analysis for memory prompts
- **Era timeline** — decade-based narrative scaffolding (1940s–2020s)
- **Subscription tiers** — Stripe integration, upgrade gates, checkout flow
- **Authentication** — Supabase SSR with phone OTP + email fallback
- **Rate limiting** — chat input validation, abuse prevention
- **Error boundaries** — React error catching, honest user-facing messages

## Recent changes (newest first)
- 2026-07-20 — Add Status Brain workflow and script for automated status tracking
- 2026-05-28 — Add "Between You & Me" prompt category for child-to-parent questions
- 2026-04-04 — Fix mobile onboarding UI lock-up on TTS playback
- 2026-04-01 — Add iPhone web-app voice fallback for onboarding
- 2026-04-01 — Fix onboarding full-name confirmation and build blockers in family/draft flows
- 2026-03-31 — Merge Phase 2 (voice-based phone OTP enrollment, speech parser) and Phase 1 (invisible save crash cushion)
- 2026-03-12 — Add Family Prompts feature + pre-launch security hardening
- 2026-02-18 — Fix silent failures: dead sync queue, draft save bugs, TTS error handling

## Reusable parts (for other projects)
- **Invisible Save** — auto-saving drafts on app rotation/inactivity without user prompts — `src/lib/conversation/draftStorage.ts`, `src/lib/hooks/useVoiceGuidedAutoSave.ts`
- **Dual Storage** — local + cloud persistence abstraction — `src/lib/storage/dualStorage.ts`
- **Phone OTP Auth** — speech-parsed phone enrollment flow — `src/lib/speech/parseSpokenPhone.ts`, `src/app/api/auth/phone/*`
- **Emotional State Detector** — conversation sentiment analysis — `src/lib/services/emotionalStateDetector.ts`
- **TTS with Mobile Fallback** — AWS Polly + Web Audio API with iPhone web-app graceful degradation — `src/lib/hooks/useTTSPlayback.ts`
- **Conversation Memory** — sliding-window context extraction for long chats — `src/lib/memory/ConversationMemory.ts`

## Not done / next
- **Push notifications** — family invite/prompt notifications only partially wired (API exists, UI integration pending)
- **Accessibility audit** — WCAG 2.1 AA compliance not fully validated (task 08 in backlog)
- **Offline mode** — no service worker; app requires live connection
- **Analytics** — no event tracking or usage metrics
- **Admin dashboard** — no way for solo founder to view user health, churn, revenue
- **Mobile app** — web-only; no native iOS/Android wrapper yet
- **Conversation replay** — no way to listen back to audio recordings of user voice
- **Story versioning** — only current draft stored; no revision history
- **Advanced privacy** — no data export/deletion workflows for GDPR/CCPA
- **Load testing** — no stress tests or capacity benchmarks run
- **Playwright tests** — test harnesses exist but logs suggest intermittent test failures (see `.playwright-cli/`)

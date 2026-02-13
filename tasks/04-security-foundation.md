# Security Foundation

> Source: `created by Claude Code full audit + Loomiverse reference analysis`
> Progress: 9/10 tasks done (1 deferred to Sprint 2)
> Sprint: 1 (BLOCKING — nothing else should ship until this is done)
> Inspired by: Loomiverse `api/_usage.js`, `src/lib/supabase.js`

## Why This Matters

Every API route (chat, tts, transcribe, photos/analyze, audio/upload) has **zero authentication**. Anyone with the URL can burn through OpenAI/AWS credits. This is the single biggest risk in the entire app.

## Tasks

### API Authentication
- [x] Create `src/lib/auth/getAuthContext.ts` — server-side auth context helper (inspired by Loomiverse `getUserFromRequest`)
  - Created softAuth() for chat/tts/transcribe (allows anonymous with rate limiting)
  - Created requireAuth() for expensive endpoints like photo analysis
  - Edge-runtime compatible using @supabase/ssr cookies
  - Returns { user, isAuthenticated, rateLimitKey }

- [x] Add auth to `src/app/api/chat/route.ts` — softAuth + input validation
  - Rate-limits anonymous users (5 req/min) and authenticated users (20 req/min)
  - Validates message roles, lengths, and array size
  - Uses `validation.sanitizedMessages` (not raw body) for conversation history

- [x] Add auth to `src/app/api/tts/route.ts` — softAuth + rate limiting
  - Removed `X-TTS-Provider` response header (was leaking architecture info)

- [x] Add auth to `src/app/api/transcribe/route.ts` — softAuth + file validation
  - Rejects files over 25MB (Whisper API limit)
  - Warns on unexpected MIME types

- [x] Add auth to `src/app/api/photos/analyze/route.ts` — requireAuth (strict)
  - Fixed: now uses shared `getOpenAIClient()` instead of creating separate client
  - Added 10MB base64 size limit
  - Returns explicit error on empty OpenAI response (was silently returning empty)

- [x] Fix `src/app/api/audio/upload/route.ts` signed URL expiry
  - Reduced from 1 year to 7 days
  - (Already had auth via getSupabaseServerClient)

- [x] Add rate limiting to `src/app/api/ghostwriter/polish/route.ts`
  - Already had Supabase auth, now also has rate limiting
  - Calls OpenAI so abuse potential was real

### Rate Limiting
- [x] Create `src/lib/auth/rateLimit.ts` — per-user sliding window rate limiter (inspired by Loomiverse `checkRateLimit`)
  - In-memory Map with rateLimitKey → timestamps array
  - Authenticated: 20 req/60s, Anonymous: 5 req/60s
  - Auto-cleanup when map exceeds 1000 entries
  - Logs warnings when rate limits are triggered

- [x] Rate limiting applied to chat, TTS, transcribe, photos, AND ghostwriter routes

### Input Validation
- [x] Create `src/lib/auth/validateChatInput.ts` — chat input sanitization
  - Rejects messages with `role: 'system'` (prevents prompt injection)
  - Caps messages array at 50, individual content at 5000 chars
  - Validates role is only 'user' or 'assistant'
  - Fixed: timestamp type now matches Message interface (Date, not number)

### Auth Middleware Hardening
- [x] Fix `src/middleware.ts` — no longer silently disables auth when env vars missing
  - Logs loud warning and redirects to login instead of passing through
- [x] Remove production dev-reset button from onboarding page
  - Now gated behind `process.env.NODE_ENV === 'development'`
- [ ] Fix family access logic: check if story owner is in SAME family group, not just ANY group
  - (Deferred — requires database query changes in stories/[id]/route.ts)

### Silent Failure Fixes (from review agents)
- [x] Fix bare `catch {}` in getAuthContext.ts — now logs errors instead of silently degrading
- [x] Add CRITICAL log when Supabase env vars missing in getAuthContext.ts
- [x] Add warning log when IP address can't be determined (shared rate-limit bucket risk)
- [x] Fix chat route to use `validation.sanitizedMessages` instead of raw body (was bypassing validation!)
- [x] Fix empty AI response handling in chat and photos routes (was returning blank content)
- [x] Fix timestamp type mismatch in validateChatInput (was `number`, should be `Date`)

## Dependencies

None — this is the foundation. Everything else depends on this.

## Notes

- Embers uses Edge runtime, so rate limiting will be in-memory per instance (same tradeoff Loomiverse made)
- For elderly users: auth failures show friendly "Please sign in to continue" message, not technical errors
- `/conversation` is intentionally unprotected for the page itself, but the API calls it makes MUST be authenticated
- Rate limiter logs abuse attempts for monitoring visibility
- All 9 API routes now have auth coverage (chat, tts, transcribe, photos/analyze, audio/upload, stories, stories/[id], drafts, ghostwriter/polish)

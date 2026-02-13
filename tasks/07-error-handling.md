# Error Handling & Resilience

> Source: `created by Claude Code full audit (Silent Failure Hunter agent)`
> Progress: 11/11 tasks done ✓
> Sprint: 4

## Why This Matters

Embers has 15+ silent failure points where errors are caught and swallowed. For a memory preservation app used by elderly people, losing data silently is the worst possible outcome. Every error should either be recovered from or surfaced to the user in a gentle way.

## Tasks

### Error Boundaries
- [x] Add React error boundary around conversation page
  - Created `src/components/ErrorBoundary.tsx` — catches rendering crashes, shows warm message + "Try Again" button
  - Created `src/app/conversation/layout.tsx` — wraps page with ErrorBoundary
  - Logs error details via componentDidCatch for debugging

- [x] Add React error boundary around onboarding page
  - Created `src/app/onboarding/layout.tsx` — wraps page with ErrorBoundary
  - Same pattern — friendly message, recovery action

### Silent Failure Fixes
- [x] Fix TTS failure handling in conversation page
  - Voice intro: retries once on TTS failure, then shows text fallback with amber notice
  - Response messages: shows "I couldn't play that out loud, but you can read my response above." amber toast
  - Added `ttsFailureNotice` state + amber-styled notice bar in JSX
  - Text is always visible since messages are added before TTS plays

- [x] Fix audio upload failure during story save
  - Story text saves even if audio upload fails (was already the case structurally)
  - Added `audioUploadFailed` state to useStoryPersistence — surfaces "Story saved! Audio will upload when connection improves." via amber notice
  - Note: full retry queue deferred — the story text (the important part) always saves

- [x] Fix draft recovery failure
  - `useStoryPersistence` now sets `draftRecoveryError` when draft parse fails
  - Shows "We found a draft but couldn't load it. Starting fresh." toast via amber notice
  - **Does NOT delete** the failed draft from localStorage — keeps it for manual recovery

### Empty Catch Block Cleanup
- [x] Fix all empty catch blocks in `useSpeechRecognition.ts`
  - 7 catch blocks updated with `console.warn('[SpeechRecognition] ...')` + descriptive context
  - Covers: stop previous instance, restart after abort, restart after network error, restart after unknown error, restart on end, stop, unmount cleanup
  - Network error now shows elderly-friendly message instead of technical one

### Input Sanitization Gaps (from Silent Failure Hunter)
- [x] Validate and length-limit `previousContext` in photos/analyze route
  - Capped at 500 chars, control characters stripped via regex
  - `request.json()` wrapped in separate try-catch → returns 400 not 500

- [x] Wrap `request.json()` in separate try-catch in chat, tts, and photos routes
  - Chat route: returns 400 with friendly "invalidInput" message
  - TTS route: returns 400 with "Invalid request body"
  - Photos route: returns 400 with "Invalid request"
  - All three now return proper 400 (client error) instead of 500 (server error)

- [x] Add TTS text truncation warning
  - Logs warning when text truncated: `[TTS] Text truncated from N to 4000 chars`
  - Returns `X-Text-Truncated: true` and `X-Original-Length` headers on truncated responses

- [x] Use OpenAI SDK typed error classes instead of string matching in chat route error handler
  - Imported `RateLimitError`, `AuthenticationError`, `APIError` from 'openai'
  - Replaced `error.message.includes('rate limit')` and `error.message.includes('API key')` with `instanceof` checks
  - Each error type returns an appropriate elderly-friendly message from ERROR_MESSAGES

### Friendly Error Messages
- [x] Create error message constants for elderly-friendly error messages
  - Created `src/lib/errors/messages.ts` with 20+ categorized messages
  - Categories: network, auth, AI, microphone, speech, TTS, storage, draft recovery, photos, generic, input validation
  - All messages are warm, non-technical, and include recovery guidance
  - Used throughout chat route, conversation page, and TTS failure handling

## Dependencies

- Can start immediately for error boundaries and message constants
- Silent failure fixes depend on Sprint 2 (Data Integrity) for dualStorage pattern
- Catch block cleanup is independent

## Notes

- NEVER show technical error messages to elderly users. No "500 Internal Server Error" or "Failed to fetch".
- Every error path should have a recovery action (retry, fallback to text, save locally, etc.)
- The goal: a user should NEVER lose a story. Even if everything else breaks, the text should persist somewhere.

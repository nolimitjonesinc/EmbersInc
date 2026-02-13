# Error Handling & Resilience

> Source: `created by Claude Code full audit (Silent Failure Hunter agent)`
> Progress: 0/11 tasks done
> Sprint: 4

## Why This Matters

Embers has 15+ silent failure points where errors are caught and swallowed. For a memory preservation app used by elderly people, losing data silently is the worst possible outcome. Every error should either be recovered from or surfaced to the user in a gentle way.

## Tasks

### Error Boundaries
- [ ] Add React error boundary around conversation page
  - Catch rendering crashes, show "Something went wrong. Your stories are safe." message
  - Include "Try again" button that reloads the page
  - Log error details for debugging

- [ ] Add React error boundary around onboarding page
  - Same pattern — friendly message, recovery action

### Silent Failure Fixes
- [ ] Fix TTS failure handling in conversation page (lines 810-825)
  - Currently: TTS failure is completely silent, voice intro marked as "played" even when TTS fails
  - Fix: show text fallback when TTS fails ("I wanted to say: [message]"), don't mark as played
  - For voice intro specifically: retry once, then show text

- [ ] Fix audio upload failure during story save (lines 931-934)
  - Currently: swallowed entirely
  - Fix: save story text even if audio upload fails, show "Story saved! Audio will upload when connection improves."
  - Queue failed audio uploads for retry (use sync queue pattern from dualStorage)

- [ ] Fix draft recovery failure (conversation page lines 247-259)
  - Currently: silently swallowed
  - Fix: show "We found a draft but couldn't load it. Starting fresh." toast
  - Keep the failed draft in localStorage (don't delete on failed load)

### Empty Catch Block Cleanup
- [ ] Fix all empty catch blocks in `useSpeechRecognition.ts`
  - Lines 318, 353-354, 374-375, 410, 458-460, 488-490
  - Each should at minimum `console.warn` with context
  - Critical ones (microphone access, recognition start) should surface to user

### Input Sanitization Gaps (from Silent Failure Hunter)
- [ ] Validate and length-limit `previousContext` in photos/analyze route
  - Currently: user-supplied string injected directly into system prompt with no sanitization
  - Fix: cap at 500 chars, strip control characters (same approach as validateChatInput)
- [ ] Wrap `request.json()` in separate try-catch in chat, tts, and photos routes
  - Currently: JSON parse failure returns 500 (server error) instead of 400 (client error)
- [ ] Add TTS text truncation warning — return header or field when text is silently truncated at 4000 chars
- [ ] Use OpenAI SDK typed error classes instead of string matching in chat route error handler
  - Import `RateLimitError`, `AuthenticationError` from 'openai' instead of `error.message.includes('rate limit')`

### Friendly Error Messages
- [ ] Create error message constants for elderly-friendly error messages
  - Network error: "It seems we lost our connection. Your stories are safe — we'll try again in a moment."
  - Auth error: "Let's get you signed in so we can save your stories safely."
  - API error: "I need a moment to collect my thoughts. Could you try that again?"
  - Microphone error: "I can't hear you right now. Try tapping the microphone button, or you can type instead."
  - Storage error: "Your story is saved on this device. Sign in to keep it safe across all your devices."

## Dependencies

- Can start immediately for error boundaries and message constants
- Silent failure fixes depend on Sprint 2 (Data Integrity) for dualStorage pattern
- Catch block cleanup is independent

## Notes

- NEVER show technical error messages to elderly users. No "500 Internal Server Error" or "Failed to fetch".
- Every error path should have a recovery action (retry, fallback to text, save locally, etc.)
- The goal: a user should NEVER lose a story. Even if everything else breaks, the text should persist somewhere.

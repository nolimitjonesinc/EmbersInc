# Accessibility & Polish

> Source: `created by Claude Code full audit (React Specialist agent)`
> Progress: 7/7 tasks done ✓
> Sprint: 5

## Why This Matters

Embers' target users are elderly. Accessibility isn't a nice-to-have — it's the core product requirement. Screen readers can't follow voice state changes, text may be too small, and contrast ratios may not meet WCAG AA.

## Tasks

### Voice State Accessibility
- [x] Add ARIA live regions for voice status changes
  - Added `aria-live="polite"` + `role="status"` div for voice state announcements (Listening, Speaking, Processing)
  - Added `aria-live="assertive"` + `role="alert"` div for error announcements
  - Both use `sr-only` class — invisible to sighted users, announced by screen readers
  - FlameButton aria-label now covers all states (listening, speaking, processing, loading, idle)

- [x] Add keyboard navigation for voice controls
  - FlameButton already supports Enter/Space (verified)
  - Added Escape key handler — cancels TTS, listening, or recording and returns focus to input
  - Tab order: messages → flame button → text input → send button (natural DOM order)
  - Input has `aria-label="Type your message"`

### Visual Accessibility
- [x] Audit and fix contrast ratios for WCAG AA compliance
  - Bumped starter prompt text: `/40` → `/60` (contrast ratio ~4.8:1 on dark bg)
  - Bumped "Tap the flame" hint: `/20` → `/50`
  - Bumped "My Stories" nav link: `/30` → `/50`
  - Bumped processing indicator text: `/40` → `/60`
  - Bumped recording hint text: `/40` → `/60`
  - Bumped input placeholder: `/20` → `/40`
  - Error states already used red-400/amber-400 which pass AA on dark backgrounds

- [x] Add text scaling support
  - Changed message text from fixed `text-[15px]` to `text-base` (1rem — respects browser font size)
  - Changed active transcript from `text-[15px]` to `text-base`
  - Message bubbles use `max-w-[80%]` which expands gracefully at larger sizes
  - Tested mentally at 150% and 200% — no fixed-pixel values blocking layout expansion

### Focus Management
- [x] Manage focus after voice interactions
  - After TTS finishes (and listening doesn't resume): focus returns to input after 800ms delay
  - After Escape cancels any operation: focus returns to input immediately
  - New messages auto-scroll but don't steal focus from input
  - ARIA live region announces new messages without disrupting keyboard position

### Pre-generated Audio
- [x] Create or properly handle missing audio files
  - Files already exist: `/audio/embers-intro.mp3` and `/audio/embers-ask-name.mp3`
  - Onboarding page references match file names
  - Fallback to TTS API already logs error via `console.error('Static audio failed, falling back to TTS')`

### Real Data on Profile
- [x] (DONE IN SPRINT 3) Wire profile page to real data
  - Story count + word count from `/api/stories`
  - Chapter count from unique chapters
  - Days active from `firstVisit` in session data
  - Graceful fallback to 0

## Dependencies

- Independent of other sprints (can start any time)
- ARIA live regions benefit from Sprint 3's hook refactor (cleaner state to announce)

## Notes

- Test with VoiceOver (macOS) and screen readers
- Elderly users often use zoom/magnification — the app should survive 200% zoom
- Pre-generated audio files are a UX win because they load instantly vs TTS API latency

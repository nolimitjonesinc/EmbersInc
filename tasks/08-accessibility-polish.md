# Accessibility & Polish

> Source: `created by Claude Code full audit (React Specialist agent)`
> Progress: 0/7 tasks done
> Sprint: 5

## Why This Matters

Embers' target users are elderly. Accessibility isn't a nice-to-have — it's the core product requirement. Screen readers can't follow voice state changes, text may be too small, and contrast ratios may not meet WCAG AA.

## Tasks

### Voice State Accessibility
- [ ] Add ARIA live regions for voice status changes
  - "Listening...", "Processing...", "Speaking..." should be announced to screen readers
  - Use `aria-live="polite"` for status updates, `aria-live="assertive"` for errors
  - Add `role="status"` to the breathing ember animation

- [ ] Add keyboard navigation for voice controls
  - Space bar to start/stop recording (already standard, verify it works)
  - Escape to cancel current operation
  - Tab order: message area → voice button → send button

### Visual Accessibility
- [ ] Audit and fix contrast ratios for WCAG AA compliance
  - Check all text against backgrounds (especially on the conversation page)
  - Ember orange (#FF6B35 or similar) on white may not meet AA — test and adjust
  - Ensure error states have sufficient contrast

- [ ] Add text scaling support
  - Respect user's browser font size preferences
  - Test at 150% and 200% zoom — layout should not break
  - Message bubbles should expand gracefully

### Focus Management
- [ ] Manage focus after voice interactions
  - After TTS finishes speaking, focus should return to input area
  - After recording stops, focus should move to the transcript/message
  - New messages should be announced but not steal focus from input

### Pre-generated Audio
- [ ] Create or properly handle missing audio files
  - `/audio/embers-intro.mp3` and `/audio/embers-ask-name.mp3` are referenced but missing
  - Either generate them and add to `public/audio/` or remove the references
  - Fallback to TTS is fine, but log a warning instead of silently falling back

### Real Data on Profile
- [ ] Wire profile page to real data (currently hardcoded mocks)
  - Story count from Supabase or localStorage
  - Actual conversation durations (track start/end time per session)
  - Chapter distribution from saved stories
  - Remove mock data fallback once real queries work

## Dependencies

- Independent of other sprints (can start any time)
- ARIA live regions benefit from Sprint 3's hook refactor (cleaner state to announce)

## Notes

- Test with VoiceOver (macOS) and screen readers
- Elderly users often use zoom/magnification — the app should survive 200% zoom
- Pre-generated audio files are a UX win because they load instantly vs TTS API latency

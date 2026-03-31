# Embers Core Stabilization Tasks

Purpose: keep the app reliable first, then layer extra features back in without breaking the voice loop again.

## Current Decision

- Core voice flow wins over optional features.
- Family prompts stay built, but are disabled in the live conversation path until voice is stable again.
- "Stable" means:
  - tap flame
  - Embers speaks or stops speaking cleanly
  - mic starts reliably
  - user speech appears quickly
  - response comes back and listening resumes

## Now

- [x] Identify recent stable baseline: `27d6751`
- [x] Confirm current repo builds cleanly
- [x] Reduce speech timing drift in `useSpeechRecognition`
- [x] Disable family prompts in the conversation startup/listening path
- [x] Let flame tap stop Embers when audio is playing/loading
- [x] Save last-session summary and use it in the returning-user opening

## Next

- [ ] Test the conversation loop in browser on the main target devices
- [ ] Confirm microphone permission flow is obvious and recoverable
- [ ] Confirm interim transcript appears while speaking
- [ ] Confirm silence auto-send feels fast enough without being jumpy
- [ ] Confirm draft recovery does not block fresh conversations
- [ ] Confirm typing fallback still works cleanly

## After Core Is Stable

- [ ] Re-enable family prompts behind a feature flag
- [ ] Reintroduce family prompt intro only if it cannot delay or block listening
- [ ] Re-test save flow with prompted stories
- [ ] Re-test story badges like "Asked by Emma"
- [ ] Re-test invite flow and submission page end to end

## Future Additions

- [ ] Add a lightweight "voice diagnostics" panel in dev mode
- [ ] Add one smoke test for the conversation start/stop/resume flow
- [ ] Add a simple release checklist before shipping voice changes

## Rule Going Forward

- No new feature touches the core conversation startup path unless it is tested against the basic loop first.
- If this path gets more complex, it also needs a kill switch.

# Next Phase PRD

## Title

Embers Save Reliability and Recovery

## Goal

Make Embers safe for long, emotional, voice-led conversations without depending on the user to remember to save.

## Problem

Right now the core voice experience is better than it was, but save reliability is still too fragile.

Main risks:
- unfinished conversations may not recover cleanly
- page exit/backgrounding is not protected well enough
- draft and final story behavior are not clearly separated
- audio preservation is not trustworthy yet

For this product, that is not acceptable.

If a user shares something personal, the app should protect it by default.

## Product Principles

1. Drafts save automatically
2. Final stories are finalized intentionally
3. Unfinished drafts always beat recap on return
4. Background protection should feel invisible
5. Safety first, polish second

## Expected User Workflow

### New or ongoing conversation
- user starts talking
- conversation is saved as a draft in the background
- user does not have to think about saving

### If the app is interrupted
- refresh, close, crash, backgrounding, bad connection
- latest usable draft should still be recoverable

### On return
- if unfinished draft exists:
  - Embers asks whether to continue or start fresh
- if no unfinished draft exists:
  - Embers uses last finalized session recap

### Finalizing
- user says "save", "I'm done", or uses save flow
- draft becomes finalized story
- app stores:
  - title
  - recap
  - story content
  - story metadata

## In Scope

1. Canonical draft data shape
2. Reliable draft recovery
3. Emergency save on exit/background/page hide
4. Clear separation between draft state and finalized story state
5. Better confidence around audio recording start/stop behavior

## Out of Scope

1. PDF export
2. Book compilation
3. Re-enabling family prompts in startup flow
4. Offline-first sync architecture beyond basic resilience
5. New monetization or sharing features

## Acceptance Criteria

1. Draft recovery always reads the same draft shape that autosave writes
2. Refreshing or hiding the page does not lose the latest meaningful conversation state
3. Returning users see draft recovery before recap when a draft exists
4. Final save still works normally
5. Build passes
6. The code path is understandable and easy to extend later

## Engineering Direction

Keep responsibilities separate:

- conversation flow:
  - talking, listening, reply loop

- draft persistence:
  - local save
  - cloud sync
  - recovery
  - exit protection

- final story persistence:
  - finalize
  - title/prose/recap generation
  - audio attach

This should reduce coupling and make later edits safer.

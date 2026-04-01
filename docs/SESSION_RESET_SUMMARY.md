# Embers Reset Summary

## What Embers Is

Embers is a voice-first memory preservation app.

Core promise:
- a user speaks naturally
- Embers responds like a warm guide
- stories are preserved safely
- returning users get a meaningful handoff into the next conversation

Primary product truth:
- the core voice loop matters more than extra features
- if the app does not listen reliably, everything else is decoration

## What Was Fixed

The following changes are now on `main`:

1. Voice flow was made more responsive again
- silence timing was shortened back toward a faster, more usable experience

2. Onboarding handoff was fixed
- saying "let's go" should no longer dump the user onto a silent conversation screen

3. Family prompts were taken out of the critical startup path
- not deleted
- just prevented from interfering with core conversation startup

4. Return recap support was added
- when a story is successfully saved, Embers now stores:
  - last story title
  - last session summary
- this is used in the next returning-user opening

5. Stabilization notes were added
- see [CORE_STABILIZATION_TASKS.md](/Users/dannyjonesphotography/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/APPS%20in%20Develpment/Embers%20Versions/Embers%20Project%20Versions/embers-web/docs/CORE_STABILIZATION_TASKS.md)

## What Is Still Not Good Enough

These are the real remaining risks:

1. Draft safety is not fully reliable
- drafts save locally
- cloud draft sync exists
- recovery shape is inconsistent

2. Exit/background protection is weak
- no solid emergency save on tab close, app backgrounding, or page hide

3. Audio session recording is not truly active
- code exists
- end-to-end behavior is not trustworthy yet

4. Final story save and draft save are not clearly separated in product behavior
- this needs to be made explicit and reliable

## Recommended Product Rules

1. Never lose a meaningful conversation
- draft save should happen automatically in the background

2. Finalizing a story should be intentional
- preserve drafts automatically
- finalize stories deliberately

3. Returning-user handoff should follow this order
- if unfinished draft exists: offer continue/start fresh
- otherwise: use last finalized session recap

4. No feature should touch the conversation startup path unless it is proven harmless

## Current Repo State

- one folder
- one branch: `main`
- no extra worktree
- no extra feature branch needed right now

## Next Focus

Next phase should be about save reliability, not new features.

See:
- [NEXT_PHASE_PRD.md](/Users/dannyjonesphotography/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/APPS%20in%20Develpment/Embers%20Versions/Embers%20Project%20Versions/embers-web/docs/NEXT_PHASE_PRD.md)
- [NEXT_PHASE_TASK_LIST.md](/Users/dannyjonesphotography/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/APPS%20in%20Develpment/Embers%20Versions/Embers%20Project%20Versions/embers-web/docs/NEXT_PHASE_TASK_LIST.md)

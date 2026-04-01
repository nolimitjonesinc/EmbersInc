# Next Phase Task List

## Priority 1: Draft Safety

- [ ] Define one canonical draft shape
- [ ] Make autosave write only that shape
- [ ] Make recovery read only that shape
- [ ] Confirm old draft compatibility or add one migration path

## Priority 2: Exit and Background Protection

- [ ] Add emergency local draft save on `visibilitychange`
- [ ] Add emergency local draft save on `pagehide`
- [ ] Add `beforeunload` fallback where useful
- [ ] Confirm no duplicate or corrupted draft writes from those events

## Priority 3: Recovery Order

- [ ] If unfinished draft exists, show draft recovery first
- [ ] If no draft exists, use last finalized session recap
- [ ] Confirm recap does not override unfinished conversations

## Priority 4: Final Save Clarity

- [ ] Define draft state vs finalized story state clearly in code
- [ ] Confirm final save clears draft correctly
- [ ] Confirm recap/title saving still happens after final save

## Priority 5: Audio Reliability

- [ ] Verify continuous session recorder actually starts when intended
- [ ] Verify session audio blob is produced at final save
- [ ] Verify upload path works and failure is visible
- [ ] If audio is not reliable, disable the claim until it is

## Priority 6: Verification

- [ ] Test refresh during conversation
- [ ] Test tab close / reopen
- [ ] Test backgrounding on mobile
- [ ] Test losing connection mid-conversation
- [ ] Test return with unfinished draft
- [ ] Test return with no draft but with saved recap
- [ ] Run `npm run build`

## Guardrails

- [ ] Do not reintroduce family prompts into startup flow during this phase
- [ ] Do not add new features before draft safety is trustworthy
- [ ] Keep save logic modular and separate from UI presentation

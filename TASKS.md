# Embers Web — Tasks

**Last updated:** August 4, 2026

Read `PROJECT.md` before adding anything here. Tasks that break a "Rule of the
house" don't belong on this list.

**Note:** This project already tracks detailed, section-by-section checklists in the `tasks/` directory (`01-core-features.md` through `14-invisible-save.md`) — that's the authoritative task list per `CLAUDE.md`. This file is a rollup for quick scanning; when in doubt, the `tasks/*.md` files win.

## Next up
- [ ] Lock down `/api/family/notify` against external calls (`tasks/13-security-fixes.md`)
- [ ] Verify RLS on all user-data tables (`tasks/13-security-fixes.md`)
- [ ] Add file-size/length limits: audio uploads >25MB, Ghostwriter input >10,000 chars (`tasks/13-security-fixes.md`)
- [ ] Get `npm run build` passing with zero errors (`tasks/13-security-fixes.md`)
- [ ] Delete or resolve the duplicate `src/app/page 2.tsx` file (flagged in `PROJECTS.md`) — confirm with Danny first, don't just delete it

## Doing now
- [ ] Invisible save & family circles system — dedicated `family_circles`/`family_circle_members` tables, invite-link elder onboarding, ongoing dual-write after enrollment, offline write queue (`tasks/14-invisible-save.md`, 12/26 done)

## Done
- [x] Documentation & rules (`tasks/02-documentation.md`, 12/12)
- [x] Security foundation (`tasks/04-security-foundation.md`, 19/19)
- [x] Data integrity & memory system (`tasks/05-data-integrity.md`, 9/9)
- [x] Architecture refactor (`tasks/06-architecture-refactor.md`, 9/9)
- [x] Error handling & resilience (`tasks/07-error-handling.md`, 11/11)
- [x] Accessibility & polish (`tasks/08-accessibility-polish.md`, 7/7)
- [x] Monetization & auth gates (`tasks/09-monetization-auth-gates.md`, 11/11)
- [x] Family prompts MVP (`tasks/10-family-prompts.md`, 27/27)
- [x] Silent failure fixes (`tasks/11-silent-failure-fixes.md`, 5/5)

## Someday / maybe
Ideas that aren't committed. Parking them here keeps them out of "Next up."
- Richer family notification emails — "Listen Now" / "Ask Another Question" buttons, story preview snippet (`tasks/12-post-launch-improvements.md`)
- Full family dashboard — all stories, prompt history, audio playback (`tasks/12-post-launch-improvements.md`)
- Photo-prompt and voice-recorded prompts from family members (`tasks/12-post-launch-improvements.md`)
- AI "help me ask a better question" prompt helper + smart mid-conversation prompt matching (`tasks/12-post-launch-improvements.md`)
- Follow-up question chains and Life Book epigraphs crediting who asked the prompt (`tasks/12-post-launch-improvements.md`)
- Premium-gate audio playback for family readers; track invite/conversion metrics (`tasks/12-post-launch-improvements.md`)
- Verify `embersinc.org` domain on Resend so emails send from `@embersinc.org`, not `@loomiverse.ai` (`tasks/12-post-launch-improvements.md`)
- Voice-activate the Life Book, Stories, Profile, and Timeline pages (`tasks/03-voice-first-ux.md`)
- Phone + SMS auth — task file lists this as not done, though `/api/auth/phone/*` routes already exist in code; needs a look to see if it's actually finished (`tasks/03-voice-first-ux.md`)

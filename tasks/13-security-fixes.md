# Pre-Launch Security & Quality Fixes

> Source: `Security audit, silent failure audit, wiring audit, IP audit — Mar 2026`
> Progress: 9/9 tasks done
> Sprint: 9 (Pre-Launch Hardening)
> Priority: MUST COMPLETE BEFORE ANY USER TOUCHES THE APP

---

## Tasks

### Critical — Launch Blockers

- [x] 1. Lock down `/api/family/notify` endpoint
  - Add internal auth check (verify request comes from our own stories API, not external)
  - Add HTML escaping for all interpolated values (submitterName, storytellerName, storyTitle)
  - Add rate limiting
  - File: `src/app/api/family/notify/route.ts`

- [x] 2. Fix guest submission page fake-success fallback
  - Remove the catch block that silently shows the form when API is unreachable
  - Set `pageState` to `'error'` on network failure, same as the `!res.ok` branch
  - File: `src/app/ask/[familyId]/page.tsx` lines 103-111

- [x] 3. Fix "Notify Me" button — either wire it or remove it
  - Wire `handleNotifyEmail` to POST the email to `/api/family/prompts` update endpoint
  - OR remove the email capture UI entirely so we don't lie to users
  - Recommendation: Wire it — send a PATCH to update the prompt's `submitter_email` field
  - Files: `src/app/ask/[familyId]/page.tsx`, potentially `src/app/api/family/prompts/[id]/route.ts`

- [x] 4. Verify RLS on production Supabase tables
  - Generate SQL to check and enable RLS on: `embers_users`, `embers_stories`, `embers_drafts`
  - Create RLS policies if missing
  - Output: SQL script Danny can run in Supabase dashboard

### Important — Quality & Safety

- [x] 5. Fix admin client silent fallback to fail loudly
  - In `/api/family/prompts/route.ts` and `/api/family/invite/[familyId]/route.ts`
  - If admin client fails, return 503 with clear error, log CRITICAL
  - Don't silently downgrade to underprivileged client

- [x] 6. Fix optimistic state clearing in useFamilyPrompts
  - `skipPrompt`, `declinePrompt`: don't clear `pendingPrompt` until API confirms
  - `markAnswered`: don't clear state on failure (stories API already handles the link server-side)
  - File: `src/lib/hooks/useFamilyPrompts.ts`

- [x] 7. Add error state to Life Book page
  - Add `error` state variable
  - On fetch failure, show "We couldn't load your stories right now" instead of empty state
  - On 401, show "Please sign in to see your stories"
  - File: `src/app/life-book/page.tsx`

- [x] 8. Add file size limit to audio upload
  - Reject files over 25MB before uploading to Supabase
  - Add MIME type validation (only audio/* files)
  - File: `src/app/api/audio/upload/route.ts`

- [x] 9. Add input length limit to ghostwriter/polish
  - Cap `content` field at 10,000 characters
  - Prevents abuse of OpenAI API credits
  - File: `src/app/api/ghostwriter/polish/route.ts`

---

## Acceptance Criteria

- [ ] `/api/family/notify` cannot be called by external requests
- [ ] Guest submission page shows error state on network failure, never a fake form
- [ ] "Notify Me" either works or doesn't exist
- [ ] RLS verified on all user-data tables
- [ ] Admin client failure returns 503, not silent degradation
- [ ] Skip/decline/markAnswered don't clear state before API confirms
- [ ] Life Book shows proper error message on fetch failure
- [ ] Audio uploads reject files over 25MB
- [ ] Ghostwriter rejects content over 10,000 chars
- [ ] `npm run build` passes with zero errors

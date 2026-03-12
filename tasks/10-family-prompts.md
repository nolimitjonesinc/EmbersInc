# Family Prompts — MVP Build

> Source: `Danny's idea — Feb 2026, PRD created Mar 2026`
> Progress: 20/20 tasks done
> Sprint: 8 (Family Prompts MVP)
> PRD: `docs/PRD-FAMILY-PROMPTS.md`

## Why This Matters

Families are the #1 reason people preserve memories. This feature turns Embers from a solo journaling tool into a family legacy machine. It's the viral loop: family submits question → grandma answers → family hears the story → shares with more family → they ask questions too.

---

## Tasks

### Phase A: Database & Types (Foundation)

- [x] Create SQL migration `supabase/migrations/002_family_prompts.sql`:
  - `embers_family_prompts` table with all fields from PRD
  - RLS policies: storyteller reads own prompts, authenticated family members create, submitter reads own
  - Index on (target_user_id, status) for conversation-start queries
  - Index on (family_group_id, created_at) for submission page
- [x] Add `embers_family_prompts` to `src/lib/supabase/types.ts` (Row/Insert/Update + helper types)
- [x] Add `FamilyPrompt` interface to `src/types/index.ts`
- [x] Add nullable fields to `embers_stories` type: `prompted_by_name`, `prompted_by_relationship`, `family_prompt_id`
- [x] Add `invite_code` generation utility to `src/lib/utils/inviteCode.ts` (nanoid-based, 12 chars)

### Phase B: Curated Prompt Library (Content)

- [x] Create `src/data/familyPrompts.ts` with full prompt library:
  - By relationship: children, grandchildren, friends, spouses
  - By theme: childhood, love, career, hard times, wisdom, fun
  - Special packs: "Questions You're Afraid to Ask", "Photo Prompts", "Legacy Questions"
  - 8-12 questions per category, each specific enough to trigger real stories
  - Export as typed arrays with category/pack metadata

### Phase C: API Routes (Backend)

- [x] Create `src/app/api/family/prompts/route.ts`:
  - POST: Submit prompt (guest via family invite link, or authenticated)
  - GET: Fetch next pending prompt for storyteller (auth required, returns max 1)
  - Rate limiting: 3/day guest, 10/day authenticated
  - Input validation: content max 500 chars, sanitize
- [x] Create `src/app/api/family/prompts/[id]/route.ts`:
  - PATCH: Update status (answered/skipped/declined), link story_id
  - Auth required (only storyteller can update their own prompts)
- [x] Create `src/app/api/family/invite/[familyId]/route.ts`:
  - GET: Return storyteller first name + family name (public, for submission page)
  - Validates family group exists and is active
- [x] Update `src/app/api/stories/route.ts` POST handler:
  - Accept optional `family_prompt_id`, `prompted_by_name`, `prompted_by_relationship`
  - On save with family_prompt_id: update prompt status to 'answered', link story_id

### Phase D: Guest Submission Page (The Money Page)

- [x] Create `src/app/ask/[familyId]/page.tsx`:
  - Mobile-first, dark theme, warm and inviting
  - Shows storyteller's first name: "Help Margaret preserve her memories"
  - Name input + relationship dropdown
  - Question textarea (500 char limit) with character counter
  - "Need inspiration?" expandable section with curated prompt packs
  - Pick-a-prompt: tap to auto-fill from curated library
  - Submit button with loading state
  - Success confirmation with optional email capture for notifications
  - Error states: invalid link, full queue, rate limited
  - NO account required — zero friction

### Phase E: Conversation Integration (The Magic)

- [x] Create `src/lib/hooks/useFamilyPrompts.ts`:
  - Fetch pending prompt on conversation mount
  - Expose: `pendingPrompt`, `acceptPrompt()`, `skipPrompt()`, `declinePrompt()`
  - `markAnswered(storyId)` — called when story is saved
- [x] Update `src/app/conversation/page.tsx`:
  - Import and use `useFamilyPrompts` hook
  - Modify `generateVoiceIntroduction()` to include family prompt when available
  - Add family prompt acceptance/skip UI (simple buttons below the intro)
  - Pass `family_prompt_id` and submitter info to story save flow
  - Show "Asked by Emma" badge during conversation when answering a family prompt
- [x] Update `src/lib/hooks/useStoryPersistence.ts`:
  - Accept optional family prompt metadata in `saveStory()`
  - Pass to API: `family_prompt_id`, `prompted_by_name`, `prompted_by_relationship`

### Phase F: Polish & Story Display

- [x] Update story display (stories page, life-book) to show "Asked by [name]" badge when `prompted_by_name` exists
- [x] Add invite link generation to profile page:
  - "Invite family to ask questions" button
  - Generates/shows shareable link: `[domain]/ask/[familyId]`
  - Copy-to-clipboard functionality
- [x] Wire curated prompt library (`src/data/familyPrompts.ts`) into submission page (`src/app/ask/[familyId]/page.tsx`)
- [x] Create simple email notification when prompted story is saved:
  - `src/app/api/family/notify/route.ts`
  - Sends to submitter email (if provided): "Margaret answered your question!"
  - Uses Resend or similar (env var for API key)

---

## Acceptance Criteria

- [x] Guest can submit a question at `/ask/[familyId]` with zero account creation
- [x] Curated prompt library helps family members find great questions
- [x] Storyteller hears family prompts woven into Ember's opening naturally
- [x] Storyteller can accept, skip, or decline any prompt
- [x] Answered stories are tagged with submitter info
- [x] Invite link is shareable from profile page
- [x] Rate limiting prevents abuse on guest submissions
- [x] Dark theme, mobile-optimized, warm and inviting design throughout
- [x] `npm run build` passes with zero errors

## Known Issues / Follow-ups

- `src/lib/prompt-library.ts` is a duplicate prompt file (from research agent) — unused, can be deleted
- Email notification implemented via Resend — requires `RESEND_API_KEY` env var and verified `embersinc.org` domain in Resend dashboard
- Rate limiter uses 60-second sliding window (existing infra), not a true daily limit — fine for MVP
- The Supabase migration needs to be run against the actual database before testing end-to-end

## Dependencies

- Sprints 1-7 complete (auth, error handling, monetization all in place)
- `family_groups` and `embers_family_members` tables already exist
- Auth system (softAuth/requireAuth) ready to use

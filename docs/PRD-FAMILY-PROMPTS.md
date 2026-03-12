# PRD: Family Prompts — "Ask Your Loved One"

## One-Line Pitch
Family members send questions to their elderly loved one, and Ember weaves them warmly into the next conversation — turning solo journaling into a family legacy machine.

## Why This Is The Feature That Matters

Every competitor (Storyworth, Remento, Storii) treats family participation as an afterthought. "Suggest a question" exists but it's shallow, cold, and disconnected from the storytelling experience. Nobody has built a system where:
- A granddaughter can submit a question in 30 seconds (no account needed)
- The AI host introduces it warmly: "Your granddaughter Emma wants to know about your wedding day..."
- The resulting story is tagged, shared, and the granddaughter gets notified with audio
- The family member's emotional investment creates a viral loop

### The Strategic Flip
The buyer isn't the elderly user — it's the daughter/son (age 35-55) who set up the account. Family Prompts gives THEM ongoing value. It's the reason they keep paying.

### Competitive Position
- **Storyworth:** Weekly email questionnaire. Cold, impersonal, no voice preservation.
- **Remento:** Family can "suggest" questions and vote. Better, but still asynchronous text.
- **Storii:** Robot calls the phone. No family prompt integration.
- **Embers:** AI companion introduces family questions warmly in a real conversation. Family hears the answer in grandma's actual voice. Nobody else does this.

---

## MVP Scope (What We're Building Now)

### 1. Database: `embers_family_prompts` table
- `id` (uuid, PK)
- `family_group_id` (FK → family_groups)
- `submitter_id` (FK → embers_family_members, nullable for guest submissions)
- `target_user_id` (FK → users — the storyteller)
- `submitter_name` (text — "Emma")
- `submitter_relationship` (text — "granddaughter")
- `type` ('question' | 'photo')
- `content` (text — the question, max 500 chars)
- `photo_url` (text, nullable)
- `status` ('pending' | 'offered' | 'answered' | 'skipped' | 'declined')
- `story_id` (FK → embers_stories, nullable — linked when answered)
- `offered_count` (int, default 0 — how many times Ember offered this)
- `created_at`, `updated_at`

### 2. Guest Prompt Submission Page (`/ask/[familyId]`)
The most important page in the entire feature. A single, beautiful, mobile-friendly page where anyone with the link can:
- See the storyteller's first name and a warm message: "Help [Margaret] preserve her memories"
- Enter their name and relationship (dropdown: daughter, son, granddaughter, grandson, niece, nephew, friend, other)
- Type a question (500 char limit) OR pick from curated prompts
- See a "Question Inspiration" section with expandable prompt packs
- Submit with zero account creation
- Get a confirmation: "Your question has been sent to Margaret! We'll let you know when she answers."
- Optionally enter email for notifications

**Design:** Dark theme matching Embers. Warm, inviting, not clinical. Big touch targets. Works perfectly on mobile (this will mostly be used on phones).

### 3. Curated Prompt Library (`/src/data/familyPrompts.ts`)
Pre-built question packs organized by:
- **Relationship:** For children, grandchildren, friends, spouses
- **Theme:** Childhood, love, career, hard times, wisdom, fun/light
- **Special packs:** "Questions You're Afraid to Ask", "Photo Prompts", "Legacy Questions"
- Each question designed to trigger a SPECIFIC story, not a generic answer

### 4. API Routes
- `POST /api/family/prompts` — Submit a prompt (guest or authenticated)
  - Rate limited: max 3 per day per IP (guest), 10 per day (authenticated)
  - Input validation: content max 500 chars, sanitized
  - Validates family group exists and has active storyteller
- `GET /api/family/prompts` — Fetch pending prompts for storyteller (auth required)
  - Returns oldest pending prompt (max 1 per session)
  - Marks as 'offered', increments offered_count
- `PATCH /api/family/prompts/[id]` — Update status (auth required)
  - Mark answered (link story_id), skipped, or declined
- `GET /api/family/prompts/invite/[familyId]` — Get family info for submission page (public)
  - Returns: storyteller first name only (privacy), family group name, prompt count

### 5. Conversation Integration
When the storyteller opens a conversation and has pending family prompts:
- Ember checks for pending prompts via `/api/family/prompts`
- If one exists, Ember's opening changes:
  > "Welcome back, Margaret. Your granddaughter Emma sent you a question — she wants to know about your wedding day. Would you like to tell her about that, or would you prefer to talk about something else today?"
- If accepted: conversation proceeds naturally, story tagged with `prompted_by` metadata
- If skipped: "No problem at all. Emma's question will be here whenever you're ready."
- If declined: prompt marked as declined, never offered again

### 6. Story Tagging
When a family-prompted story is saved:
- `embers_stories` gets new nullable fields: `prompted_by_name`, `prompted_by_relationship`, `family_prompt_id`
- Story card in the library shows a small badge: "Asked by Emma"
- The prompt status updates to 'answered' with the story_id linked

### 7. Notification (Email)
When a prompted story is saved:
- If the submitter provided an email: send a simple notification
  - Subject: "Margaret answered your question!"
  - Body: Story title + first 200 chars of content + CTA to listen (if premium) or read
- Use Supabase Edge Functions or a simple API route with Resend/SendGrid

---

## What We're NOT Building Yet (Phase 2+)

- Family dashboard page (view all stories, prompt history)
- Photo prompt uploads
- Voice-recorded prompts
- AI prompt helper ("help me ask a better question")
- Smart prompt matching (Ember connects mid-conversation to pending prompts)
- Comments/reactions from family members
- Follow-up question chains
- Life Book integration with prompt epigraphs

---

## Business Model Integration

### Free Tier
- 1 family member can send prompts
- Max 2 prompts per month
- Family reads text answers only

### Premium ($9.99/mo)
- Unlimited family members
- Unlimited prompts
- Family gets audio playback (hear grandma's actual voice)
- Email notifications when stories are answered

### The Non-Manipulative Gate
- Margaret ALWAYS hears and answers prompts for free (never gate the vulnerable user)
- The premium gate is on the FAMILY side: audio access, unlimited members, notifications
- Sarah sees: "Margaret answered your question! Upgrade to listen in her own voice."

---

## Success Metrics
- Prompts submitted per family member per month: target 2-4
- Prompt answer rate: target >70%
- Time from prompt to answer: target <7 days
- Family members per storyteller: target 3+
- Invite link click-to-submit rate: target >40%

---

## Technical Notes
- `family_groups` and `embers_family_members` tables already exist
- Auth system (softAuth/requireAuth) already in place
- Photo Detective feature exists for future photo prompt integration
- Conversation hook (`useConversation`) accepts the conversation flow — family prompt injection happens at the page level in `generateVoiceIntroduction()`
- RLS policies needed for new table (storyteller can read their prompts, submitter can create)

# Embers MVP - Product Requirements Document

## Project Overview
**Goal:** Get Embers ready for Danny's dad to record his life stories ASAP.
**Primary User:** 85-year-old, nearly blind, needs voice-first experience.
**Outcome:** Recorded voice + transcripts + AI-generated book-ready prose.

---

## Success Criteria
- [ ] Dad can open the app and immediately hear Ember guiding him
- [ ] Dad can speak his stories without touching anything except one button
- [ ] All voice recordings are saved (actual audio files)
- [ ] All transcripts are saved (text)
- [ ] All conversations are preserved (for book generation)
- [ ] Danny can access all recordings and transcripts

---

## Database Tables (Supabase)
| Table | Purpose | Status |
|-------|---------|--------|
| `embers_users` | User profiles | ⏳ Rename pending |
| `embers_stories` | Saved stories with prose | ⏳ Rename pending |
| `embers_conversations` | Full conversation history | ⏳ Rename pending |
| `embers_family_groups` | Family sharing | ⏳ Rename pending |
| `embers_family_members` | Group members | ⏳ Rename pending |
| `embers_photos` | Photo detective feature | ⏳ Rename pending |
| `embers-audio` (bucket) | Voice recordings storage | ⏳ Create pending |

---

## Goals

### Goal 1: Voice-First Accessibility ✅ COMPLETE
Make the app usable for someone who is 85 and nearly blind.

### Goal 2: Data Persistence 🔄 IN PROGRESS
Save everything - voice, text, conversations - so nothing is lost.

### Goal 3: Book Generation Ready ⏳ PENDING
Structure data so AI can generate a life book from recordings.

---

## Task List

### Phase 1: Database Setup (TODAY)
- [ ] **Task 1.1:** Run SQL to rename tables to `embers_*` prefix
  - [ ] Subtask: Copy SQL from Claude
  - [ ] Subtask: Run in Supabase SQL Editor
  - [ ] Subtask: Verify tables renamed
- [ ] **Task 1.2:** Create audio storage bucket
  - [ ] Subtask: `embers-audio` bucket created
  - [ ] Subtask: Storage policies applied
- [ ] **Task 1.3:** Add new columns to embers_stories
  - [ ] Subtask: `audio_recordings` JSONB column
  - [ ] Subtask: `raw_transcript` TEXT column
  - [ ] Subtask: `conversation_messages` JSONB column

### Phase 2: Code Updates (TODAY)
- [ ] **Task 2.1:** Update all API routes to use `embers_*` tables
  - [ ] Subtask: `/api/stories` route
  - [ ] Subtask: `/api/chat` route (if applicable)
  - [ ] Subtask: Any other routes using old table names
- [ ] **Task 2.2:** Add audio upload functionality
  - [ ] Subtask: Create `/api/audio/upload` endpoint
  - [ ] Subtask: Upload recordings to Supabase Storage
  - [ ] Subtask: Save audio URL to story record
- [ ] **Task 2.3:** Add conversation auto-save
  - [ ] Subtask: Save conversation every 2 minutes
  - [ ] Subtask: Save on page unload/close
  - [ ] Subtask: Resume interrupted conversations

### Phase 3: User Experience Polish
- [ ] **Task 3.1:** Ensure voice starts immediately on all screens
  - [x] Subtask: Welcome screen auto-play
  - [x] Subtask: Interests screen auto-play
  - [x] Subtask: Name screen auto-play
  - [x] Subtask: All screens have directional guidance
- [ ] **Task 3.2:** Fix magic link email issues
  - [ ] Subtask: Debug "Something went wrong" error
  - [ ] Subtask: Consider Resend for custom email provider
- [ ] **Task 3.3:** Add loading audio (not flashing text)
  - [ ] Subtask: Gentle ambient sound while processing
  - [ ] Subtask: "Hmm" thinking sound option

### Phase 4: Testing & Launch
- [ ] **Task 4.1:** End-to-end test
  - [ ] Subtask: New user onboarding flow
  - [ ] Subtask: Record a full story
  - [ ] Subtask: Verify audio saved
  - [ ] Subtask: Verify transcript saved
  - [ ] Subtask: Verify story appears in Life Book
- [ ] **Task 4.2:** Create dad's account
  - [ ] Subtask: Set up email
  - [ ] Subtask: Walk through onboarding together
- [ ] **Task 4.3:** Document how to access recordings
  - [ ] Subtask: Supabase dashboard access
  - [ ] Subtask: Export options

---

## Data Structure for Book Generation

Each story will contain:
```json
{
  "id": "uuid",
  "title": "AI-generated title",
  "content": "Raw text from user",
  "raw_transcript": "Exact words spoken (preserved)",
  "narrative_prose": "AI-generated book-style prose",
  "conversation_messages": [
    {"role": "assistant", "content": "Ember's question"},
    {"role": "user", "content": "Dad's response"},
    ...
  ],
  "audio_recordings": [
    {"url": "https://...", "duration": 120, "timestamp": "..."},
    ...
  ],
  "chapter": "Who I Am | Where I Come From | etc.",
  "tags": ["family", "childhood", "war", ...],
  "created_at": "timestamp"
}
```

---

## API Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/stories` | GET | List user's stories | ✅ Working |
| `/api/stories` | POST | Save new story | ✅ Working |
| `/api/stories/[id]` | GET | Get single story | ✅ Working |
| `/api/stories/[id]` | PUT | Update story | ✅ Working |
| `/api/chat` | POST | AI conversation | ✅ Working |
| `/api/tts` | POST | Text-to-speech | ✅ Working |
| `/api/transcribe` | POST | Whisper transcription | ✅ Working |
| `/api/audio/upload` | POST | Upload voice recording | ⏳ Pending |

---

## Environment Variables (Vercel)

Required in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` - ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - ✅
- `SUPABASE_SERVICE_ROLE_KEY` - ✅
- `OPENAI_API_KEY` - ✅

---

## Notes

- Voice recordings are gold - actual audio files more valuable than transcripts for emotional content
- Auto-save is critical - dad might close browser accidentally
- Book generation can be done later with all the saved data
- Consider offline mode for future (Service Worker)

---

## Quick Start for Today

1. **Run the SQL** in Supabase to rename tables
2. **Update the code** to use new table names
3. **Add audio upload** so recordings are saved
4. **Test the flow** end-to-end
5. **Set up dad's account**

---

*Last updated: February 1, 2026*

# Architecture Refactor

> Source: `created by Claude Code full audit`
> Progress: 9/9 tasks done ✓
> Sprint: 3
> Inspired by: Loomiverse `PsychologyManager.js` (dirty flag, serialize/load pattern)

## Why This Matters

The conversation page is a 1,330-line god component with 19+ useState hooks handling voice, audio, TTS, transcription, messaging, persistence, timers, and modals all in one file. It's unmaintainable and fragile — changes to one feature break others.

## Tasks

### Conversation Page Breakup
- [x] Extract `useConversation` hook — manages messages, API calls, memory extraction, user context
  - Owns: messages, isProcessing, userName, error, selectedInterests, userContext, starterPrompt
  - Uses: ConversationMemory from Sprint 2
  - sendMessage() returns AI response text (does NOT play audio — caller handles that)

- [x] Extract `useTTSPlayback` hook — manages text-to-speech playback
  - Owns: isSpeaking, isSpeakingRef, isLoadingTTS, warmLoadingMessage, audioRef
  - playText(text, {onEnd, onError}) — callback-based so page wires post-playback behavior
  - stopAllAudio() — immediate audio halt

- [x] Extract `useStoryPersistence` hook — manages saving/loading stories and drafts
  - Owns: isSaving, savedStoryId, savedStoryTitle, savedStoriesCount, showSessionEnding
  - saveStory() handles both authenticated (Supabase) and anonymous (localStorage) saving
  - Draft recovery: recoverDraft(), discardDraft(), resetStoryState()

- [x] (SPLIT — useAudioRecording already existed as useSpeechRecognition + useAudioRecorder)

- [x] Refactor `conversation/page.tsx` to compose these hooks
  - Dropped from 1345 lines to ~787 lines
  - Composes: useConversation, useTTSPlayback, useStoryPersistence + existing speech/recorder hooks
  - Page-level state reduced to UI concerns only (inputText, showEndPrompt, etc.)

- [x] Address QC agent findings on memory system, storage, and silent failures
  - Memory: fixed sacred eviction unbounded growth, budget overflow (label costs), missing \\b, fromJSON validation
  - Memory extractor: fixed sacred detection to capture ALL matches (not just first), added \\b to diagnosis pattern
  - Trim: fixed budget bypass for short conversations (<=7 messages)
  - Storage: replaced 6 empty catch blocks with console.warn logging
  - OpenAI client: throws on missing API key instead of passing undefined

### Type System Fix
- [x] Fix Supabase type mismatches in `src/lib/supabase/types.ts`
  - Renamed: `stories` → `embers_stories`, `family_members` → `embers_family_members`
  - Removed: `conversations` table (not used anywhere, was never created)
  - Added: `embers_drafts` table definition (was missing entirely)
  - Updated all helper type aliases (Story, Draft, FamilyMember)

### Session Tracking
- [x] Fix `userStyleService.ts` session counting
  - `getSessionData()` was incrementing `totalSessions` on every call (not once per session)
  - Added module-level `sessionIncrementedThisLoad` flag — only increments + saves once per page load
  - `recordUsedPrompt` and `hasUsedPrompt` already exist and are wired via `userStyleService` singleton

### Profile Page
- [x] Replace hardcoded mock stats on profile page with real data
  - Story count + word count + chapters: fetched from `/api/stories` on mount
  - Days active: calculated from `firstVisit` in session data
  - Graceful fallback to 0 if API or localStorage unavailable

## Dependencies

- Depends on: Sprint 2 (Data Integrity) for memory system and dual storage
- Independent of: Sprint 1 (Security) can proceed in parallel for non-API work

## Notes

- The hooks should follow the same pattern as Loomiverse PsychologyManager: dirty flag tracking, serialize/load for persistence
- TTS caching: use a simple Map keyed by text hash, store audio blob URLs. Clear on page unload.
- Don't over-abstract: 4-5 hooks is the right number. One more would be over-engineering.

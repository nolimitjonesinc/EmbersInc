# Silent Failure Fixes

> Source: `QC agent findings from Feb 2026 review`
> Progress: 3/3 tasks done
> Sprint: 7 (quick fix sprint)

## Why This Matters

Elderly users are the most vulnerable to silent failures. They can't debug, they can't check console logs, and if their story vanishes without feedback they'll think the app is broken and never come back. These 3 fixes protect their memories.

## Tasks

### 1. Fix dualStorage.ts silent catch blocks
- [x] Fix catch blocks and remove dead sync queue code
  - `loadLocal()` catch upgraded from `console.warn` to `console.error` with clearer "data may be corrupted" message
  - `loadWithSync()` cloud fallback logging already correct (`console.warn` — appropriate since it falls back gracefully)
  - Dead sync queue code removed: `queueSync`, `removeSyncQueueEntry`, `processSyncQueue`, `setupOnlineSync`, `SYNC_QUEUE_KEY`, `MAX_QUEUE_SIZE`
  - Remaining catch blocks (`saveWithSync`, `clearWithSync`) already had proper `console.error` + callback notifications

### 2. Fix dead sync queue + duplicate draft save paths
- [x] Fix the format mismatch between two competing draft save systems
  - Removed raw `localStorage.setItem` from `handleAutoSave` — now delegates to `saveDraftToLocalStorage` from the hook
  - Used a ref to break circular dependency between `handleAutoSave` and the hook
  - Draft recovery auto-start check now handles both dualStorage `{ data: {...} }` and legacy `{ messages, ... }` formats
- [x] Fix useEffect that tears down Supabase interval on every message
  - Split into two effects: immediate localStorage save (depends on messages) + stable periodic Supabase sync (reads from messagesRef, never torn down)
  - Also fixed: draft ID regenerated on every save (now stable per session via draftIdRef), initial syncStatus corrected from 'synced' to 'pending'
- [x] Either wire up sync queue or remove dead code
  - Removed all dead sync queue code from dualStorage.ts (done as part of Task 1 fix)

### 3. Fix TTS silent failures in conversation page
- [x] Fix TTS onError callbacks and chat error handling
  - `playVoicePrompt` onError: now logs error, shows "couldn't play out loud" notice, and resumes listening
  - `playDraftRecoveryVoice` onError: now logs error AND activates voice commands as fallback (was silently swallowing)
  - `playVoiceIntroduction` onError: now logs error (retry + fallback logic was already good)
  - `handleSendMessage` TTS onError: now logs error (notice was already shown)
  - `useConversation.sendMessage` catch: upgraded from generic "Something went wrong" to differentiated errors — TypeError = network, 429 = rate limit, else = friendly generic. Uses ERROR_MESSAGES constants.

## Files to Modify

- `src/lib/storage/dualStorage.ts` — Task 1
- `src/lib/hooks/useVoiceGuidedAutoSave.ts` — Task 2
- `src/app/conversation/page.tsx` — Tasks 2 + 3

## Dependencies

None — these are bug fixes on existing code.

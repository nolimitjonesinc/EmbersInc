# Data Integrity & Memory System

> Source: `created by Claude Code full audit + Loomiverse reference analysis`
> Progress: 9/9 tasks done ✓
> Sprint: 2
> Inspired by: Loomiverse `MemorySystem.js`, `PsychologyStorage.js`, `cloudStorage.js`, `IntegratedAdventureEngine.js`

## Why This Matters

Embers sends the **entire conversation history** to OpenAI every message (no token limit, no sliding window). The same questions get asked repeatedly because there's no memory of what topics were covered. Draft saves fail silently. This is a memory preservation app that doesn't actually preserve memories well.

## Tasks

### Conversation Memory System
- [x] Create `src/lib/memory/ConversationMemory.ts` — track what's been discussed (inspired by Loomiverse MemorySystem)
  - Memory types: STORY_TOPIC, PERSON_MENTIONED, EMOTION_EXPRESSED, QUESTION_ASKED, PROMISE_MADE
  - Salience levels: BACKGROUND(1), NORMAL(2), IMPORTANT(3), SACRED(4)
  - Sacred memories: Names of loved ones, deaths, births, weddings, military service — never evicted
  - `storeMemory(type, content, salience)` — adds with dedup, upgrades salience if higher
  - `getMemoryContext(charBudget)` — compact labeled format, sacred first (★ prefix)
  - `hasAskedAbout(topic)` — prevents repeating the same questions
  - Max 100 memories with LRU eviction (sacred immune)
  - Serializable via toJSON/fromJSON for future persistence

- [x] Create `src/lib/memory/memoryExtractor.ts` — extract memories from conversation
  - Extracts names via relationship patterns ("my mother Margaret", "called him Bobby")
  - Detects sacred moments (death, birth, wedding, military, diagnosis, immigration)
  - Classifies 26 emotion keywords into emotion categories (joy, grief, pride, etc.)
  - Tracks AI questions to prevent repetition
  - Extracts topic from user's first sentence per message
  - Integrated into conversation page — runs after every message exchange

### Conversation History Management
- [x] Add sliding window to chat route — limit conversation history sent to OpenAI
  - Created `src/lib/chat/trimConversationHistory.ts`
  - Token budget: 3000 tokens (estimateTokens = Math.ceil(text.length / 4))
  - Always keeps: first message (context) + last 6 messages (active conversation)
  - Middle messages: replaced with brief context note about omitted messages
  - Over-budget fallback: keeps first + as many recent as fit
  - Integrated into chat route — `trimConversationHistory(fullHistory)` before OpenAI call

- [x] Implement prompt compression (inspired by Loomiverse IntegratedAdventureEngine)
  - Hard limit: 2000 chars for memory context section in system prompt
  - Compact labeled format: PEOPLE, TOPICS COVERED, EMOTIONAL MOMENTS, QUESTIONS ALREADY ASKED
  - Only non-empty sections included — sacred items marked with ★
  - Chat route accepts `memoryContext` field and injects it into system prompt
  - Conversation page sends `conversationMemoryRef.current.getMemoryContext()` with each request

### Dual Storage with Sync
- [x] Create `src/lib/storage/dualStorage.ts` — localStorage + Supabase sync (inspired by Loomiverse PsychologyStorage)
  - `saveWithSync(key, data, callbacks)` — save to localStorage (instant), queue Supabase sync
  - `loadWithSync(key, fetchFromCloud)` — load from localStorage first, resolve conflicts with cloud
  - `loadLocal(key)` — instant localStorage read
  - Conflict resolution: most recent timestamp wins, updates localStorage if cloud is newer
  - `processSyncQueue(syncFn)` — processes pending sync items
  - `setupOnlineSync(syncFn)` — online/offline event listeners for automatic retry
  - Sync queue capped at 10 items, `clearWithSync` for cleanup

- [x] Migrate draft persistence to use dualStorage
  - `useVoiceGuidedAutoSave` now uses `saveWithSync` / `loadLocal` / `clearWithSync`
  - Supabase save failures surface via `syncStatus` state (synced/pending/offline/error)
  - Silent `catch {}` blocks replaced with logged warnings
  - `clearDraft` uses `clearWithSync` to clean both stores

### Error Surfacing
- [x] Surface draft save failures to user instead of swallowing them
  - `syncStatus` exposed from auto-save hook (ready for UI toast in Sprint 4)
  - Supabase save failures logged with `[AutoSave]` prefix
  - Draft recovery parse failures logged instead of silently swallowed
  - Story fetch failures logged with warning instead of `/* ignore */`

### Bug Fixes
- [x] Fix silence detection bug in `src/lib/speech/useSpeechRecognition.ts`
  - Was: silence timer started at recognition.start() (before user spoke) AND reset on every interim result
  - Fix 1: silence timer only starts after first FINAL result (user has actually spoken)
  - Fix 2: interim results CLEAR the timer (user is mid-speech) but don't START a new one
  - Fix 3: don't start silence tracking at recognition.start() — no false "Take your time..." before user speaks
  - Fix 4: increased thresholds for elderly users: detected 4s, preparing 6s, auto-send 8s (was 2/3/5s)

- [x] Fix story fetch failure in conversation page
  - Was: `catch { /* ignore */ }` — completely swallowed
  - Now: logs warning with `[Conversation]` prefix, conversation continues unblocked
  - Also fixed: auto-start draft check `catch { /* ignore */ }` → logged warning

## Dependencies

- Depends on: Sprint 1 (Security) for auth on API routes
- Blocks: Sprint 3 (Architecture) needs memory system for refactored conversation flow

## Notes

- The memory system doesn't need to be as complex as Loomiverse's (which handles fantasy characters). Focus on: topics covered, people mentioned, questions asked, emotional moments.
- Dual storage is critical for elderly users who may lose internet or close browser mid-story.
- Token budget for history should be generous enough for natural conversation but bounded enough to prevent $5 API calls.

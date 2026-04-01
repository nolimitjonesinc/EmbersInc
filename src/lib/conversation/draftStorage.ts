/**
 * Draft Storage — Local crash cushion for in-progress conversations.
 *
 * Maintains up to MAX_DRAFTS conversations in localStorage using a
 * rotation strategy: oldest non-cloud-backed draft is evicted first.
 * Cloud-backed drafts are kept until explicitly cleared.
 *
 * Language contract: nothing here says "saved." Data stored here is
 * "protected on this device" — not safe, just protected.
 */

import { Message } from '@/types';
import { type DualStorageCallbacks } from '@/lib/storage/dualStorage';

const DRAFTS_KEY = 'embers_conversation_drafts';
const MAX_DRAFTS = 3;

interface DraftEntry {
  id: string;
  messages: Message[];
  savedAt: string;
  cloudBacked: boolean;
}

interface DraftsStore {
  drafts: DraftEntry[];
}

function readStore(): DraftsStore {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return { drafts: [] };
    const parsed = JSON.parse(raw) as DraftsStore;
    // Guard against corrupted data
    if (!Array.isArray(parsed?.drafts)) return { drafts: [] };
    return parsed;
  } catch {
    return { drafts: [] };
  }
}

function writeStore(store: DraftsStore): void {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('[DraftStorage] localStorage write failed — storage may be full:', err);
  }
}

/**
 * Save or update a conversation draft. Returns the draft entry on
 * success, or null if the save failed.
 *
 * Rotation: if we're at MAX_DRAFTS, the oldest non-cloud-backed entry
 * is evicted. If all are cloud-backed, the oldest is evicted.
 */
export function saveConversationDraft(
  messages: Message[],
  draftId: string,
  callbacks?: DualStorageCallbacks,
): { id: string } | null {
  if (messages.length < 2) return null;

  try {
    const store = readStore();

    // Remove any existing entry for this draft ID
    const existingIndex = store.drafts.findIndex((d) => d.id === draftId);
    if (existingIndex >= 0) {
      store.drafts.splice(existingIndex, 1);
    } else if (store.drafts.length >= MAX_DRAFTS) {
      // Evict oldest non-cloud-backed; fall back to oldest overall
      let evictAt = -1;
      for (let i = store.drafts.length - 1; i >= 0; i--) {
        if (!store.drafts[i].cloudBacked) {
          evictAt = i;
          break;
        }
      }
      if (evictAt >= 0) {
        store.drafts.splice(evictAt, 1);
      } else {
        store.drafts.pop();
      }
    }

    const entry: DraftEntry = {
      id: draftId,
      messages,
      savedAt: new Date().toISOString(),
      cloudBacked: false,
    };

    store.drafts.unshift(entry); // most recent first
    writeStore(store);

    callbacks?.onSyncStatusChange?.('pending');
    return { id: draftId };
  } catch (err) {
    callbacks?.onSyncError?.('Could not protect your conversation. Storage may be full.');
    console.error('[DraftStorage] Save failed:', err);
    return null;
  }
}

/**
 * Load the most recent draft. Returns null if nothing is stored.
 */
export function loadConversationDraft(): {
  draft: { id: string; messages: Message[]; savedAt: string };
} | null {
  try {
    const store = readStore();
    if (store.drafts.length === 0) return null;
    const latest = store.drafts[0];
    return {
      draft: {
        id: latest.id,
        messages: latest.messages,
        savedAt: latest.savedAt,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Quick check used by the conversation screen before auto-starting audio.
 */
export function hasRecoverableDraft(): boolean {
  const loadedDraft = loadConversationDraft();
  return !!loadedDraft?.draft?.messages?.length;
}

/**
 * Mark a draft as cloud-backed so it won't be evicted during rotation.
 */
export function markDraftCloudBacked(draftId: string): void {
  try {
    const store = readStore();
    const draft = store.drafts.find((d) => d.id === draftId);
    if (draft) {
      draft.cloudBacked = true;
      writeStore(store);
    }
  } catch {
    // Non-critical — rotation eviction will just treat it as non-backed
  }
}

/**
 * Remove the most recent draft from local storage and optionally from cloud.
 */
export function clearConversationDraft(clearFromCloud?: () => Promise<void>): void {
  try {
    const store = readStore();
    if (store.drafts.length > 0) {
      store.drafts.shift();
      writeStore(store);
    }
  } catch (err) {
    console.warn('[DraftStorage] Could not clear draft:', err);
  }

  if (clearFromCloud) {
    clearFromCloud().catch((err) =>
      console.warn('[DraftStorage] Cloud clear failed (local cleared):', err),
    );
  }
}

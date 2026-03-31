'use client';

import { useCallback } from 'react';
import { loadLocal, clearWithSync } from '@/lib/storage/dualStorage';
import { Message } from '@/types';

const DRAFT_KEY = 'embers_conversation_draft';

/**
 * useDraftMigration
 *
 * After a user completes phone enrollment, we promote any conversation draft
 * sitting in localStorage up to their new cloud account.
 *
 * Why: The user recorded stories before linking their phone. Those stories
 * should not disappear — they should follow the user to the cloud.
 *
 * Usage:
 *   const { migrateDraftToCloud } = useDraftMigration();
 *   // Call this inside the onEnrolled callback of VoiceEnrollmentFlow
 *   await migrateDraftToCloud();
 */

export interface MigrationResult {
  migrated: boolean;
  messageCount: number;
  error?: string;
}

export function useDraftMigration() {
  /**
   * Check if there is a local draft worth migrating.
   */
  const hasLocalDraft = useCallback((): boolean => {
    const result = loadLocal<{ messages: Message[] }>(DRAFT_KEY);
    return !!(result && result.data.messages && result.data.messages.length >= 2);
  }, []);

  /**
   * Migrate localStorage draft to the authenticated user's cloud account.
   * The user must be signed in before calling this (phone enrollment just completed).
   *
   * On success, the local draft is cleared to avoid duplicate saves.
   */
  const migrateDraftToCloud = useCallback(async (): Promise<MigrationResult> => {
    const result = loadLocal<{ messages: Message[] }>(DRAFT_KEY);

    if (!result || !result.data.messages || result.data.messages.length < 2) {
      return { migrated: false, messageCount: 0 };
    }

    const { messages } = result.data;

    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          migrated: false,
          messageCount: messages.length,
          error: data.error || `Upload failed (${response.status})`,
        };
      }

      // Clear local draft now that it's safely in the cloud
      clearWithSync(DRAFT_KEY);

      return { migrated: true, messageCount: messages.length };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Network error during draft migration';
      // Non-fatal: local draft still exists if cloud migration fails
      console.warn('[DraftMigration] Failed to migrate draft:', error);
      return { migrated: false, messageCount: messages.length, error };
    }
  }, []);

  return {
    hasLocalDraft,
    migrateDraftToCloud,
  };
}

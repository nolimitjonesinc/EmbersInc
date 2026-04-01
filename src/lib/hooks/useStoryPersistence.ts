'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { userStyleService } from '@/lib/services/userStyleService';
import { loadConversationDraft } from '@/lib/conversation/draftStorage';

/**
 * Story Persistence Hook
 *
 * Manages saving finalized stories to the API (Supabase for
 * authenticated users, localStorage for anonymous). Also handles
 * draft recovery detection and story count tracking.
 *
 * Extracted from conversation/page.tsx to separate persistence
 * logic from UI/audio concerns.
 */

interface DraftData {
  messages: Message[];
  savedAt: Date;
}

export interface UseStoryPersistenceReturn {
  isSaving: boolean;
  savedStoryId: string | null;
  savedStoryTitle: string | null;
  savedStoriesCount: number;
  conversationSummary: string | null;
  showSessionEnding: boolean;
  /** True if audio upload failed but story text was saved */
  audioUploadFailed: boolean;
  /** Draft recovery state */
  showDraftRecovery: boolean;
  recoveredDraft: DraftData | null;
  /** Non-null if draft recovery failed on mount */
  draftRecoveryError: string | null;
  /** Save story to API or localStorage. Returns true if saved. */
  saveStory: (
    messages: Message[],
    options?: {
      stopSessionRecording?: () => Promise<Blob | null>;
      sessionDuration?: number;
      isSessionRecording?: boolean;
      familyPromptId?: string;
      promptedByName?: string;
      promptedByRelationship?: string;
    }
  ) => Promise<boolean>;
  /** Accept the recovered draft — returns the messages to restore */
  recoverDraft: () => Message[] | null;
  /** Discard the recovered draft */
  discardDraft: () => void;
  /** Reset all save state for a new conversation */
  resetStoryState: () => void;
}

function generateConversationSummary(messages: Message[]): string {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return '';

  const content = userMessages.map(m => m.content).join(' ');
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const summaryParts = sentences.slice(0, 3).map(s => s.trim());

  if (summaryParts.length === 0) return content.slice(0, 200);

  let summary = summaryParts.join('. ');
  if (summary.length > 300) {
    summary = summary.slice(0, 297) + '...';
  }
  if (!summary.endsWith('.') && !summary.endsWith('...')) {
    summary += '.';
  }

  return summary;
}

export function useStoryPersistence(): UseStoryPersistenceReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [savedStoryId, setSavedStoryId] = useState<string | null>(null);
  const [savedStoryTitle, setSavedStoryTitle] = useState<string | null>(null);
  const [savedStoriesCount, setSavedStoriesCount] = useState(0);
  const [conversationSummary, setConversationSummary] = useState<string | null>(null);
  const [showSessionEnding, setShowSessionEnding] = useState(false);
  const [audioUploadFailed, setAudioUploadFailed] = useState(false);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState<DraftData | null>(null);
  const [draftRecoveryError, setDraftRecoveryError] = useState<string | null>(null);

  // Load stories count + check for draft on mount
  useEffect(() => {
    // Fetch stories count
    const fetchStoriesCount = async () => {
      try {
        const response = await fetch('/api/stories');
        if (response.ok) {
          const data = await response.json();
          setSavedStoriesCount(data.stories?.length || 0);
        }
      } catch (err) {
        console.warn('[StoryPersistence] Could not load saved stories count:', err);
      }
    };
    fetchStoriesCount();

    // Check for recovered draft
    try {
      const loadedDraft = loadConversationDraft();
      if (loadedDraft) {
        setRecoveredDraft({
          messages: loadedDraft.draft.messages,
          savedAt: new Date(loadedDraft.draft.savedAt),
        });
        setShowDraftRecovery(true);
      }
    } catch (err) {
      console.warn('[StoryPersistence] Could not parse saved draft:', err);
      // Don't delete the draft — keep it in localStorage for manual recovery
      setDraftRecoveryError('We found a draft but couldn\'t load it. Starting fresh — your previous stories are still safe.');
    }
  }, []);

  const saveStory = useCallback(async (
    messages: Message[],
    options?: {
      stopSessionRecording?: () => Promise<Blob | null>;
      sessionDuration?: number;
      isSessionRecording?: boolean;
      familyPromptId?: string;
      promptedByName?: string;
      promptedByRelationship?: string;
    }
  ): Promise<boolean> => {
    if (messages.length < 2) return false;

    setIsSaving(true);

    try {
      const rawTranscript = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('\n\n');

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rawTranscript,
          messages,
          generateNarrative: true,
          generateTitle: true,
          rawTranscript,
          conversationMessages: messages,
          ...(options?.familyPromptId && { family_prompt_id: options.familyPromptId }),
          ...(options?.promptedByName && { prompted_by_name: options.promptedByName }),
          ...(options?.promptedByRelationship && { prompted_by_relationship: options.promptedByRelationship }),
        }),
      });

      let storyId: string;
      let storyTitle: string | null = null;
      let savedLocally = false;

      if (response.ok) {
        const data = await response.json();
        storyId = data.story.id;
        storyTitle = data.story.title || null;

        // Upload session audio if recording
        if (options?.isSessionRecording && options.stopSessionRecording) {
          try {
            const audioBlob = await options.stopSessionRecording();
            if (audioBlob && audioBlob.size > 0) {
              const formData = new FormData();
              formData.append('audio', audioBlob, 'conversation.webm');
              formData.append('storyId', storyId);
              formData.append('duration', (options.sessionDuration || 0).toString());

              await fetch('/api/audio/upload', {
                method: 'POST',
                body: formData,
              });
            }
          } catch (audioErr) {
            console.error('[StoryPersistence] Failed to upload audio:', audioErr);
            setAudioUploadFailed(true);
          }
        }
      } else if (response.status === 401) {
        savedLocally = true;
        storyId = `local_${Date.now()}`;
        storyTitle = 'Your Story';

        const existingStories = JSON.parse(localStorage.getItem('embers_local_stories') || '[]');
        const localStory = {
          id: storyId,
          title: storyTitle,
          content: rawTranscript,
          messages,
          created_at: new Date().toISOString(),
          userName: localStorage.getItem('embers_user_name') || '',
        };
        existingStories.unshift(localStory);
        localStorage.setItem('embers_local_stories', JSON.stringify(existingStories));
      } else {
        throw new Error('Failed to save');
      }

      setSavedStoryId(storyId);
      setSavedStoryTitle(storyTitle);
      setSavedStoriesCount(prev => prev + 1);

      const summary = generateConversationSummary(messages);
      setConversationSummary(
        savedLocally
          ? summary + ' (Saved to this device. Sign in to back up to the cloud.)'
          : summary
      );

      // Record in session data
      const style = userStyleService.getStyle();
      userStyleService.recordStory(Object.keys(style.commonThemes));
      userStyleService.recordLastStory({
        title: storyTitle,
        summary,
        topics: Object.keys(style.commonThemes),
      });

      setShowSessionEnding(true);
      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to save story.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const recoverDraft = useCallback((): Message[] | null => {
    if (!recoveredDraft) return null;
    setShowDraftRecovery(false);
    return recoveredDraft.messages;
  }, [recoveredDraft]);

  const discardDraft = useCallback(() => {
    setShowDraftRecovery(false);
    setRecoveredDraft(null);
  }, []);

  const resetStoryState = useCallback(() => {
    setSavedStoryId(null);
    setSavedStoryTitle(null);
    setConversationSummary(null);
    setShowSessionEnding(false);
  }, []);

  return {
    isSaving,
    savedStoryId,
    savedStoryTitle,
    savedStoriesCount,
    conversationSummary,
    showSessionEnding,
    audioUploadFailed,
    showDraftRecovery,
    recoveredDraft,
    draftRecoveryError,
    saveStory,
    recoverDraft,
    discardDraft,
    resetStoryState,
  };
}

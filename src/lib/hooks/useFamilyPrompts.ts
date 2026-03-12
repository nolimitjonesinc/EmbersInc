'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';

interface FamilyPromptData {
  id: string;
  submitterName: string;
  submitterRelationship: string;
  content: string;
  type: 'question' | 'photo';
  photoUrl?: string;
}

interface UseFamilyPromptsReturn {
  /** The pending family prompt for this session (null if none) */
  pendingPrompt: FamilyPromptData | null;
  /** Whether we're loading the prompt */
  isLoading: boolean;
  /** User accepted the prompt — conversation will focus on it */
  acceptPrompt: () => void;
  /** User wants to skip this prompt for now */
  skipPrompt: () => Promise<void>;
  /** User doesn't want to answer this prompt ever */
  declinePrompt: () => Promise<void>;
  /** Whether the user accepted a family prompt this session */
  isAnsweringFamilyPrompt: boolean;
  /** Call when the story is saved to link it to the prompt */
  markAnswered: (storyId: string) => Promise<void>;
  /** The accepted prompt data (for passing to story save) */
  acceptedPrompt: FamilyPromptData | null;
}

export function useFamilyPrompts(): UseFamilyPromptsReturn {
  const { user, isLoading: authLoading } = useAuth();

  const [pendingPrompt, setPendingPrompt] = useState<FamilyPromptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnsweringFamilyPrompt, setIsAnsweringFamilyPrompt] = useState(false);
  const [acceptedPrompt, setAcceptedPrompt] = useState<FamilyPromptData | null>(null);

  // Only fetch once per session
  const hasFetchedRef = useRef(false);

  // Fetch pending prompt on mount (if authenticated)
  useEffect(() => {
    if (hasFetchedRef.current || authLoading) return;
    if (!user) {
      // Not authenticated — no family prompts
      hasFetchedRef.current = true;
      return;
    }

    hasFetchedRef.current = true;
    setIsLoading(true);

    fetch('/api/family/prompts')
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (data.prompt) {
          setPendingPrompt({
            id: data.prompt.id,
            submitterName: data.prompt.submitter_name,
            submitterRelationship: data.prompt.submitter_relationship,
            content: data.prompt.content,
            type: data.prompt.type || 'question',
            photoUrl: data.prompt.photo_url || undefined,
          });
        }
      })
      .catch((err) => {
        // Fail silently — conversation proceeds without family prompts
        console.warn('[FamilyPrompts] Failed to fetch prompt:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user, authLoading]);

  const acceptPrompt = useCallback(() => {
    if (!pendingPrompt) return;
    setIsAnsweringFamilyPrompt(true);
    setAcceptedPrompt(pendingPrompt);
    setPendingPrompt(null);
  }, [pendingPrompt]);

  const skipPrompt = useCallback(async () => {
    if (!pendingPrompt) return;
    try {
      const res = await fetch(`/api/family/prompts/${pendingPrompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'skipped' }),
      });
      if (res.ok) {
        setPendingPrompt(null);
      } else {
        console.warn('[FamilyPrompts] Failed to skip prompt, will retry next session');
      }
    } catch (err) {
      console.warn('[FamilyPrompts] Network error skipping prompt:', err);
    }
  }, [pendingPrompt]);

  const declinePrompt = useCallback(async () => {
    if (!pendingPrompt) return;
    try {
      const res = await fetch(`/api/family/prompts/${pendingPrompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'declined' }),
      });
      if (res.ok) {
        setPendingPrompt(null);
      } else {
        console.warn('[FamilyPrompts] Failed to decline prompt, will retry next session');
      }
    } catch (err) {
      console.warn('[FamilyPrompts] Network error declining prompt:', err);
    }
  }, [pendingPrompt]);

  const markAnswered = useCallback(async (storyId: string) => {
    if (!acceptedPrompt) return;
    try {
      await fetch(`/api/family/prompts/${acceptedPrompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'answered', storyId }),
      });
    } catch (err) {
      // Server-side stories API already handles this link, so this is best-effort
      console.warn('[FamilyPrompts] Client-side markAnswered failed (server handles it):', err);
    }
    // Always clear state since the story is saved regardless
    setIsAnsweringFamilyPrompt(false);
    setAcceptedPrompt(null);
  }, [acceptedPrompt]);

  return {
    pendingPrompt,
    isLoading,
    acceptPrompt,
    skipPrompt,
    declinePrompt,
    isAnsweringFamilyPrompt,
    markAnswered,
    acceptedPrompt,
  };
}

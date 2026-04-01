'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { interestService } from '@/lib/services/interestService';
import { userStyleService } from '@/lib/services/userStyleService';
import { ConversationMemory } from '@/lib/memory/ConversationMemory';
import { extractMemories } from '@/lib/memory/memoryExtractor';
import { getPromptsForInterests, getRandomWarmPrompt } from '@/lib/prompts/promptSelector';
import { ERROR_MESSAGES } from '@/lib/errors/messages';
import { normalizeUserName } from '@/lib/utils/name';

/**
 * Conversation Hook
 *
 * Manages the core conversation state: messages, API calls,
 * memory extraction, user context, and name detection.
 *
 * Extracted from conversation/page.tsx to separate message
 * management from UI/audio/persistence concerns.
 */

interface UserContext {
  isReturningUser: boolean;
  frequentlyMentionedPeople: string[];
  preferredTimeframes: string[];
  commonThemes: string[];
  lastSessionSummary?: string;
  lastStoryTitle?: string;
}

export interface UseConversationReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isProcessing: boolean;
  userName: string;
  error: string | null;
  setError: (err: string | null) => void;
  selectedInterests: string[];
  userContext: UserContext;
  starterPrompt: string;
  conversationMemory: ConversationMemory;
  /**
   * Send a user message and get an AI response.
   * Returns the AI response text, or null if it failed.
   * Does NOT play audio — caller handles that.
   */
  sendMessage: (content: string) => Promise<string | null>;
  /** Reset everything for a new conversation */
  resetConversation: () => void;
}

export function useConversation(): UseConversationReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [userContext, setUserContext] = useState<UserContext>({
    isReturningUser: false,
    frequentlyMentionedPeople: [],
    preferredTimeframes: [],
    commonThemes: [],
  });
  const [starterPrompt, setStarterPrompt] = useState('');
  const [preferredPersona, setPreferredPersona] = useState('');

  const conversationMemoryRef = useRef(new ConversationMemory());

  // Load user data on mount
  useEffect(() => {
    const storedName = localStorage.getItem('embers_user_name');
    if (storedName) {
      const normalizedName = normalizeUserName(storedName) || storedName.trim();
      setUserName(normalizedName);
      localStorage.setItem('embers_user_name', normalizedName);
    }

    const storedPersona = localStorage.getItem('embers_preferred_persona');
    if (storedPersona) setPreferredPersona(storedPersona);

    const interests = interestService.get();
    setSelectedInterests(interests);

    const context = userStyleService.getContext();
    setUserContext(context);

    // Generate personalized starter prompt
    let prompt: string;
    if (interests.length > 0) {
      const matchingPrompts = getPromptsForInterests(interests);
      const randomPrompt = matchingPrompts[Math.floor(Math.random() * matchingPrompts.length)];
      prompt = randomPrompt.question;
    } else {
      prompt = getRandomWarmPrompt().question;
    }
    setStarterPrompt(prompt);
  }, []);

  const detectUserName = useCallback((userMessage: string, previousAssistantMessage?: string): string | null => {
    const trimmedMessage = userMessage.trim();
    const assistantAskedForName = previousAssistantMessage
      ? /(what should i call you|what's your name|what is your name|your name|call you)/i.test(previousAssistantMessage)
      : false;

    if (assistantAskedForName || /^(?:hi[, ]+)?(?:my name is|name is|i am|i'm|im|call me|it's|it is|this is)\b/i.test(trimmedMessage)) {
      return normalizeUserName(trimmedMessage);
    }

    return null;
  }, []);

  // Name detection from conversation
  useEffect(() => {
    if (messages.length < 2) return;

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const prevMsg = messages[messages.length - 2];

    if (lastUserMessage?.role === 'user') {
      const detectedName = detectUserName(lastUserMessage.content, prevMsg?.role === 'assistant' ? prevMsg.content : undefined);
      if (detectedName) {
        setUserName(detectedName);
        localStorage.setItem('embers_user_name', detectedName);
      }
    }
  }, [messages, detectUserName]);

  const sendMessage = useCallback(async (content: string): Promise<string | null> => {
    if (!content.trim() || isProcessing) return null;

    setError(null);
    setIsProcessing(true);

    // Process through style analyzer
    const updatedStyle = userStyleService.processMessage(content);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userName,
          persona: preferredPersona || undefined,
          isFirstMessage: messages.filter(m => m.role === 'user').length === 0,
          selectedInterests,
          isReturningUser: userContext.isReturningUser,
          frequentlyMentionedPeople: updatedStyle.frequentlyMentionedPeople,
          preferredTimeframes: updatedStyle.preferredTimeframes,
          commonThemes: Object.keys(updatedStyle.commonThemes).slice(0, 5),
          memoryContext: conversationMemoryRef.current.getMemoryContext(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const statusMessage = errorData?.error || `Server error (${response.status})`;
        throw new Error(statusMessage);
      }

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        },
      ]);

      // Extract memories from this exchange
      extractMemories(content, data.message, conversationMemoryRef.current);

      return data.message;
    } catch (err) {
      console.error('[Chat] Send message failed:', err);
      if (err instanceof TypeError) {
        // Network/fetch failure (no response at all)
        setError(ERROR_MESSAGES.network);
      } else if (err instanceof Error && err.message.includes('429')) {
        setError(ERROR_MESSAGES.tooManyRequests);
      } else {
        setError(ERROR_MESSAGES.generic);
      }
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, messages, userName, preferredPersona, selectedInterests, userContext.isReturningUser]);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    conversationMemoryRef.current = new ConversationMemory();

    // Generate a new starter prompt
    const interests = interestService.get();
    let prompt: string;
    if (interests.length > 0) {
      const matchingPrompts = getPromptsForInterests(interests);
      const randomPrompt = matchingPrompts[Math.floor(Math.random() * matchingPrompts.length)];
      prompt = randomPrompt.question;
    } else {
      prompt = getRandomWarmPrompt().question;
    }
    setStarterPrompt(prompt);
  }, []);

  return {
    messages,
    setMessages,
    isProcessing,
    userName,
    error,
    setError,
    selectedInterests,
    userContext,
    starterPrompt,
    conversationMemory: conversationMemoryRef.current,
    sendMessage,
    resetConversation,
  };
}

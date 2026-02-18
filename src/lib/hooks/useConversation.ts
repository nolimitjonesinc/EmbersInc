'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { interestService } from '@/lib/services/interestService';
import { userStyleService } from '@/lib/services/userStyleService';
import { ConversationMemory } from '@/lib/memory/ConversationMemory';
import { extractMemories } from '@/lib/memory/memoryExtractor';
import { getPromptsForInterests, getRandomWarmPrompt } from '@/lib/prompts/promptSelector';

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
    if (storedName) setUserName(storedName);

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

  // Name detection from conversation
  useEffect(() => {
    if (messages.length < 2) return;

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const prevMsg = messages[messages.length - 2];

    if (
      prevMsg?.role === 'assistant' &&
      prevMsg.content.toLowerCase().includes('name') &&
      lastUserMessage?.role === 'user'
    ) {
      const match =
        lastUserMessage.content.match(/(?:i'm|i am|my name is|call me)\s+(\w+)/i) ||
        lastUserMessage.content.match(/^(\w+)$/i);

      if (match?.[1]) {
        const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        setUserName(name);
        localStorage.setItem('embers_user_name', name);
      }
    }
  }, [messages]);

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

      if (!response.ok) throw new Error('Failed');

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
    } catch {
      setError('Something went wrong. Please try again.');
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

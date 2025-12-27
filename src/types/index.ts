// Embers Web - Type Definitions

// Life Book Chapter Types
export type ChapterType =
  | 'who-i-am'
  | 'where-i-come-from'
  | 'what-ive-loved'
  | 'whats-been-hard'
  | 'what-ive-learned'
  | 'what-im-still-figuring-out'
  | 'what-i-want-you-to-know';

export interface Chapter {
  id: ChapterType;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  prompts: string[];
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  voiceEnabled: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  autoPlayResponses: boolean;
}

// Story Types
export interface Story {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary?: string;
  audioUrl?: string;
  chapter: ChapterType;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  familyGroupId?: string;
}

// Conversation Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  storyId?: string;
  messages: Message[];
  chapter?: ChapterType;
  createdAt: Date;
  isActive: boolean;
}

// Family Types
export interface FamilyGroup {
  id: string;
  name: string;
  ownerId: string;
  members: FamilyMember[];
  createdAt: Date;
}

export interface FamilyMember {
  id: string;
  userId?: string;
  email: string;
  name?: string;
  role: 'admin' | 'member' | 'viewer';
  relationship?: string;
  joinedAt?: Date;
  invitedAt: Date;
}

// Voice/Speech Types
export interface SpeechState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
}

// API Response Types
export interface ChatResponse {
  message: string;
  suggestedTitle?: string;
  suggestedChapter?: ChapterType;
  shouldEndConversation?: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: string;
}

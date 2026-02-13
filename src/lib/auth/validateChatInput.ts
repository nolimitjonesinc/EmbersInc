/**
 * Input validation for the chat API route.
 *
 * Prevents prompt injection (system role messages),
 * caps message count and content length to control costs.
 */

import { Message } from '@/types'

const MAX_MESSAGES = 50
const MAX_MESSAGE_LENGTH = 5000
const VALID_ROLES = new Set(['user', 'assistant'])

interface ValidationResult {
  valid: boolean
  error?: string
  sanitizedMessages?: Message[]
}

export function validateChatInput(messages: unknown): ValidationResult {
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array.' }
  }

  if (messages.length === 0) {
    return { valid: false, error: 'At least one message is required.' }
  }

  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: 'Too many messages in conversation.' }
  }

  const sanitized: Message[] = []

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: 'Invalid message format.' }
    }

    // Block system role injection
    if (!VALID_ROLES.has(msg.role)) {
      return { valid: false, error: 'Invalid message role.' }
    }

    if (typeof msg.content !== 'string') {
      return { valid: false, error: 'Message content must be text.' }
    }

    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: 'Message is too long.' }
    }

    sanitized.push({
      id: typeof msg.id === 'string' ? msg.id : crypto.randomUUID(),
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(),
    })
  }

  return { valid: true, sanitizedMessages: sanitized }
}

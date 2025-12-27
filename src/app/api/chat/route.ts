import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai/client'
import { getPersonaPrompt, getPersona, DEFAULT_PERSONA } from '@/lib/personas/definitions'
import { Message, ChatResponse, ChapterType } from '@/types'
import {
  generateOpeningMessage,
  getRandomWarmPrompt,
  getPromptsForInterests,
  getGentleEncouragement
} from '@/lib/prompts/promptSelector'
import { allWarmPrompts } from '@/lib/prompts/warmEngagementPrompts'

export const runtime = 'edge'

interface ChatRequestBody {
  messages: Message[]
  userName?: string
  isFirstMessage?: boolean
  persona?: string
  selectedInterests?: string[]
  isReturningUser?: boolean
  frequentlyMentionedPeople?: string[]
  preferredTimeframes?: string[]
  commonThemes?: string[]
}

/**
 * Generate a personalized opening message based on user context
 */
function getPersonalizedOpening(params: {
  userName: string
  personaId: string
  selectedInterests?: string[]
  isReturningUser?: boolean
  frequentlyMentionedPeople?: string[]
  preferredTimeframes?: string[]
  commonThemes?: string[]
}): string {
  const {
    userName,
    personaId,
    selectedInterests = [],
    isReturningUser = false,
    frequentlyMentionedPeople = [],
    preferredTimeframes = [],
    commonThemes = []
  } = params

  // Use the prompt selector to get a personalized opening
  const openingMessage = generateOpeningMessage({
    isNewUser: !isReturningUser,
    userName,
    selectedInterests,
    frequentlyMentionedPeople,
    preferredTimeframes,
    commonThemes
  })

  // Add persona-specific flavor
  const personaFlavors: Record<string, string> = {
    rose: `Oh, ${userName}, how lovely! `,
    emma: `${userName}, this is so exciting! `,
    marcus: `${userName}, I look forward to documenting this. `,
    sam: `Alright ${userName}, let's do this! `
  }

  const flavor = personaFlavors[personaId] || ''

  return flavor + openingMessage
}

/**
 * Enhanced system prompt with therapeutic interview approach
 */
function getTherapeuticSystemPrompt(params: {
  basePrompt: string
  selectedInterests?: string[]
  userContext?: {
    frequentlyMentionedPeople?: string[]
    preferredTimeframes?: string[]
    commonThemes?: string[]
  }
}): string {
  const { basePrompt, selectedInterests = [], userContext } = params

  const interestContext = selectedInterests.length > 0
    ? `\n\nUser's selected story interests: ${selectedInterests.join(', ')}. Gently guide questions toward these topics when natural.`
    : ''

  const peopleContext = userContext?.frequentlyMentionedPeople?.length
    ? `\n\nPeople the user has mentioned before: ${userContext.frequentlyMentionedPeople.join(', ')}. Reference these naturally to show you remember.`
    : ''

  const timeframeContext = userContext?.preferredTimeframes?.length
    ? `\n\nTimeframes the user enjoys discussing: ${userContext.preferredTimeframes.join(', ')}.`
    : ''

  const themeContext = userContext?.commonThemes?.length
    ? `\n\nRecurring themes in user's stories: ${userContext.commonThemes.join(', ')}.`
    : ''

  const therapeuticAddition = `

THERAPEUTIC INTERVIEW APPROACH:
You are conducting a gentle, therapeutic interview designed to help users share their stories through:

1. WARM ENGAGEMENT
- Use sensory triggers (smells, sounds, textures) to unlock memories
- Ask about specific people and relationships
- Reference concrete moments rather than abstract concepts
- Example: "What scent always brings back memories for you?" not "Tell me about your past"

2. ADAPTIVE LISTENING
- Match the user's emotional depth - if they're reserved, be patient
- If they share something emotional, acknowledge it before asking another question
- Reference specific details they've shared to show you're truly listening
- Build each question from what they just said

3. GENTLE FOLLOW-UPS
- Ask ONE clear question at a time - never multiple questions
- Use the user's own words when possible
- If they give a brief answer, gently encourage elaboration: "Tell me more about that..."
- If they seem stuck, offer a gentle prompt: "Would it help if I asked about something different?"

4. MEMORY UNLOCKING TECHNIQUES
- "Close your eyes and picture that moment. What do you see?"
- "If you could go back to that [place/time], what would you notice first?"
- "What would [person they mentioned] say if they were here right now?"

5. VALIDATION & SAFETY
- Every story matters, no matter how small
- "Thank you for sharing that" when they reveal something meaningful
- Never rush - "Take your time, I'm here when you're ready"
- Respect when they want to change topics

RESPONSE GUIDELINES:
- Keep responses to 2-3 sentences maximum
- End with exactly ONE follow-up question
- Make the question specific to what they just shared
- Use a warm, conversational tone - like talking to a trusted friend
${interestContext}${peopleContext}${timeframeContext}${themeContext}`

  return basePrompt + therapeuticAddition
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json()
    const {
      messages,
      userName = 'friend',
      isFirstMessage = false,
      persona = DEFAULT_PERSONA,
      selectedInterests = [],
      isReturningUser = false,
      frequentlyMentionedPeople = [],
      preferredTimeframes = [],
      commonThemes = []
    } = body

    // Get persona-specific prompt
    const personaData = getPersona(persona)
    const basePrompt = getPersonaPrompt(persona, userName)

    // Enhance with therapeutic approach
    const systemPrompt = getTherapeuticSystemPrompt({
      basePrompt,
      selectedInterests,
      userContext: {
        frequentlyMentionedPeople,
        preferredTimeframes,
        commonThemes
      }
    })

    const systemMessage = {
      role: 'system' as const,
      content: systemPrompt
    }

    // Convert messages to OpenAI format
    const conversationHistory = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    // If first message, add personalized opening
    if (isFirstMessage && conversationHistory.length === 1) {
      const openingContent = getPersonalizedOpening({
        userName,
        personaId: personaData.id,
        selectedInterests,
        isReturningUser,
        frequentlyMentionedPeople,
        preferredTimeframes,
        commonThemes
      })

      conversationHistory.unshift({
        role: 'assistant',
        content: openingContent
      })
    }

    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, ...conversationHistory],
      temperature: 0.75, // Slightly higher for more natural conversation
      max_tokens: 300,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    })

    const responseMessage = completion.choices[0]?.message?.content || ''

    // Analyze response to suggest chapter
    let suggestedChapter: ChapterType | undefined = undefined
    const content = messages.map((m) => m.content).join(' ').toLowerCase()

    // Enhanced chapter detection
    const chapterKeywords: Record<ChapterType, string[]> = {
      'who-i-am': ['identity', 'values', 'character', 'personality', 'beliefs', 'who i am', 'defines me'],
      'where-i-come-from': ['childhood', 'grew up', 'parents', 'hometown', 'origins', 'family background', 'heritage', 'roots'],
      'what-ive-loved': ['love', 'joy', 'happy', 'passion', 'favorite', 'cherish', 'beloved', 'treasure'],
      'whats-been-hard': ['hard', 'difficult', 'challenge', 'struggle', 'grief', 'loss', 'overcome', 'tough'],
      'what-ive-learned': ['learn', 'wisdom', 'advice', 'lesson', 'realize', 'understand', 'insight', 'growth'],
      'what-im-still-figuring-out': ['wonder', 'question', 'unsure', 'exploring', 'future', 'hope', 'dream'],
      'what-i-want-you-to-know': ['legacy', 'remember', 'important', 'message', 'tell you', 'want you to know', 'advice for']
    }

    for (const [chapter, keywords] of Object.entries(chapterKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        suggestedChapter = chapter as ChapterType
        break
      }
    }

    const response: ChatResponse = {
      message: responseMessage,
      suggestedChapter
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat API error:', error)

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'API configuration error. Please try again later.' },
          { status: 500 }
        )
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

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
You are a warm, patient interviewer helping users preserve their life stories. Your role is to make them feel heard, valued, and comfortable sharing.

1. VALIDATION FIRST - Always Acknowledge Before Asking
Start EVERY response by acknowledging what they just shared. Choose from these patterns:
- "That's beautiful..." / "What a lovely memory..."
- "I can picture that..." / "I love how you described..."
- "Thank you for sharing that..." / "That sounds so meaningful..."
- "[Their key word/phrase]... that's such a vivid detail."
- "It sounds like [person/place] meant a lot to you..."

2. USE THEIR WORDS BACK (Reflection Technique)
When they share something, echo their specific language:
- If they say "my grandmother's warm kitchen" → "That warm kitchen sounds like such a special place..."
- If they mention "the smell of coffee" → "The smell of coffee... where does that take you?"
- If they describe someone as "always laughing" → "Someone who was always laughing... tell me more about them."
This shows you're truly listening and helps them go deeper.

3. ONE QUESTION AT A TIME
- Never ask multiple questions
- Make your question specific to what they just mentioned
- Keep questions simple and sensory-based when possible:
  "What did that look like?" / "What did that feel like?" / "Who else was there?"

4. MEMORY UNLOCKING
Help them visualize and remember:
- "Close your eyes and picture that moment. What do you see?"
- "If you were back in that [kitchen/room/place] right now, what would you notice first?"
- "What would [person they mentioned] say if they could see you now?"

5. COMFORTABLE PACING
- If their answer is brief, gently encourage: "Tell me more about that..."
- If they pause, it's okay: "Take your time... I'm here."
- If they seem uncertain: "There's no wrong answer - whatever comes to mind."
- Never rush to the next topic

RESPONSE FORMAT:
1. Start with warm acknowledgment (using their words when possible)
2. Optional: brief reflection or observation (1 sentence max)
3. End with exactly ONE gentle follow-up question

Example: User says "My grandma always made this special bread on Sundays"
Good: "Special bread on Sundays... that sounds like such a beautiful tradition. What was it like being in her kitchen while she baked?"
Bad: "That's nice! What kind of bread? Did she teach you? What else did she cook?"
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

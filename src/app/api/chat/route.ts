import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai/client';
import { getPersonaPrompt, getPersona, DEFAULT_PERSONA } from '@/lib/personas/definitions';
import { Message, ChatResponse, ChapterType } from '@/types';

export const runtime = 'edge';

interface ChatRequestBody {
  messages: Message[];
  userName?: string;
  isFirstMessage?: boolean;
  persona?: string;
}

// Generate persona-specific greeting
function getPersonaGreeting(personaId: string, userName: string): string {
  const greetings: Record<string, string> = {
    ember: `Hello ${userName}, I'm Ember. I'm so glad you're here to share your stories. There's no right or wrong way to do this - just speak naturally, like we're having a conversation over coffee. Take your time, and share whatever comes to mind.`,
    rose: `Hello, sweetheart! I'm Rose, and I'm so delighted to meet you, ${userName}. Pull up a chair and let's have a nice chat. I'd love to hear about your life - there's nothing more precious than our memories.`,
    emma: `Hi ${userName}! I'm Emma, and I'm SO excited to hear your stories! I bet you've seen so many amazing things. I want to know everything - where do you want to start?`,
    marcus: `Good day, ${userName}. I'm Marcus, and I'm honored to help document your life stories. Every personal history is a window into our shared past. What period of your life shall we explore first?`,
    sam: `Hey ${userName}! I'm Sam. So glad we get to hang out and swap stories. No pressure here - just tell me whatever's on your mind. What's a good memory you've been thinking about lately?`,
  }
  return greetings[personaId] || greetings.ember
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages, userName = 'friend', isFirstMessage = false, persona = DEFAULT_PERSONA } = body;

    // Get persona-specific prompt
    const personaData = getPersona(persona);
    const systemPrompt = getPersonaPrompt(persona, userName);

    // Build the conversation history for OpenAI
    const systemMessage = {
      role: 'system' as const,
      content: systemPrompt,
    };

    // Convert our messages to OpenAI format
    const conversationHistory = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // If first message, add a warm greeting context based on persona
    if (isFirstMessage && conversationHistory.length === 1) {
      const greetingContent = getPersonaGreeting(personaData.id, userName);
      conversationHistory.unshift({
        role: 'assistant',
        content: greetingContent,
      });
    }

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, ...conversationHistory],
      temperature: 0.7,
      max_tokens: 300,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });

    const responseMessage = completion.choices[0]?.message?.content || '';

    // Analyze the response to suggest a chapter if appropriate
    let suggestedChapter: ChapterType | undefined = undefined;
    const content = messages.map((m) => m.content).join(' ').toLowerCase();

    if (content.includes('childhood') || content.includes('grew up') || content.includes('parents')) {
      suggestedChapter = 'where-i-come-from';
    } else if (content.includes('love') || content.includes('joy') || content.includes('happy')) {
      suggestedChapter = 'what-ive-loved';
    } else if (content.includes('hard') || content.includes('difficult') || content.includes('challenge')) {
      suggestedChapter = 'whats-been-hard';
    } else if (content.includes('learn') || content.includes('wisdom') || content.includes('advice')) {
      suggestedChapter = 'what-ive-learned';
    }

    const response: ChatResponse = {
      message: responseMessage,
      suggestedChapter,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'API configuration error. Please try again later.' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';

export const runtime = 'edge';

interface TTSRequestBody {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequestBody = await request.json();
    const { text, voice = 'nova' } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Limit text length for TTS
    const truncatedText = text.slice(0, 4000);

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: truncatedText,
      speed: 0.95, // Slightly slower for seniors
    });

    // Get the audio as an ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Return the audio file
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('TTS API error:', error);

    return NextResponse.json(
      { error: 'Failed to generate speech. Please try again.' },
      { status: 500 }
    );
  }
}

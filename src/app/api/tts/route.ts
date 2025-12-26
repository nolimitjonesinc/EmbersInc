import { NextRequest, NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand, Engine, OutputFormat, VoiceId } from '@aws-sdk/client-polly';
import { getOpenAIClient } from '@/lib/openai/client';

// Use Node.js runtime for AWS SDK compatibility
export const runtime = 'nodejs';

interface TTSRequestBody {
  text: string;
  provider?: 'polly' | 'openai';
}

// Initialize Polly client lazily
let pollyClient: PollyClient | null = null;

function getPollyClient(): PollyClient | null {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return null;
  }

  if (!pollyClient) {
    pollyClient = new PollyClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return pollyClient;
}

// Generate speech using Amazon Polly
async function generateWithPolly(text: string): Promise<ArrayBuffer> {
  const client = getPollyClient();
  if (!client) {
    throw new Error('Polly not configured');
  }

  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: OutputFormat.MP3,
    VoiceId: VoiceId.Joanna, // Warm, natural female voice (similar to OpenAI's nova)
    Engine: Engine.NEURAL, // Neural engine for best quality
    SampleRate: '24000',
  });

  const response = await client.send(command);

  if (!response.AudioStream) {
    throw new Error('No audio stream returned from Polly');
  }

  // Convert stream to ArrayBuffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.AudioStream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

// Generate speech using OpenAI TTS (fallback)
async function generateWithOpenAI(text: string): Promise<ArrayBuffer> {
  const openai = getOpenAIClient();
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
    speed: 0.95, // Slightly slower for seniors
  });

  return response.arrayBuffer();
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequestBody = await request.json();
    const { text, provider } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Limit text length for TTS
    const truncatedText = text.slice(0, 4000);

    let audioBuffer: ArrayBuffer;
    let usedProvider: string;

    // Try Amazon Polly first (unless OpenAI specifically requested)
    if (provider !== 'openai' && getPollyClient()) {
      try {
        audioBuffer = await generateWithPolly(truncatedText);
        usedProvider = 'polly';
      } catch (pollyError) {
        console.error('Polly TTS failed, falling back to OpenAI:', pollyError);
        // Fall back to OpenAI
        audioBuffer = await generateWithOpenAI(truncatedText);
        usedProvider = 'openai';
      }
    } else {
      // Use OpenAI directly
      audioBuffer = await generateWithOpenAI(truncatedText);
      usedProvider = 'openai';
    }

    // Return the audio file
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'X-TTS-Provider': usedProvider, // For debugging
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

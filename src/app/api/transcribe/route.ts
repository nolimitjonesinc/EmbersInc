import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai/client';
import { softAuth } from '@/lib/auth/getAuthContext';

export const runtime = 'nodejs';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB (Whisper API limit)
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/mp4',
  'audio/wav', 'audio/ogg', 'audio/flac', 'audio/x-m4a',
]);

export async function POST(request: NextRequest) {
  try {
    // Auth + rate limiting (allows anonymous but rate-limits harder)
    const authResult = await softAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // File size validation
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: 'Audio file is too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // MIME type validation (permissive — some browsers report non-standard types)
    if (audioFile.type && !ALLOWED_AUDIO_TYPES.has(audioFile.type)) {
      console.warn(`[Transcribe] Unexpected audio MIME type: ${audioFile.type}`);
    }

    const openai = getOpenAIClient();

    // Use Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });

    return NextResponse.json({
      text: transcription,
      success: true,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio. Please try again.' },
      { status: 500 }
    );
  }
}

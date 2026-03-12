import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface AudioUploadResponse {
  url: string
  path: string
  duration?: number
}

// POST /api/audio/upload - Upload audio recording to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const storyId = formData.get('storyId') as string | null
    const duration = formData.get('duration') as string | null

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    // File size validation
    const MAX_AUDIO_SIZE = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: 'Audio file is too large. Maximum size is 25MB.' },
        { status: 413 }
      )
    }

    // MIME type validation
    const validAudioTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a']
    if (!validAudioTypes.includes(audioFile.type) && !audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an audio file.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = audioFile.name.split('.').pop() || 'webm'
    const filename = `${timestamp}.${extension}`
    const path = `${user.id}/${filename}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('embers-audio')
      .upload(path, audioFile, {
        contentType: audioFile.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Audio upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload audio' },
        { status: 500 }
      )
    }

    // Get signed URL for private bucket (7 days, refresh as needed)
    const { data: urlData } = await supabase.storage
      .from('embers-audio')
      .createSignedUrl(path, 60 * 60 * 24 * 7) // 7 day expiry

    const audioUrl = urlData?.signedUrl || ''

    // If storyId provided, update the story with this audio
    if (storyId) {
      // Get existing audio recordings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: story } = await (supabase as any)
        .from('embers_stories')
        .select('audio_recordings')
        .eq('id', storyId)
        .eq('user_id', user.id)
        .single()

      const existingRecordings = (story?.audio_recordings as AudioUploadResponse[]) || []

      const newRecording = {
        url: audioUrl,
        path: uploadData.path,
        duration: duration ? parseFloat(duration) : undefined,
        timestamp: new Date().toISOString()
      }

      // Update story with new audio recording
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('embers_stories')
        .update({
          audio_recordings: [...existingRecordings, newRecording],
          audio_url: audioUrl // Also update the primary audio_url field
        })
        .eq('id', storyId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      success: true,
      url: audioUrl,
      path: uploadData.path,
      duration: duration ? parseFloat(duration) : undefined
    })
  } catch (error) {
    console.error('Audio upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

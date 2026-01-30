'use client';

import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderOptions {
  onTranscriptionComplete?: (text: string) => void;
  onError?: (error: string) => void;
}

interface AudioRecorderState {
  isRecording: boolean;
  isTranscribing: boolean;
  duration: number;
  error: string | null;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { onTranscriptionComplete, onError } = options;

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isTranscribing: false,
    duration: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Determine best supported format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        const errorMsg = 'Recording failed. Please try again.';
        setState(prev => ({ ...prev, error: errorMsg, isRecording: false }));
        onError?.(errorMsg);
        clearTimer();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      // Start duration timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState(prev => ({ ...prev, duration: elapsed }));
      }, 1000);

      setState(prev => ({ ...prev, isRecording: true, duration: 0 }));
    } catch (err) {
      const errorMsg = err instanceof Error && err.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone access to record.'
        : 'Could not start recording. Please check your microphone.';
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
    }
  }, [onError, clearTimer]);

  const stopRecording = useCallback(async () => {
    clearTimer();

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    setState(prev => ({ ...prev, isRecording: false, isTranscribing: true }));

    // Stop the media recorder
    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });

        // Send to transcription API
        try {
          const formData = new FormData();
          // Whisper expects specific formats, convert to proper file
          const audioFile = new File([audioBlob], 'recording.webm', {
            type: audioBlob.type,
          });
          formData.append('audio', audioFile);

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Transcription failed');
          }

          const data = await response.json();

          if (data.text && data.text.trim()) {
            onTranscriptionComplete?.(data.text.trim());
          }

          setState(prev => ({ ...prev, isTranscribing: false }));
        } catch (err) {
          const errorMsg = 'Could not transcribe audio. Please try again.';
          setState(prev => ({ ...prev, error: errorMsg, isTranscribing: false }));
          onError?.(errorMsg);
        }

        resolve();
      };

      mediaRecorder.stop();
    });
  }, [onTranscriptionComplete, onError, clearTimer]);

  const cancelRecording = useCallback(() => {
    clearTimer();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    setState(prev => ({ ...prev, isRecording: false, isTranscribing: false, duration: 0 }));
  }, [clearTimer]);

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...state,
    formattedDuration: formatDuration(state.duration),
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

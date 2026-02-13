'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FlameButton } from '@/components/conversation/FlameButton'
import { useVoiceCommands } from '@/lib/hooks/useVoiceCommands'

/**
 * Voice-First Conversational Onboarding
 *
 * Simple flow:
 * 1. Tap Embers to begin (unlocks audio)
 * 2. Embers introduces herself and what the app is about
 * 3. Embers asks for name
 * 4. Embers confirms name
 * 5. Ready to share first story
 *
 * No interests selection - Embers uses sensible defaults.
 * No login required - stories save locally first.
 */

type Phase = 'tap-to-start' | 'introduction' | 'ask-name' | 'confirm-name' | 'ready' | 'starting'

export default function OnboardingPage() {
  const router = useRouter()

  // Conversation state
  const [phase, setPhase] = useState<Phase>('tap-to-start')
  const [userName, setUserName] = useState('')
  const [typedName, setTypedName] = useState('')

  // Embers' voice state
  const [isEmberSpeaking, setIsEmberSpeaking] = useState(false)
  const [emberText, setEmberText] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isSpeakingRef = useRef(false) // Ref-based guard (doesn't go stale in closures)
  const hasStartedRef = useRef(false)
  const manualStopRef = useRef(false)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Voice recognition
  const {
    isListening,
    isSupported: isVoiceSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    parseSpokenName,
    isAffirmative,
    isNegative,
  } = useVoiceCommands({
    continuous: true,
    stopOnCommand: false,
    enabled: true,
  })

  // ============================================
  // EMBER'S DIALOGUE
  // ============================================

  const DIALOGUE = {
    introduction: `Hello, I'm Embers. I'm here to help you preserve the stories and memories that matter most to you — the moments, the people, the experiences that shaped your life. Think of me as a patient friend who's genuinely curious about your life. You just talk, and I listen. I'll ask gentle questions to help your memories come alive. There's no rush, no pressure. Just your voice, your memories, and all the time you need. Everything you share is saved safely, just for you. And when you're ready, your family can treasure these stories forever. First, what should I call you?`,

    askNameAgain: `What's your name? Just say it, or spell it out if that's easier.`,

    confirmName: (name: string) => `I heard ${name}. Is that right? Say yes, or say your name again if I got it wrong.`,

    ready: (name: string) => `Wonderful to meet you, ${name}. Whenever you're ready to share your first story, just say "let's go" or tap the button. I'll be right here, listening.`,

    starting: (name: string) => `Here we go, ${name}. Let's capture some memories together.`,
  }

  // Idle check-in prompts by phase
  const IDLE_PROMPTS: Partial<Record<Phase, string>> = {
    'introduction': "I'm listening. Just say your name whenever you're ready.",
    'ask-name': "Take your time. Just say your name, or type it below.",
    'confirm-name': "Just say yes if that's right, or say your name again.",
    'ready': "Take your time. Just say 'let's go' when you're ready, or tap the flame.",
  }
  const idlePromptsRef = useRef(IDLE_PROMPTS)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const speakEmberRef = useRef<(text: string, listenAfter?: boolean) => void>(() => {})

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  // Reset idle timer when user speaks
  useEffect(() => {
    if (transcript) {
      clearIdleTimer()
    }
  }, [transcript, clearIdleTimer])

  // ============================================
  // VOICE PLAYBACK
  // ============================================

  // Pre-generated static audio for instant playback (no API latency)
  const STATIC_AUDIO = {
    introduction: '/audio/embers-intro.mp3',
    askName: '/audio/embers-ask-name.mp3',
  }

  // Start idle timer — fires after 12 seconds of silence, speaks a gentle prompt
  const startIdleTimer = useCallback(() => {
    clearIdleTimer()
    idleTimerRef.current = setTimeout(() => {
      const prompt = idlePromptsRef.current[phaseRef.current]
      if (prompt && !isSpeakingRef.current) {
        speakEmberRef.current(prompt)
      }
    }, 12000)
  }, [clearIdleTimer])

  // Stop any currently playing audio
  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current = null
    }
  }, [])

  // Play pre-generated static audio (instant, no API call)
  const playStaticAudio = useCallback((audioPath: string, text: string, listenAfter = true) => {
    if (isSpeakingRef.current) return

    clearIdleTimer()
    isSpeakingRef.current = true
    setIsEmberSpeaking(true)
    setEmberText(text)

    stopAllAudio()

    const audio = new Audio(audioPath)
    audioRef.current = audio

    audio.onended = () => {
      isSpeakingRef.current = false
      setIsEmberSpeaking(false)
      startIdleTimer()
      if (listenAfter && isVoiceSupported) {
        setTimeout(() => {
          resetTranscript()
          startListening()
        }, 400)
      }
    }

    audio.onerror = () => {
      console.error('Static audio failed, falling back to TTS')
      isSpeakingRef.current = false
      setIsEmberSpeaking(false)
      speakEmberRef.current(text, listenAfter)
    }

    audio.play().catch(() => {
      isSpeakingRef.current = false
      setIsEmberSpeaking(false)
      speakEmberRef.current(text, listenAfter)
    })
  }, [isVoiceSupported, resetTranscript, startListening, stopAllAudio, clearIdleTimer, startIdleTimer])

  // Generate speech via TTS API (for dynamic text like names)
  const speakEmber = useCallback(async (text: string, listenAfter = true) => {
    if (isSpeakingRef.current) return

    clearIdleTimer()
    isSpeakingRef.current = true
    setIsEmberSpeaking(true)
    setEmberText(text)

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!response.ok) throw new Error('TTS failed')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      stopAllAudio()

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        isSpeakingRef.current = false
        setIsEmberSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        startIdleTimer()

        if (listenAfter && isVoiceSupported) {
          setTimeout(() => {
            resetTranscript()
            startListening()
          }, 400)
        }
      }

      audio.onerror = () => {
        isSpeakingRef.current = false
        setIsEmberSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error('TTS error:', error)
      isSpeakingRef.current = false
      setIsEmberSpeaking(false)
      if (listenAfter && isVoiceSupported) {
        setTimeout(() => {
          resetTranscript()
          startListening()
        }, 400)
      }
    }
  }, [isVoiceSupported, resetTranscript, startListening, stopAllAudio, clearIdleTimer, startIdleTimer])

  // Wire up speakEmber ref for idle timer callback
  speakEmberRef.current = speakEmber

  // ============================================
  // PHASE TRANSITIONS
  // ============================================

  const goToPhase = useCallback((nextPhase: Phase, data?: { name?: string }) => {
    const name = data?.name || userName
    setPhase(nextPhase)
    resetTranscript()

    setTimeout(() => {
      switch (nextPhase) {
        case 'introduction':
          playStaticAudio(STATIC_AUDIO.introduction, DIALOGUE.introduction)
          break
        case 'ask-name':
          playStaticAudio(STATIC_AUDIO.askName, DIALOGUE.askNameAgain)
          break
        case 'confirm-name':
          // Dynamic - includes user's name
          speakEmber(DIALOGUE.confirmName(name))
          break
        case 'ready':
          // Dynamic - includes user's name
          speakEmber(DIALOGUE.ready(name))
          break
        case 'starting':
          // Dynamic - includes user's name
          speakEmber(DIALOGUE.starting(name), false)
          break
      }
    }, 300)
  }, [userName, speakEmber, playStaticAudio, resetTranscript, DIALOGUE, STATIC_AUDIO])

  // ============================================
  // CHECK FOR RETURNING USER
  // ============================================

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const existingName = localStorage.getItem('embers_user_name')
    if (existingName) {
      setUserName(existingName)
      setTypedName(existingName)
    }
  }, [])

  // Handle tap to start
  const handleTapToStart = useCallback(() => {
    const existingName = localStorage.getItem('embers_user_name')

    if (existingName) {
      // Returning user - welcome back
      setUserName(existingName)
      setPhase('ready')
      speakEmber(`Welcome back, ${existingName}! It's Embers. Ready to share another story? Just say "let's go" when you're ready.`)
    } else {
      // New user - full introduction
      goToPhase('introduction')
    }
  }, [speakEmber, goToPhase])

  // ============================================
  // VOICE INPUT PROCESSING
  // ============================================

  useEffect(() => {
    if (!transcript || isEmberSpeaking) return

    const lower = transcript.toLowerCase().trim()

    switch (phase) {
      case 'introduction':
      case 'ask-name': {
        // Listen for a name
        if (lower.length >= 2) {
          const parsedName = parseSpokenName(transcript)
          if (parsedName && parsedName.length >= 2) {
            stopListening()
            setUserName(parsedName)
            setTypedName(parsedName)
            goToPhase('confirm-name', { name: parsedName })
          }
        }
        break
      }

      case 'confirm-name': {
        if (isAffirmative(lower)) {
          stopListening()
          localStorage.setItem('embers_user_name', userName)
          goToPhase('ready', { name: userName })
        } else if (isNegative(lower)) {
          stopListening()
          goToPhase('ask-name')
        } else if (lower.length >= 2) {
          // They're saying their name again
          const parsedName = parseSpokenName(transcript)
          if (parsedName && parsedName.length >= 2) {
            stopListening()
            setUserName(parsedName)
            setTypedName(parsedName)
            goToPhase('confirm-name', { name: parsedName })
          }
        }
        break
      }

      case 'ready': {
        if (isAffirmative(lower) || lower.includes("let's go") || lower.includes('start') || lower.includes('ready')) {
          stopListening()
          goToPhase('starting')
          // Set flags so conversation page auto-starts voice with SHORT greeting
          sessionStorage.setItem('embers_auto_start_conversation', 'true')
          sessionStorage.setItem('embers_came_from_onboarding', 'true')
          setTimeout(() => {
            router.push('/conversation')
          }, 3000)
        }
        break
      }
    }
  }, [transcript, phase, isEmberSpeaking, userName, stopListening, resetTranscript,
      goToPhase, parseSpokenName, isAffirmative, isNegative, router])

  // Flame tap in active phases — toggle listening or re-enable it
  const handleFlameClick = useCallback(() => {
    if (isEmberSpeaking) return

    if (isListening) {
      manualStopRef.current = true
      stopListening()
    } else {
      resetTranscript()
      startListening()
    }
  }, [isEmberSpeaking, isListening, stopListening, resetTranscript, startListening])

  // ============================================
  // TAP HANDLERS (BACKUP)
  // ============================================

  const handleNameSubmit = () => {
    if (typedName.trim().length >= 2) {
      stopListening()
      const name = typedName.trim()
      setUserName(name)
      localStorage.setItem('embers_user_name', name)
      goToPhase('ready', { name })
    }
  }

  const handleNameConfirmYes = () => {
    stopListening()
    localStorage.setItem('embers_user_name', userName)
    goToPhase('ready', { name: userName })
  }

  const handleNameConfirmNo = () => {
    stopListening()
    setUserName('')
    setTypedName('')
    goToPhase('ask-name')
  }

  const handleStart = () => {
    stopListening()
    goToPhase('starting')
    // Set flags so conversation page auto-starts voice with SHORT greeting
    sessionStorage.setItem('embers_auto_start_conversation', 'true')
    sessionStorage.setItem('embers_came_from_onboarding', 'true')
    setTimeout(() => {
      router.push('/conversation')
    }, 3000)
  }

  // Cleanup audio and timers on unmount
  useEffect(() => {
    return () => {
      stopAllAudio()
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [stopAllAudio])

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-[#0a0908] flex flex-col items-center justify-center relative overflow-hidden px-6">

      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(232, 109, 72, ${isEmberSpeaking ? 0.15 : isListening ? 0.1 : 0.05}) 0%,
            transparent 60%)`
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full">

        {/* Embers' Flame */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`relative ${phase === 'tap-to-start' ? 'cursor-pointer' : ''}`}
        >
          <FlameButton
            isListening={isListening}
            isSpeaking={isEmberSpeaking}
            isProcessing={false}
            onClick={phase === 'tap-to-start' ? handleTapToStart : handleFlameClick}
            size="large"
          />
          {phase === 'tap-to-start' && (
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-[-8px] rounded-full border-2 border-[#E86D48]/40 pointer-events-none"
            />
          )}
        </motion.div>

        {/* Embers' Speech */}
        <AnimatePresence mode="wait">
          {emberText && phase !== 'tap-to-start' && (
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="mt-8 text-center"
            >
              <p className="text-xl md:text-2xl text-[#f9f7f2]/90 font-serif leading-relaxed">
                {emberText}
              </p>
              {isEmberSpeaking && (
                <p className="text-sm text-[#E86D48]/60 mt-4 animate-pulse">
                  Embers is speaking...
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <AnimatePresence mode="wait">

          {/* TAP TO START */}
          {phase === 'tap-to-start' && (
            <motion.div
              key="tap-to-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 text-center"
            >
              <p className="text-2xl text-[#f9f7f2]/80 font-serif mb-2">
                Hello, I'm Embers
              </p>
              <p className="text-lg text-[#f9f7f2]/50">
                Tap to begin
              </p>
            </motion.div>
          )}

          {/* NAME INPUT (after introduction) */}
          {(phase === 'introduction' || phase === 'ask-name') && !isEmberSpeaking && (
            <motion.div
              key="name-input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-10 w-full"
            >
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Say or type your name..."
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  className="w-full text-center text-2xl py-4 px-6 bg-white/5 border border-white/20 rounded-2xl text-[#f9f7f2] placeholder:text-[#f9f7f2]/30 focus:outline-none focus:border-[#E86D48]/50 transition-colors"
                />
                <button
                  onClick={handleNameSubmit}
                  disabled={typedName.trim().length < 2}
                  className="w-full py-4 rounded-full text-white font-medium text-lg disabled:opacity-30 transition-all"
                  style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
                >
                  That's my name
                </button>
              </div>
            </motion.div>
          )}

          {/* NAME CONFIRM */}
          {phase === 'confirm-name' && !isEmberSpeaking && (
            <motion.div
              key="name-confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-10 w-full"
            >
              <div className="flex gap-4">
                <button
                  onClick={handleNameConfirmNo}
                  className="flex-1 py-4 rounded-full text-[#f9f7f2]/70 font-medium text-lg border border-white/20 hover:bg-white/5 transition-colors"
                >
                  No, try again
                </button>
                <button
                  onClick={handleNameConfirmYes}
                  className="flex-1 py-4 rounded-full text-white font-medium text-lg transition-all"
                  style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
                >
                  Yes, that's me
                </button>
              </div>
            </motion.div>
          )}

          {/* READY */}
          {phase === 'ready' && !isEmberSpeaking && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-10 w-full"
            >
              <button
                onClick={handleStart}
                className="w-full py-5 rounded-full text-white font-medium text-xl transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #E86D48, #c45a3a)',
                  boxShadow: '0 0 30px rgba(232, 109, 72, 0.3)'
                }}
              >
                Let's share a story
              </button>
              <p className="text-center text-[#f9f7f2]/40 text-sm mt-4">
                Or just say "let's go"
              </p>
            </motion.div>
          )}

          {/* STARTING */}
          {phase === 'starting' && (
            <motion.div
              key="starting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10 text-center"
            >
              <div className="w-8 h-8 border-2 border-[#E86D48] border-t-transparent rounded-full animate-spin mx-auto" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Listening Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-[#1a1714] border border-[#E86D48]/30 rounded-2xl px-6 py-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[#f9f7f2]/80 text-sm font-medium">Listening...</span>
              </div>
              {transcript && (
                <p className="text-[#f9f7f2]/50 text-sm mt-2 text-center max-w-xs">
                  "{transcript}"
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} className="hidden" />

      {/* Dev Reset Button - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => {
            localStorage.removeItem('embers_user_name')
            localStorage.removeItem('embers_conversation_draft')
            localStorage.removeItem('embers_local_stories')
            localStorage.removeItem('embers_interests')
            sessionStorage.removeItem('embers_intro_played')
            window.location.reload()
          }}
          className="fixed bottom-4 right-4 px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg border border-red-500/30 transition-colors z-50"
        >
          Reset (Dev)
        </button>
      )}
    </div>
  )
}

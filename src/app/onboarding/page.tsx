'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { interestCategories } from '@/data/interests'
import { interestService } from '@/lib/services/interestService'
import { FlameButton } from '@/components/conversation/FlameButton'
import { useVoiceCommands } from '@/lib/hooks/useVoiceCommands'

type OnboardingStep = 'welcome' | 'interests' | 'name' | 'confirm-name' | 'ready'

// All available interest names for voice matching
const ALL_INTEREST_NAMES = interestCategories.flatMap(cat =>
  cat.items.map(i => i.title.toLowerCase())
)

// Voice scripts - conversational, with voice response options
const VOICE_SCRIPTS = {
  welcome: `Hello. I'm Ember. I'm here to help you preserve the stories and memories that matter most to you. There's no rush, no pressure. Just your voice, your memories, and all the time you need. Say "yes" or "start" when you're ready to begin. Or you can tap the orange button on screen.`,

  interests: `I'd love to know what kinds of stories interest you most. You can say topics like "family", "career", "travel", "love", or "childhood". Say as many as you'd like, one at a time. When you're finished, say "done" or "that's all". Or you can tap the topics on screen.`,

  name: `What should I call you? Just say your name. If I don't catch it right, you can spell it out for me, letter by letter.`,

  confirmName: (name: string) => `I heard ${name}. Is that right? Say "yes" if that's correct, or say your name again if I got it wrong.`,

  ready: (name: string) => `Wonderful, ${name}. You're all set. Remember, there's no rush. Just speak naturally, and I'll guide you along the way. Say "yes" or "start" when you're ready to share your first story. Or tap the button on screen.`
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [name, setName] = useState('')
  const [pendingName, setPendingName] = useState('') // Name waiting for confirmation
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set())

  // Voice state
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [hasPlayedStepVoice, setHasPlayedStepVoice] = useState<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const shouldListenAfterVoiceRef = useRef(false)

  // Voice commands hook
  const {
    isListening,
    isSupported: isVoiceSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    parseSpokenName,
    isAffirmative,
  } = useVoiceCommands({
    continuous: false,
    enabled: true,
  })

  // Load existing data on mount
  useEffect(() => {
    const storedName = localStorage.getItem('embers_user_name')
    if (storedName) setName(storedName)

    const storedInterests = interestService.get()
    if (storedInterests.length > 0) {
      setSelectedInterests(new Set(storedInterests))
    }
  }, [])

  // Play voice and optionally start listening after
  const playVoice = useCallback(async (text: string, listenAfter = true) => {
    if (isPlayingVoice) return

    setIsPlayingVoice(true)
    shouldListenAfterVoiceRef.current = listenAfter

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!response.ok) throw new Error('TTS failed')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) audioRef.current.pause()

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setIsPlayingVoice(false)
        URL.revokeObjectURL(audioUrl)
        // Auto-start listening after voice finishes
        if (shouldListenAfterVoiceRef.current && isVoiceSupported) {
          setTimeout(() => {
            resetTranscript()
            startListening()
          }, 500)
        }
      }

      audio.onerror = () => {
        setIsPlayingVoice(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch {
      setIsPlayingVoice(false)
    }
  }, [isPlayingVoice, isVoiceSupported, resetTranscript, startListening])

  // Play voice when step changes (only once per step)
  useEffect(() => {
    if (hasPlayedStepVoice.has(step)) return

    const timer = setTimeout(() => {
      setHasPlayedStepVoice(prev => new Set(prev).add(step))

      switch (step) {
        case 'welcome':
          playVoice(VOICE_SCRIPTS.welcome)
          break
        case 'interests':
          playVoice(VOICE_SCRIPTS.interests)
          break
        case 'name':
          playVoice(VOICE_SCRIPTS.name)
          break
        case 'confirm-name':
          playVoice(VOICE_SCRIPTS.confirmName(pendingName))
          break
        case 'ready':
          playVoice(VOICE_SCRIPTS.ready(name))
          break
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [step, hasPlayedStepVoice, name, pendingName, playVoice])

  // Process voice input based on current step
  useEffect(() => {
    if (!transcript || isPlayingVoice) return

    const lowerTranscript = transcript.toLowerCase().trim()

    switch (step) {
      case 'welcome':
        // Listen for "yes", "start", "begin", etc.
        if (isAffirmative(lowerTranscript)) {
          stopListening()
          setStep('interests')
        }
        break

      case 'interests':
        // Check for "done" or similar
        if (lowerTranscript.includes('done') ||
            lowerTranscript.includes("that's all") ||
            lowerTranscript.includes('finished') ||
            lowerTranscript.includes('next')) {
          stopListening()
          if (selectedInterests.size > 0) {
            interestService.save(Array.from(selectedInterests))
            setStep('name')
          } else {
            // Prompt them to select at least one
            playVoice("Please tell me at least one topic that interests you. You can say things like family, career, or childhood.")
          }
          return
        }

        // Check for interest names in transcript
        for (const interest of ALL_INTEREST_NAMES) {
          if (lowerTranscript.includes(interest)) {
            // Find the actual interest ID
            for (const cat of interestCategories) {
              const found = cat.items.find(i => i.title.toLowerCase() === interest)
              if (found) {
                setSelectedInterests(prev => {
                  const next = new Set(prev)
                  next.add(found.id)
                  return next
                })
                // Confirm the selection
                playVoice(`Got it, ${found.title}. What else? Say "done" when you're finished.`)
                break
              }
            }
            break
          }
        }
        break

      case 'name':
        // Parse the spoken name
        if (lowerTranscript.length >= 2) {
          stopListening()
          const parsedName = parseSpokenName(transcript)
          if (parsedName && parsedName.length >= 2) {
            setPendingName(parsedName)
            setStep('confirm-name')
          }
        }
        break

      case 'confirm-name':
        if (isAffirmative(lowerTranscript)) {
          // Name confirmed
          stopListening()
          setName(pendingName)
          localStorage.setItem('embers_user_name', pendingName)
          setStep('ready')
        } else if (lowerTranscript.length >= 2 && !lowerTranscript.includes('no')) {
          // They're saying their name again
          stopListening()
          const parsedName = parseSpokenName(transcript)
          if (parsedName && parsedName.length >= 2) {
            setPendingName(parsedName)
            // Reset the played voice flag to re-confirm
            setHasPlayedStepVoice(prev => {
              const next = new Set(prev)
              next.delete('confirm-name')
              return next
            })
          }
        } else if (lowerTranscript.includes('no')) {
          // Go back to name entry
          stopListening()
          setStep('name')
          setHasPlayedStepVoice(prev => {
            const next = new Set(prev)
            next.delete('name')
            return next
          })
        }
        break

      case 'ready':
        if (isAffirmative(lowerTranscript)) {
          stopListening()
          router.push('/conversation')
        }
        break
    }
  }, [transcript, step, isPlayingVoice, selectedInterests, stopListening, playVoice,
      isAffirmative, parseSpokenName, pendingName, router])

  // Manual button handlers (fallback for those who prefer tapping)
  const handleWelcomeStart = () => {
    stopListening()
    setStep('interests')
  }

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => {
      const next = new Set(prev)
      if (next.has(interestId)) {
        next.delete(interestId)
      } else {
        next.add(interestId)
      }
      return next
    })
  }

  const handleInterestsContinue = () => {
    stopListening()
    interestService.save(Array.from(selectedInterests))
    setStep('name')
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      stopListening()
      localStorage.setItem('embers_user_name', name.trim())
      setStep('ready')
    }
  }

  const handleStart = () => {
    stopListening()
    router.push('/conversation')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0908] relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[70%]"
          style={{
            background: `radial-gradient(ellipse at center bottom,
              rgba(232, 109, 72, ${isPlayingVoice ? 0.15 : isListening ? 0.12 : 0.08}) 0%,
              rgba(196, 90, 58, ${isPlayingVoice ? 0.08 : isListening ? 0.06 : 0.04}) 30%,
              transparent 60%)`,
            transition: 'all 0.5s ease-out'
          }}
        />
      </div>

      {/* Listening indicator - always visible when listening */}
      {isListening && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[#E86D48]/20 border border-[#E86D48]/30 rounded-full px-6 py-2 flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[#f9f7f2]/80 text-sm">Listening...</span>
          </div>
        </div>
      )}

      {/* Live transcript display */}
      {isListening && transcript && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md">
          <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2">
            <p className="text-[#f9f7f2]/60 text-sm text-center">&ldquo;{transcript}&rdquo;</p>
          </div>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Welcome Step */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="relative mb-4">
                <FlameButton
                  isListening={isListening}
                  isSpeaking={isPlayingVoice}
                  isProcessing={false}
                  onClick={() => {}}
                  size="large"
                />
              </div>

              {isPlayingVoice && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse"
                >
                  Ember is speaking...
                </motion.p>
              )}

              <motion.div className="space-y-4">
                <h1 className="text-4xl font-serif font-bold text-[#f9f7f2]">
                  Hello, I&apos;m Ember
                </h1>
                <p className="text-xl text-[#f9f7f2]/60 leading-relaxed max-w-md">
                  I&apos;m here to help you preserve your stories and memories.
                </p>
              </motion.div>

              {/* Voice instruction */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center max-w-sm">
                <p className="text-[#f9f7f2]/70 text-lg">
                  Say <span className="text-[#E86D48] font-semibold">&ldquo;yes&rdquo;</span> or{' '}
                  <span className="text-[#E86D48] font-semibold">&ldquo;start&rdquo;</span> when you&apos;re ready
                </p>
                <p className="text-[#f9f7f2]/40 text-sm mt-2">
                  Or tap the button below
                </p>
              </div>

              <button
                onClick={handleWelcomeStart}
                disabled={isPlayingVoice}
                className="w-full max-w-sm py-4 rounded-full text-white font-medium text-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
              >
                Let&apos;s Get Started
              </button>

              <Link href="/" className="text-[#f9f7f2]/40 hover:text-[#f9f7f2]/60 transition-colors text-sm">
                ← Back to home
              </Link>
            </motion.div>
          )}

          {/* Interests Step */}
          {step === 'interests' && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              {isPlayingVoice && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-4">
                  <p className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse">Ember is speaking...</p>
                </motion.div>
              )}

              <div className="text-center mb-6">
                <h1 className="text-3xl font-serif font-bold text-[#f9f7f2] mb-3">
                  What stories call to you?
                </h1>
                <p className="text-[#f9f7f2]/60">
                  Say topics aloud, or tap them below
                </p>
              </div>

              {/* Voice instruction */}
              <div className="bg-[#E86D48]/10 border border-[#E86D48]/20 rounded-xl p-4 mb-6 text-center">
                <p className="text-[#f9f7f2]/70">
                  Say topics like <span className="text-[#E86D48]">&ldquo;family&rdquo;</span>,{' '}
                  <span className="text-[#E86D48]">&ldquo;career&rdquo;</span>, or{' '}
                  <span className="text-[#E86D48]">&ldquo;childhood&rdquo;</span>
                </p>
                <p className="text-[#f9f7f2]/50 text-sm mt-1">
                  Say <span className="text-[#E86D48]">&ldquo;done&rdquo;</span> when finished
                </p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#f9f7f2]/40">
                  {selectedInterests.size === 0
                    ? 'Select at least one topic'
                    : `${selectedInterests.size} topic${selectedInterests.size > 1 ? 's' : ''} selected`}
                </span>
                <button onClick={() => setStep('welcome')} className="text-sm text-[#f9f7f2]/40 hover:text-[#f9f7f2]/60">
                  ← Back
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pb-24">
                {interestCategories.map((category) => (
                  <div key={category.id}>
                    <h3 className="text-sm font-medium text-[#f9f7f2]/40 mb-3 uppercase tracking-wide">
                      {category.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {category.items.map((interest) => {
                        const isSelected = selectedInterests.has(interest.id)
                        return (
                          <button
                            key={interest.id}
                            onClick={() => handleInterestToggle(interest.id)}
                            className={`px-4 py-2 rounded-full text-sm transition-all ${
                              isSelected
                                ? 'bg-[#E86D48] text-white'
                                : 'bg-white/5 text-[#f9f7f2]/70 hover:bg-white/10'
                            }`}
                          >
                            {interest.title}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0908] via-[#0a0908] to-transparent">
                <div className="max-w-2xl mx-auto">
                  <button
                    onClick={handleInterestsContinue}
                    disabled={selectedInterests.size === 0}
                    className="w-full py-4 rounded-full text-white font-medium text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Name Step - Voice First */}
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              {isPlayingVoice && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse">
                  Ember is speaking...
                </motion.p>
              )}

              <div className="space-y-4">
                <span className="text-6xl">👋</span>
                <h1 className="text-3xl font-serif font-bold text-[#f9f7f2]">
                  What should I call you?
                </h1>
                <p className="text-xl text-[#f9f7f2]/60 max-w-md">
                  Just say your name
                </p>
              </div>

              {/* Voice instruction */}
              <div className="bg-[#E86D48]/10 border border-[#E86D48]/20 rounded-xl p-6 text-center max-w-sm">
                <p className="text-[#f9f7f2]/70 text-lg">
                  Say your name clearly
                </p>
                <p className="text-[#f9f7f2]/50 text-sm mt-2">
                  If I don&apos;t catch it, spell it out: <span className="text-[#E86D48]">&ldquo;H-A-R-O-L-D&rdquo;</span>
                </p>
              </div>

              {/* Fallback text input */}
              <div className="w-full max-w-sm">
                <p className="text-[#f9f7f2]/30 text-sm mb-3">Or type it below:</p>
                <form onSubmit={handleNameSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your first name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-center text-2xl py-4 px-6 bg-white/5 border border-white/20 rounded-xl text-[#f9f7f2] placeholder:text-[#f9f7f2]/30 focus:outline-none focus:border-[#E86D48]/50"
                  />
                  <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full py-4 rounded-full text-white font-medium text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
                  >
                    Continue
                  </button>
                </form>
              </div>

              <button onClick={() => setStep('interests')} className="text-[#f9f7f2]/40 hover:text-[#f9f7f2]/60 transition-colors">
                ← Go back
              </button>
            </motion.div>
          )}

          {/* Confirm Name Step */}
          {step === 'confirm-name' && (
            <motion.div
              key="confirm-name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              {isPlayingVoice && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse">
                  Ember is speaking...
                </motion.p>
              )}

              <div className="space-y-4">
                <h1 className="text-3xl font-serif font-bold text-[#f9f7f2]">
                  I heard <span className="text-[#E86D48]">{pendingName}</span>
                </h1>
                <p className="text-xl text-[#f9f7f2]/60 max-w-md">
                  Is that right?
                </p>
              </div>

              {/* Voice instruction */}
              <div className="bg-[#E86D48]/10 border border-[#E86D48]/20 rounded-xl p-6 text-center max-w-sm">
                <p className="text-[#f9f7f2]/70 text-lg">
                  Say <span className="text-[#E86D48] font-semibold">&ldquo;yes&rdquo;</span> if correct
                </p>
                <p className="text-[#f9f7f2]/50 text-sm mt-2">
                  Or say your name again if I got it wrong
                </p>
              </div>

              {/* Manual buttons */}
              <div className="flex gap-4 w-full max-w-sm">
                <button
                  onClick={() => {
                    setStep('name')
                    setHasPlayedStepVoice(prev => {
                      const next = new Set(prev)
                      next.delete('name')
                      return next
                    })
                  }}
                  className="flex-1 py-4 rounded-full text-[#f9f7f2]/70 font-medium text-lg border border-white/20 hover:bg-white/5"
                >
                  No, try again
                </button>
                <button
                  onClick={() => {
                    setName(pendingName)
                    localStorage.setItem('embers_user_name', pendingName)
                    setStep('ready')
                  }}
                  className="flex-1 py-4 rounded-full text-white font-medium text-lg"
                  style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
                >
                  Yes, that&apos;s me
                </button>
              </div>
            </motion.div>
          )}

          {/* Ready Step */}
          {step === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="relative mb-4">
                <FlameButton
                  isListening={isListening}
                  isSpeaking={isPlayingVoice}
                  isProcessing={false}
                  onClick={() => {}}
                  size="medium"
                />
              </div>

              {isPlayingVoice && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse">
                  Ember is speaking...
                </motion.p>
              )}

              <div className="space-y-4">
                <h1 className="text-3xl font-serif font-bold text-[#f9f7f2]">
                  You&apos;re all set, {name}!
                </h1>
                <p className="text-xl text-[#f9f7f2]/60 leading-relaxed max-w-md">
                  Remember, there&apos;s no right or wrong way to share your stories.
                </p>
              </div>

              {/* Voice instruction */}
              <div className="bg-[#E86D48]/10 border border-[#E86D48]/20 rounded-xl p-6 text-center max-w-sm">
                <p className="text-[#f9f7f2]/70 text-lg">
                  Say <span className="text-[#E86D48] font-semibold">&ldquo;yes&rdquo;</span> or{' '}
                  <span className="text-[#E86D48] font-semibold">&ldquo;start&rdquo;</span> when ready
                </p>
                <p className="text-[#f9f7f2]/50 text-sm mt-2">
                  Or tap the button below
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-3 max-w-sm">
                <h2 className="font-semibold text-lg text-[#f9f7f2]">A few tips:</h2>
                <ul className="space-y-2 text-[#f9f7f2]/70">
                  <li className="flex items-start gap-2">
                    <span className="text-[#E86D48]">•</span>
                    Take your time - there&apos;s no rush
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#E86D48]">•</span>
                    Pause whenever you need to think
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#E86D48]">•</span>
                    I&apos;ll check in if you go quiet
                  </li>
                </ul>
              </div>

              <button
                onClick={handleStart}
                disabled={isPlayingVoice}
                className="w-full max-w-sm py-4 rounded-full text-white font-medium text-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
              >
                Start My First Story
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  )
}

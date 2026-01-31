'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { interestCategories } from '@/data/interests'
import { CategorySection } from '@/components/onboarding/CategorySection'
import { interestService } from '@/lib/services/interestService'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { FlameButton } from '@/components/conversation/FlameButton'

type OnboardingStep = 'welcome' | 'interests' | 'name' | 'safekeeping' | 'email-sent' | 'ready'

// Voice scripts for each step - warm, empathetic, with clear directional guidance
const VOICE_SCRIPTS = {
  welcome: `Hello. I'm Ember. I'm here to help you preserve the stories and memories that matter most to you. There's no pressure, no right or wrong way to do this. Just your voice, your memories, and all the time you need. When you're ready, tap the orange button that says "Let's Get Started."`,
  interests: `I'd love to know what kinds of stories interest you most. You'll see topics like family, career, travel, and more. Tap any that speak to you - you can choose as many as you'd like. When you're done, tap the "Continue" button at the bottom of the screen.`,
  name: `What should I call you? There's a text box on your screen. Just type your first name, then tap the "Continue" button.`,
  safekeeping: `The memories you're about to share are precious. I'd like to help keep them safe. Your email is simply your key back to everything we create together. Type your email address, then tap "Send My Key." Or if you prefer, you can tap "Skip for now" at the bottom.`,
  emailSent: `I just sent you a magic link. Check your email and click the link to continue. You can also tap "Continue without waiting" if you'd like to start right away. I'll be right here.`,
  ready: `You're all set. Remember, there's no rush. Just speak naturally, and I'll guide you along the way. When you're ready, tap the orange button that says "Start My First Story."`
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set())

  // Voice state
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Email state
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Load existing data on mount
  useEffect(() => {
    const storedName = localStorage.getItem('embers_user_name')
    if (storedName) setName(storedName)

    const storedInterests = interestService.get()
    if (storedInterests.length > 0) {
      setSelectedInterests(new Set(storedInterests))
    }
  }, [])

  // Auto-play voice when step changes - voice starts immediately
  useEffect(() => {
    // Small delay to let the UI render, then play voice
    const timer = setTimeout(() => {
      switch (step) {
        case 'welcome':
          if (!hasPlayedWelcome) {
            setHasPlayedWelcome(true)
            playVoice(VOICE_SCRIPTS.welcome)
          }
          break
        case 'interests':
          playVoice(VOICE_SCRIPTS.interests)
          break
        case 'name':
          playVoice(VOICE_SCRIPTS.name)
          break
        // safekeeping, email-sent, and ready already have voice triggers
      }
    }, 300) // Short delay for UI to settle

    return () => clearTimeout(timer)
  }, [step, hasPlayedWelcome])

  // Play voice for current step
  const playVoice = async (text: string) => {
    if (isPlayingVoice) return

    setIsPlayingVoice(true)

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
      }

      audio.onerror = () => {
        setIsPlayingVoice(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch {
      setIsPlayingVoice(false)
    }
  }

  const handleToggleInterest = (interestId: string) => {
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

  const handleInterestsSubmit = () => {
    interestService.save(Array.from(selectedInterests))
    setStep('name')
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      localStorage.setItem('embers_user_name', name.trim())
      setStep('safekeeping')
      // Play safekeeping voice after a short delay
      setTimeout(() => playVoice(VOICE_SCRIPTS.safekeeping), 500)
    }
  }

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSendingEmail(true)
    setEmailError(null)

    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/conversation`,
        },
      })

      if (error) {
        // Show specific error messages for common issues
        if (error.message.includes('rate limit') || error.message.includes('rate_limit')) {
          setEmailError('Too many requests. Please wait a few minutes and try again.')
        } else if (error.message.includes('Invalid email')) {
          setEmailError('Please enter a valid email address.')
        } else {
          setEmailError(error.message)
        }
      } else {
        setEmailSent(true)
        setStep('email-sent')
        setTimeout(() => playVoice(VOICE_SCRIPTS.emailSent), 500)
      }
    } catch (err) {
      // Log the actual error for debugging
      console.error('Magic link error:', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('Missing Supabase')) {
        setEmailError('Email service not configured. Please skip for now.')
      } else {
        setEmailError(`Something went wrong: ${message}`)
      }
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleSkipSafekeeping = () => {
    setStep('ready')
    setTimeout(() => playVoice(VOICE_SCRIPTS.ready), 500)
  }

  const handleContinueWithoutEmail = () => {
    setStep('ready')
    setTimeout(() => playVoice(VOICE_SCRIPTS.ready), 500)
  }

  const handleStart = () => {
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
              rgba(232, 109, 72, ${isPlayingVoice ? 0.15 : 0.08}) 0%,
              rgba(196, 90, 58, ${isPlayingVoice ? 0.08 : 0.04}) 30%,
              transparent 60%)`,
            transition: 'all 0.5s ease-out'
          }}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Welcome Step - Voice auto-plays immediately */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              {/* Animated Ember */}
              <div className="relative mb-4">
                <FlameButton
                  isListening={false}
                  isSpeaking={isPlayingVoice}
                  isProcessing={false}
                  onClick={() => {}}
                  size="large"
                />
              </div>

              {/* Speaking indicator */}
              {isPlayingVoice && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse"
                >
                  Ember is speaking...
                </motion.p>
              )}

              {/* Content - visible immediately, voice explains it */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-4xl font-serif font-bold text-[#f9f7f2]">
                  Hello, I&apos;m Ember
                </h1>
                <p className="text-xl text-[#f9f7f2]/60 leading-relaxed max-w-md">
                  I&apos;m here to help you preserve your stories and memories.
                </p>
              </motion.div>

              {/* How it works - shown while voice plays */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4 w-full max-w-sm"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4">
                  <h2 className="text-lg font-semibold text-[#f9f7f2]">Here&apos;s how it works:</h2>
                  <ul className="space-y-3">
                    {[
                      { icon: '🎙️', text: 'You talk, just like chatting with a friend' },
                      { icon: '💬', text: 'I ask questions to help you remember more' },
                      { icon: '📖', text: 'Your stories become a beautiful Life Book' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[#f9f7f2]/80">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setStep('interests')}
                  disabled={isPlayingVoice}
                  className="w-full py-4 rounded-full text-white font-medium text-lg disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
                >
                  Let&apos;s Get Started
                </button>
              </motion.div>

              <Link
                href="/"
                className="text-[#f9f7f2]/40 hover:text-[#f9f7f2]/60 transition-colors text-sm"
              >
                ← Back to home
              </Link>
            </motion.div>
          )}

          {/* Interest Selection Step */}
          {step === 'interests' && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* Speaking indicator at top */}
              {isPlayingVoice && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mb-4"
                >
                  <p className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse">
                    Ember is speaking...
                  </p>
                </motion.div>
              )}

              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-[#f9f7f2] mb-3">
                  What stories call to you?
                </h1>
                <p className="text-[#f9f7f2]/60">
                  Tap any topics that speak to you.
                </p>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-[#f9f7f2]/40">
                  {selectedInterests.size === 0
                    ? 'Select at least one topic'
                    : `${selectedInterests.size} topic${selectedInterests.size > 1 ? 's' : ''} selected`}
                </span>
                <button
                  onClick={() => setStep('welcome')}
                  className="text-sm text-[#f9f7f2]/40 hover:text-[#f9f7f2]/60"
                >
                  ← Back
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pb-24">
                {interestCategories.map((category) => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    selectedInterests={selectedInterests}
                    onToggleInterest={handleToggleInterest}
                  />
                ))}
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0908] via-[#0a0908] to-transparent">
                <div className="max-w-2xl mx-auto">
                  <button
                    onClick={handleInterestsSubmit}
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

          {/* Name Step */}
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              {/* Speaking indicator */}
              {isPlayingVoice && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg text-[#f9f7f2]/60 font-serif animate-pulse"
                >
                  Ember is speaking...
                </motion.p>
              )}

              <div className="space-y-4">
                <span className="text-6xl">👋</span>
                <h1 className="text-3xl font-serif font-bold text-[#f9f7f2]">
                  What should I call you?
                </h1>
                <p className="text-xl text-[#f9f7f2]/60 max-w-md">
                  Type your first name below.
                </p>
              </div>

              <form onSubmit={handleNameSubmit} className="w-full max-w-sm space-y-6">
                <input
                  type="text"
                  placeholder="Your first name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
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

              <button
                onClick={() => setStep('interests')}
                className="text-[#f9f7f2]/40 hover:text-[#f9f7f2]/60 transition-colors"
              >
                ← Go back
              </button>
            </motion.div>
          )}

          {/* NEW: Safekeeping Step - Email Capture with Voice */}
          {step === 'safekeeping' && (
            <motion.div
              key="safekeeping"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              {/* Small ember icon */}
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                    boxShadow: isPlayingVoice
                      ? '0 0 60px 20px rgba(232, 109, 72, 0.5)'
                      : '0 0 30px 10px rgba(232, 109, 72, 0.3)',
                    transition: 'box-shadow 0.5s ease-out'
                  }}
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

              <div className="space-y-4">
                <h1 className="text-3xl font-serif font-bold text-[#f9f7f2]">
                  Keep your stories safe, {name}
                </h1>
                <p className="text-lg text-[#f9f7f2]/50 max-w-md leading-relaxed">
                  Your email is your key back to everything we create together.
                  <br />
                  <span className="text-[#f9f7f2]/40">No password needed. Nothing else required.</span>
                </p>
              </div>

              <form onSubmit={handleSendMagicLink} className="w-full max-w-sm space-y-4">
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    className="w-full text-center text-xl py-4 px-6 bg-white/5 border border-white/20 rounded-xl text-[#f9f7f2] placeholder:text-[#f9f7f2]/30 focus:outline-none focus:border-[#E86D48]/50"
                  />
                  {emailError && (
                    <p className="text-red-400 text-sm">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!email.trim() || isSendingEmail}
                  className="w-full py-4 rounded-full text-white font-medium text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
                >
                  {isSendingEmail ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send My Key'
                  )}
                </button>
              </form>

              <button
                onClick={handleSkipSafekeeping}
                className="text-[#f9f7f2]/30 hover:text-[#f9f7f2]/50 transition-colors text-sm"
              >
                Skip for now
                <span className="block text-xs text-[#f9f7f2]/20 mt-1">
                  (stories will only be saved on this device)
                </span>
              </button>
            </motion.div>
          )}

          {/* NEW: Email Sent Step */}
          {step === 'email-sent' && (
            <motion.div
              key="email-sent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="relative">
                <span className="text-6xl">✉️</span>
                <div className="absolute inset-0 blur-2xl bg-[#E86D48]/20 -z-10" />
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

              <div className="space-y-4">
                <h1 className="text-3xl font-serif font-bold text-[#f9f7f2]">
                  Check your email, {name}
                </h1>
                <p className="text-lg text-[#f9f7f2]/50 max-w-md">
                  I sent a magic link to <span className="text-[#E86D48]">{email}</span>
                </p>
                <p className="text-[#f9f7f2]/40">
                  Click the link in your email to continue.
                  <br />
                  I&apos;ll be right here waiting.
                </p>
              </div>

              <div className="space-y-4 w-full max-w-sm">
                <button
                  onClick={handleContinueWithoutEmail}
                  className="w-full py-4 rounded-full text-[#f9f7f2]/70 font-medium text-lg border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Continue without waiting
                </button>
                <p className="text-xs text-[#f9f7f2]/30">
                  You can verify your email later from settings
                </p>
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
              {/* Animated ember */}
              <div className="relative mb-4">
                <FlameButton
                  isListening={false}
                  isSpeaking={isPlayingVoice}
                  isProcessing={false}
                  onClick={() => {}}
                  size="medium"
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

              <div className="space-y-4">
                <h1 className="text-3xl font-serif font-bold text-[#f9f7f2]">
                  You&apos;re all set, {name}!
                </h1>
                <p className="text-xl text-[#f9f7f2]/60 leading-relaxed max-w-md">
                  Remember, there&apos;s no right or wrong way to share your stories.
                  Just speak naturally, and I&apos;ll guide you along the way.
                </p>
              </div>

              <div className="bg-[#E86D48]/10 border border-[#E86D48]/20 rounded-2xl p-6 text-left space-y-4 max-w-sm">
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
                    Share as much or as little as you&apos;d like
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#E86D48]">•</span>
                    Every memory is worth preserving
                  </li>
                </ul>
              </div>

              {selectedInterests.size > 0 && (
                <div className="text-sm text-[#f9f7f2]/40">
                  We&apos;ll explore stories about{' '}
                  <span className="text-[#E86D48]/80">
                    {Array.from(selectedInterests).slice(0, 3).join(', ')}
                    {selectedInterests.size > 3 && ` and ${selectedInterests.size - 3} more`}
                  </span>
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={isPlayingVoice}
                className="w-full max-w-sm py-4 rounded-full text-white font-medium text-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
              >
                Start My First Story
              </button>

              {emailSent && (
                <p className="text-sm text-green-400/60">
                  ✓ Your stories will be saved to {email}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}

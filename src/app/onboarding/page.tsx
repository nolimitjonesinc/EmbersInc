'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { interestCategories } from '@/data/interests'
import { CategorySection } from '@/components/onboarding/CategorySection'
import { interestService } from '@/lib/services/interestService'

type OnboardingStep = 'welcome' | 'interests' | 'name' | 'ready'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [name, setName] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set())

  // Load existing data on mount
  useEffect(() => {
    const storedName = localStorage.getItem('embers_user_name')
    if (storedName) setName(storedName)

    const storedInterests = interestService.get()
    if (storedInterests.length > 0) {
      setSelectedInterests(new Set(storedInterests))
    }
  }, [])

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
      setStep('ready')
    }
  }

  const handleStart = () => {
    router.push('/conversation')
  }

  const handleSkipToConversation = () => {
    // Save any selections made
    if (selectedInterests.size > 0) {
      interestService.save(Array.from(selectedInterests))
    }
    if (name.trim()) {
      localStorage.setItem('embers_user_name', name.trim())
    }
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
              rgba(232, 109, 72, 0.08) 0%,
              rgba(196, 90, 58, 0.04) 30%,
              transparent 60%)`
          }}
        />
      </div>

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
              {/* Ember glow */}
              <div className="relative">
                <div className="text-8xl">🔥</div>
                <div className="absolute inset-0 blur-2xl bg-[#E86D48]/30 -z-10" />
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-serif font-bold text-[#f9f7f2]">
                  Welcome to Embers
                </h1>
                <p className="text-xl text-[#f9f7f2]/60 leading-relaxed max-w-md">
                  Your stories matter. Let&apos;s preserve them for your family, together.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4 max-w-sm">
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
                className="w-full max-w-sm py-4 rounded-full text-white font-medium text-lg"
                style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
              >
                Let&apos;s Get Started
              </button>

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
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-[#f9f7f2] mb-3">
                  What stories call to you?
                </h1>
                <p className="text-[#f9f7f2]/60">
                  Select the topics you&apos;d like to explore. Pick as many as you&apos;d like.
                </p>
              </div>

              {/* Selection count */}
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

              {/* Categories */}
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

              {/* Fixed bottom button */}
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
              <div className="space-y-4">
                <span className="text-6xl">👋</span>
                <h1 className="text-3xl font-serif font-bold text-[#f9f7f2]">
                  What should I call you?
                </h1>
                <p className="text-xl text-[#f9f7f2]/60 max-w-md">
                  I&apos;d love to know your name so we can have a more personal conversation.
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

          {/* Ready Step */}
          {step === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="space-y-4">
                <span className="text-6xl">✨</span>
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

              {/* Show selected interests */}
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
                className="w-full max-w-sm py-4 rounded-full text-white font-medium text-lg"
                style={{ background: 'linear-gradient(135deg, #E86D48, #c45a3a)' }}
              >
                Start My First Story
              </button>

              <p className="text-sm text-[#f9f7f2]/40">
                You can always come back and add more stories later.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

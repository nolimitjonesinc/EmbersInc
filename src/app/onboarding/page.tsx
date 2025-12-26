'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type OnboardingStep = 'welcome' | 'name' | 'ready';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [name, setName] = useState('');

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      // Store name in localStorage for now (will use Supabase later)
      localStorage.setItem('embers_user_name', name.trim());
      setStep('ready');
    }
  };

  const handleStart = () => {
    router.push('/conversation');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="text-center space-y-8 animate-fadeIn">
            <div className="space-y-4">
              <div className="text-8xl animate-float">🔥</div>
              <h1 className="text-4xl font-bold">Welcome to Embers</h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Your stories matter. Let&apos;s preserve them for your family, together.
              </p>
            </div>

            <div className="space-y-4 text-left bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Here&apos;s how it works:</h2>
              <ul className="space-y-3">
                {[
                  { icon: '🎙️', text: 'You talk, just like chatting with a friend' },
                  { icon: '💬', text: 'I ask questions to help you remember more' },
                  { icon: '📖', text: 'Your stories become a beautiful Life Book' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-gray-700">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button size="lg" className="w-full" onClick={() => setStep('name')}>
              Let&apos;s Get Started
            </Button>

            <Link
              href="/"
              className="block text-gray-500 hover:text-ember-orange transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        )}

        {/* Name Step */}
        {step === 'name' && (
          <div className="text-center space-y-8 animate-fadeIn">
            <div className="space-y-4">
              <span className="text-6xl">👋</span>
              <h1 className="text-3xl font-bold">What should I call you?</h1>
              <p className="text-xl text-gray-600">
                I&apos;d love to know your name so we can have a more personal conversation.
              </p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-6">
              <Input
                type="text"
                placeholder="Your first name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center text-xl h-16"
                autoFocus
              />
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!name.trim()}
              >
                Continue
              </Button>
            </form>

            <button
              onClick={() => setStep('welcome')}
              className="text-gray-500 hover:text-ember-orange transition-colors"
            >
              ← Go back
            </button>
          </div>
        )}

        {/* Ready Step */}
        {step === 'ready' && (
          <div className="text-center space-y-8 animate-fadeIn">
            <div className="space-y-4">
              <span className="text-6xl">✨</span>
              <h1 className="text-3xl font-bold">You&apos;re all set, {name}!</h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Remember, there&apos;s no right or wrong way to share your stories. Just speak
                naturally, and I&apos;ll guide you along the way.
              </p>
            </div>

            <div className="bg-ember-gradient-subtle rounded-2xl p-6 text-left space-y-4">
              <h2 className="font-semibold text-lg">A few tips:</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Take your time - there&apos;s no rush</li>
                <li>• Pause whenever you need to think</li>
                <li>• Share as much or as little as you&apos;d like</li>
                <li>• Every memory is worth preserving</li>
              </ul>
            </div>

            <Button size="xl" className="w-full" onClick={handleStart}>
              Start My First Story
            </Button>

            <p className="text-sm text-gray-500">
              You can always come back and add more stories later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

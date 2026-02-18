'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { PREMIUM_PRICE_MONTHLY, TIER_LIMITS } from '@/lib/subscription/tiers';

export default function PricingPage() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPremium = profile?.subscription_tier === 'premium';

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      setError('Could not connect to payment system. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) window.location.href = url;
      }
    } catch {
      setError('Could not open subscription management.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-amber-800">Embers</h1>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-serif text-gray-800 mb-3">
            Keep Your Stories Alive
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Every memory matters. Choose the plan that works for you.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-amber-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-1">Free</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              $0<span className="text-base font-normal text-gray-500">/month</span>
            </p>
            <p className="text-gray-500 text-sm mb-6">Get started for free</p>

            <ul className="space-y-3 mb-8 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">&#10003;</span>
                <span>{TIER_LIMITS.free} stories saved to the cloud</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">&#10003;</span>
                <span>Voice-first conversations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">&#10003;</span>
                <span>Narrative prose for each story</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">&#10003;</span>
                <span>Life Book with your stories</span>
              </li>
            </ul>

            {!user ? (
              <Link
                href="/onboarding"
                className="block w-full py-3 px-4 rounded-xl border-2 border-amber-300 text-amber-700 font-medium text-center hover:bg-amber-50 transition-all"
              >
                Get Started Free
              </Link>
            ) : (
              <div className="py-3 px-4 rounded-xl bg-gray-100 text-gray-500 font-medium text-center">
                {isPremium ? 'Included' : 'Your Current Plan'}
              </div>
            )}
          </div>

          {/* Premium Tier */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-amber-400 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              Most Popular
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-1">Premium</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              ${PREMIUM_PRICE_MONTHLY}<span className="text-base font-normal text-gray-500">/month</span>
            </p>
            <p className="text-gray-500 text-sm mb-6">Unlimited memories</p>

            <ul className="space-y-3 mb-8 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">&#10003;</span>
                <span><strong>Unlimited</strong> stories</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">&#10003;</span>
                <span>Everything in Free</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">&#10003;</span>
                <span>Family sharing — invite loved ones</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">&#10003;</span>
                <span>Cloud backup — stories are safe forever</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">&#10003;</span>
                <span>Priority support</span>
              </li>
            </ul>

            {isPremium ? (
              <button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl border-2 border-amber-300 text-amber-700 font-medium text-center hover:bg-amber-50 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Manage Subscription'}
              </button>
            ) : user ? (
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl text-white font-medium transition-all disabled:opacity-50 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #E86D48, #c45a3a)',
                  boxShadow: '0 4px 20px rgba(232, 109, 72, 0.3)',
                }}
              >
                {isLoading ? 'Loading...' : 'Upgrade to Premium'}
              </button>
            ) : (
              <Link
                href="/login?redirect=/pricing"
                className="block w-full py-3 px-4 rounded-xl text-white font-medium text-center transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #E86D48, #c45a3a)',
                  boxShadow: '0 4px 20px rgba(232, 109, 72, 0.3)',
                }}
              >
                Sign In to Upgrade
              </Link>
            )}
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-center mt-4">{error}</p>
        )}

        {/* Footer */}
        <div className="text-center mt-12 space-y-2">
          <p className="text-gray-500 text-sm">
            Cancel anytime. Your stories are always yours.
          </p>
          <Link
            href="/"
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            &larr; Back to Embers
          </Link>
        </div>
      </div>
    </div>
  );
}

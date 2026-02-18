'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { SubscriptionTier, TIER_LIMITS, TIER_FEATURES } from './tiers';

/**
 * Subscription Hook
 *
 * Combines auth state + story count to determine:
 * - Current tier (anonymous / free / premium)
 * - Whether user can save another story
 * - Whether to show auth gate vs. upgrade prompt
 */

export interface UseSubscriptionReturn {
  tier: SubscriptionTier;
  storyLimit: number;
  features: typeof TIER_FEATURES[SubscriptionTier];
  /** Check if user can save given their current story count */
  canSaveStory: (currentCount: number) => boolean;
  /** True if anonymous user should see auth gate */
  shouldShowAuthGate: (currentCount: number) => boolean;
  /** True if free user should see upgrade prompt */
  shouldShowUpgradePrompt: (currentCount: number) => boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, profile, isLoading } = useAuth();

  const tier: SubscriptionTier = useMemo(() => {
    if (!user) return 'anonymous';
    if (profile?.subscription_tier === 'premium') {
      // Check if subscription is still active
      if (profile.subscription_expires_at) {
        const expiresAt = new Date(profile.subscription_expires_at);
        if (expiresAt < new Date()) return 'free'; // Expired
      }
      return 'premium';
    }
    return 'free';
  }, [user, profile]);

  const storyLimit = TIER_LIMITS[tier];
  const features = TIER_FEATURES[tier];
  const isAuthenticated = !!user;
  const isPremium = tier === 'premium';

  const canSaveStory = (currentCount: number): boolean => {
    return currentCount < storyLimit;
  };

  const shouldShowAuthGate = (currentCount: number): boolean => {
    return tier === 'anonymous' && currentCount >= TIER_LIMITS.anonymous;
  };

  const shouldShowUpgradePrompt = (currentCount: number): boolean => {
    return tier === 'free' && currentCount >= TIER_LIMITS.free;
  };

  return {
    tier,
    storyLimit,
    features,
    canSaveStory,
    shouldShowAuthGate,
    shouldShowUpgradePrompt,
    isAuthenticated,
    isPremium,
  };
}

/**
 * Get the count of locally saved stories (for anonymous users).
 */
export function getLocalStoryCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stories = JSON.parse(localStorage.getItem('embers_local_stories') || '[]');
    return Array.isArray(stories) ? stories.length : 0;
  } catch {
    return 0;
  }
}

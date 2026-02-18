/**
 * Subscription Tiers & Feature Flags
 *
 * Defines the "One Free Taste" monetization model:
 * - Anonymous: 1 story (localStorage only), then auth gate
 * - Free (authenticated): 3 stories (cloud-backed), then upgrade prompt
 * - Premium ($9.99/mo): unlimited stories + all features
 */

export type SubscriptionTier = 'anonymous' | 'free' | 'premium';

export const TIER_LIMITS: Record<SubscriptionTier, number> = {
  anonymous: 1,
  free: 3,
  premium: Infinity,
};

export const TIER_FEATURES: Record<SubscriptionTier, {
  cloudBackup: boolean;
  narrativeProse: boolean;
  familySharing: boolean;
  photoDetective: boolean;
  lifeBook: boolean;
}> = {
  anonymous: {
    cloudBackup: false,
    narrativeProse: false,
    familySharing: false,
    photoDetective: false,
    lifeBook: false,
  },
  free: {
    cloudBackup: true,
    narrativeProse: true,
    familySharing: false,
    photoDetective: true,
    lifeBook: true,
  },
  premium: {
    cloudBackup: true,
    narrativeProse: true,
    familySharing: true,
    photoDetective: true,
    lifeBook: true,
  },
};

export const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  anonymous: 'Guest',
  free: 'Free',
  premium: 'Premium',
};

export const PREMIUM_PRICE_MONTHLY = 9.99;

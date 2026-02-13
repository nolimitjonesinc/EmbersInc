'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackTitle="Something went wrong"
      fallbackMessage="Don't worry — let's try starting over. Tap the button below."
    >
      {children}
    </ErrorBoundary>
  )
}

'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function ConversationLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackTitle="Something went wrong"
      fallbackMessage="Your stories are safe. Tap the button below to get back on track."
    >
      {children}
    </ErrorBoundary>
  )
}

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ERROR_MESSAGES } from '@/lib/errors/messages'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React error boundary for catching rendering crashes.
 * Shows an elderly-friendly message with a recovery button.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught rendering crash:', error, errorInfo.componentStack)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0908] flex flex-col items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <div className="text-6xl mb-6">🔥</div>
            <h1 className="text-2xl font-serif text-[#f9f7f2]/90 mb-4">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h1>
            <p className="text-lg text-[#f9f7f2]/60 font-serif leading-relaxed mb-8">
              {this.props.fallbackMessage || ERROR_MESSAGES.unexpectedCrash}
            </p>
            <button
              onClick={this.handleReload}
              className="px-8 py-4 rounded-full text-white font-medium text-lg transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #E86D48, #c45a3a)',
                boxShadow: '0 0 20px rgba(232, 109, 72, 0.2)',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

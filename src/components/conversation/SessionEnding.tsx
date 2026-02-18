'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AuthGate } from '@/components/subscription/AuthGate';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';

interface SessionEndingProps {
  userName: string;
  storyId?: string;
  onNewStory: () => void;
  mentionedPeople?: string[];
  themes?: string[];
  storyTitle?: string;
  conversationSummary?: string;
  /** Whether to show the auth gate (anonymous user at limit) */
  showAuthGate?: boolean;
  /** Whether to show the upgrade prompt (free user at limit) */
  showUpgradePrompt?: boolean;
  /** Current story count for the upgrade prompt */
  storiesCount?: number;
  /** Called when auth gate sign-up succeeds */
  onAuthSuccess?: () => void;
}

// Therapeutic closing messages based on themes
const themeClosingMessages: Record<string, string[]> = {
  family: [
    "Family stories like yours become the thread that connects generations.",
    "These family memories are precious gifts for those who come after.",
    "The love in your family story will echo through time."
  ],
  childhood: [
    "Childhood memories have a special way of staying with us forever.",
    "Those early years shape who we become. Thank you for sharing yours.",
    "Your childhood story is a window into who you truly are."
  ],
  love: [
    "Love stories, in all their forms, are the most treasured of all.",
    "The connections you've shared are what make life meaningful.",
    "This story of love will warm hearts for years to come."
  ],
  loss: [
    "Thank you for trusting me with this. It takes courage to share grief.",
    "Honoring those we've lost keeps their memory alive.",
    "Your love for them shines through every word."
  ],
  achievement: [
    "What a journey you've been on. These victories matter.",
    "Your accomplishments tell a story of perseverance.",
    "May this memory inspire others who face similar challenges."
  ],
  travel: [
    "Adventures like yours become part of who we are.",
    "The places we go shape the stories we tell.",
    "What a wonderful journey you've captured."
  ],
  work: [
    "The work we do becomes part of our legacy.",
    "Your professional journey is a testament to your dedication.",
    "These experiences have shaped you in important ways."
  ]
};

// Follow-up prompts for next conversation based on themes
const followUpPrompts: Record<string, string[]> = {
  family: [
    "Tell me about a holiday tradition in your family.",
    "What's a lesson someone in your family taught you?",
    "Who's the family storyteller? What tales do they tell?"
  ],
  childhood: [
    "What games did you love to play?",
    "Tell me about a childhood friend.",
    "What was your favorite hiding spot as a kid?"
  ],
  love: [
    "What's a small gesture that meant everything?",
    "Tell me about a time you felt truly seen.",
    "What makes someone unforgettable to you?"
  ],
  loss: [
    "What's something they taught you that you still carry?",
    "Is there a place that reminds you of them?",
    "What would you want to tell them today?"
  ],
  default: [
    "What's a smell that takes you right back?",
    "Who's someone whose voice you can still hear?",
    "What's a place that always felt like home?"
  ]
};

function getClosingMessage(themes: string[], userName: string): string {
  const baseMessage = userName ? `, ${userName}` : '';

  // Find the first matching theme
  for (const theme of themes) {
    const themeLower = theme.toLowerCase();
    for (const key of Object.keys(themeClosingMessages)) {
      if (themeLower.includes(key)) {
        const messages = themeClosingMessages[key];
        return messages[Math.floor(Math.random() * messages.length)];
      }
    }
  }

  // Default message
  return "Every story you share becomes a treasured part of your legacy.";
}

function getNextPromptSuggestion(themes: string[], mentionedPeople: string[]): string {
  // If people were mentioned, suggest a follow-up about them
  if (mentionedPeople.length > 0) {
    const person = mentionedPeople[Math.floor(Math.random() * mentionedPeople.length)];
    const personPrompts = [
      `Tell me more about ${person} next time.`,
      `I'd love to hear another story about ${person}.`,
      `What else comes to mind when you think of ${person}?`
    ];
    return personPrompts[Math.floor(Math.random() * personPrompts.length)];
  }

  // Otherwise, suggest based on themes
  for (const theme of themes) {
    const themeLower = theme.toLowerCase();
    for (const key of Object.keys(followUpPrompts)) {
      if (themeLower.includes(key)) {
        const prompts = followUpPrompts[key];
        return prompts[Math.floor(Math.random() * prompts.length)];
      }
    }
  }

  // Default prompts
  const defaultPrompts = followUpPrompts.default;
  return defaultPrompts[Math.floor(Math.random() * defaultPrompts.length)];
}

export function SessionEnding({
  userName,
  storyId,
  onNewStory,
  mentionedPeople = [],
  themes = [],
  storyTitle,
  conversationSummary,
  showAuthGate = false,
  showUpgradePrompt = false,
  storiesCount = 0,
  onAuthSuccess,
}: SessionEndingProps) {
  const [showMessage, setShowMessage] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  // Memoize the messages so they don't change on re-renders
  const closingMessage = useMemo(() => getClosingMessage(themes, userName), [themes, userName]);
  const nextPrompt = useMemo(() => getNextPromptSuggestion(themes, mentionedPeople), [themes, mentionedPeople]);

  useEffect(() => {
    // Stagger the animations for a gentle reveal
    const messageTimer = setTimeout(() => setShowMessage(true), 500);
    const summaryTimer = setTimeout(() => setShowSummary(true), 1200);
    const enrichmentTimer = setTimeout(() => setShowEnrichment(true), 2000);
    const buttonTimer = setTimeout(() => setShowButtons(true), 3000);

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(summaryTimer);
      clearTimeout(enrichmentTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  return (
    <div className="min-h-screen recording-environment flex flex-col items-center justify-center p-6 relative">
      {/* Grain overlay */}
      <div className="recording-grain" />
      {/* Vignette */}
      <div className="recording-vignette" />

      <div className="relative z-10 text-center max-w-lg space-y-10">
        {/* The ember - smaller, settled, content */}
        <div className="relative w-24 h-24 mx-auto">
          <span
            className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full animate-gentle-pulse"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
              boxShadow: `
                0 0 40px 12px rgba(232, 109, 72, 0.35),
                0 0 80px 30px rgba(232, 109, 72, 0.12)
              `,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        {/* Primary thank you message */}
        <div
          className={`space-y-4 transition-all duration-1000 ${
            showMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-2xl font-serif text-[#f9f7f2]/90">
            Thank you for sharing this with me{userName ? `, ${userName}` : ''}.
          </p>
          {storyTitle && (
            <p className="text-lg font-serif text-[#E86D48]/80 italic">
              &ldquo;{storyTitle}&rdquo;
            </p>
          )}
          <p className="text-lg text-[#f9f7f2]/60 font-serif leading-relaxed">
            {closingMessage}
          </p>
        </div>

        {/* Conversation summary - what was shared */}
        {conversationSummary && (
          <div
            className={`text-left bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 transition-all duration-1000 ${
              showSummary ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="text-xs uppercase tracking-widest text-[#E86D48]/60 mb-3">
              What you shared today
            </p>
            <p className="text-[#f9f7f2]/70 font-serif leading-relaxed text-sm">
              {conversationSummary}
            </p>
          </div>
        )}

        {/* Story enrichment / next steps */}
        <div
          className={`bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-1000 ${
            showEnrichment ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-sm uppercase tracking-widest text-[#f9f7f2]/40 mb-3">
            Next time...
          </p>
          <p className="text-[#f9f7f2]/70 font-serif italic">
            {nextPrompt}
          </p>
        </div>

        {/* Auth gate for anonymous users at limit */}
        {showAuthGate && (
          <div
            className={`transition-all duration-1000 ${
              showEnrichment ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <AuthGate
              userName={userName}
              storyTitle={storyTitle}
              onAuthSuccess={onAuthSuccess || (() => {})}
            />
          </div>
        )}

        {/* Upgrade prompt for free users at limit */}
        {showUpgradePrompt && (
          <div
            className={`transition-all duration-1000 ${
              showEnrichment ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <UpgradePrompt storiesCount={storiesCount} userName={userName} />
          </div>
        )}

        {/* Action buttons — hidden when auth gate or upgrade prompt is showing */}
        {!showAuthGate && !showUpgradePrompt && (
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ${
              showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <button
              onClick={onNewStory}
              className="px-8 py-4 rounded-full text-white transition-all hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #E86D48, #c45a3a)',
                boxShadow: '0 0 30px rgba(232, 109, 72, 0.3)'
              }}
            >
              Share Another Memory
            </button>
            {storyId && (
              <Link
                href="/life-book"
                className="px-8 py-4 rounded-full border border-white/20 text-[#f9f7f2]/70 hover:bg-white/5 hover:border-white/30 transition-all"
              >
                View Life Book
              </Link>
            )}
          </div>
        )}

        {/* Edit story link */}
        {storyId && (
          <Link
            href={`/stories/${storyId}/edit`}
            className={`text-[#f9f7f2]/40 hover:text-[#E86D48]/70 text-sm transition-all block ${
              showButtons ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Edit this story →
          </Link>
        )}

        {/* Subtle home link */}
        <Link
          href="/"
          className={`text-[#f9f7f2]/30 hover:text-[#f9f7f2]/50 text-sm transition-all block ${
            showButtons ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Return home
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllPromptPacks, allRelationshipCategories } from '@/data/familyPrompts';

// ─── Build prompt categories from curated library ────────────────────────────

interface PromptCategoryView {
  label: string;
  icon: string;
  questions: string[];
}

// Combine themed packs + a selection of relationship categories for inspiration
const PROMPT_CATEGORIES: PromptCategoryView[] = [
  // Themed packs first (these are the "highlight reel")
  ...getAllPromptPacks().map((pack) => ({
    label: pack.label,
    icon: pack.icon,
    questions: pack.prompts.map((p) => p.text),
  })),
  // Then relationship-based categories
  ...allRelationshipCategories.map((cat) => ({
    label: cat.label,
    icon: cat.icon,
    questions: cat.prompts.map((p) => p.text),
  })),
];

const RELATIONSHIP_OPTIONS = [
  'Daughter',
  'Son',
  'Granddaughter',
  'Grandson',
  'Niece',
  'Nephew',
  'Friend',
  'Spouse',
  'Sibling',
  'Other',
] as const;

const MAX_CHARS = 500;

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState = 'loading' | 'form' | 'success' | 'error';
type ErrorType = 'invalid' | 'rate-limited' | 'queue-full' | 'generic';

interface FamilyInfo {
  firstName: string;
  familyName: string;
  familyGroupId: string;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function AskPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = use(params);

  // Page state
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorType, setErrorType] = useState<ErrorType>('generic');
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inspiration panel
  const [showInspiration, setShowInspiration] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  // TODO: Post-launch — wire email notification signup on success screen

  // ── Fetch family info ───────────────────────────────────────────────────────

  useEffect(() => {
    async function loadFamily() {
      try {
        const res = await fetch(`/api/family/invite/${familyId}`);
        if (!res.ok) {
          setErrorType('invalid');
          setPageState('error');
          return;
        }
        const data = await res.json();
        setFamilyInfo({
          firstName: data.storytellerName || 'your loved one',
          familyName: data.familyName || '',
          familyGroupId: data.familyGroupId || '',
        });
        setPageState('form');
      } catch {
        setErrorType('generic');
        setPageState('error');
      }
    }
    loadFamily();
  }, [familyId]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const storytellerName = familyInfo?.firstName || 'your loved one';
  const charCount = question.length;
  const canSubmit =
    name.trim().length > 0 &&
    relationship.length > 0 &&
    question.trim().length > 0 &&
    charCount <= MAX_CHARS;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSelectPrompt = (q: string) => {
    setQuestion(q);
    setShowInspiration(false);
    setExpandedCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/family/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyGroupId: familyInfo?.familyGroupId,
          submitterName: name.trim(),
          submitterRelationship: relationship,
          content: question.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setErrorType('rate-limited');
        } else if (res.status === 409) {
          setErrorType('queue-full');
        } else {
          setErrorType(data.errorType || 'generic');
        }
        setPageState('error');
        return;
      }

      setPageState('success');
    } catch {
      setErrorType('generic');
      setPageState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setRelationship('');
    setQuestion('');
    setPageState('form');
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const errorMessages: Record<ErrorType, { title: string; body: string }> = {
    invalid: {
      title: "This link doesn't seem to be working",
      body: 'Ask your family member to send you a new invite link.',
    },
    'rate-limited': {
      title: "You've sent a few questions already",
      body: 'Please wait a bit before sending more.',
    },
    'queue-full': {
      title: `${storytellerName} has plenty of questions waiting!`,
      body: 'Give them some time to answer, then come back.',
    },
    generic: {
      title: 'Something went wrong',
      body: 'Please try again.',
    },
  };

  // ── Loading State ───────────────────────────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <PageShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 mx-auto rounded-lg bg-white/5" />
          <div className="h-5 w-72 mx-auto rounded-lg bg-white/5" />
          <div className="h-12 w-full rounded-xl bg-white/5 mt-8" />
          <div className="h-12 w-full rounded-xl bg-white/5" />
          <div className="h-32 w-full rounded-xl bg-white/5" />
          <div className="h-14 w-full rounded-xl bg-white/5 mt-4" />
        </div>
      </PageShell>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────

  if (pageState === 'error') {
    const err = errorMessages[errorType];
    return (
      <PageShell>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-2xl">
              {errorType === 'invalid' ? '🔗' : '⏳'}
            </span>
          </div>
          <h2 className="text-xl font-serif text-[#f5f0eb] mb-3">
            {err.title}
          </h2>
          <p className="text-[#f5f0eb]/50 text-base leading-relaxed mb-8">
            {err.body}
          </p>
          {(errorType === 'generic' || errorType === 'rate-limited') && (
            <button
              onClick={() => setPageState('form')}
              className="text-[#E86D48] hover:text-[#E86D48]/80 transition-colors text-base"
            >
              Go back
            </button>
          )}
        </motion.div>
      </PageShell>
    );
  }

  // ── Success State ───────────────────────────────────────────────────────────

  if (pageState === 'success') {
    return (
      <PageShell>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-8"
        >
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(232, 109, 72, 0.15), rgba(245, 166, 35, 0.15))',
              border: '1px solid rgba(232, 109, 72, 0.3)',
            }}
          >
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-10 h-10 text-[#E86D48]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            </motion.svg>
          </motion.div>

          <h2 className="text-2xl font-serif text-[#f5f0eb] mb-3">
            Your question has been sent!
          </h2>
          <p className="text-[#f5f0eb]/50 text-base leading-relaxed mb-10 max-w-xs mx-auto">
            {storytellerName === 'your loved one'
              ? "They'll hear it in their next conversation with Ember."
              : `${storytellerName} will hear it in their next conversation with Ember.`}
          </p>

          <p className="text-sm text-white/50 mt-4 mb-8">
            Check back soon to see if they've answered!
          </p>

          <button
            onClick={handleReset}
            className="text-[#E86D48] hover:text-[#E86D48]/80 transition-colors text-base"
          >
            Ask Another Question
          </button>
        </motion.div>
      </PageShell>
    );
  }

  // ── Main Form ───────────────────────────────────────────────────────────────

  return (
    <PageShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-[#f5f0eb] mb-3 leading-snug">
            Help{' '}
            <span className="text-ember-gradient bg-gradient-to-r from-[#E86D48] to-[#F5A623] bg-clip-text text-transparent">
              {storytellerName}
            </span>{' '}
            preserve their memories
          </h1>
          <p className="text-[#f5f0eb]/45 text-base leading-relaxed">
            Ask a question, and {storytellerName} will hear it in their next
            conversation with Ember — our AI companion that helps people share
            their life stories.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="submitter-name"
              className="block text-sm text-[#f5f0eb]/60 mb-2 font-medium"
            >
              Your Name
            </label>
            <input
              id="submitter-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Emma"
              required
              autoComplete="given-name"
              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-[#f5f0eb] placeholder-[#f5f0eb]/25 text-base leading-normal focus:outline-none focus:border-[#E86D48]/50 transition-colors"
            />
          </div>

          {/* Relationship */}
          <div>
            <label
              htmlFor="relationship"
              className="block text-sm text-[#f5f0eb]/60 mb-2 font-medium"
            >
              Your Relationship
            </label>
            <select
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              required
              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-[#f5f0eb] text-base leading-normal focus:outline-none focus:border-[#E86D48]/50 transition-colors appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='rgba(245,240,235,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                backgroundSize: '16px',
              }}
            >
              <option value="" disabled className="bg-[#1a1a2e] text-[#f5f0eb]">
                Select relationship
              </option>
              {RELATIONSHIP_OPTIONS.map((rel) => (
                <option
                  key={rel}
                  value={rel}
                  className="bg-[#1a1a2e] text-[#f5f0eb]"
                >
                  {rel}
                </option>
              ))}
            </select>
          </div>

          {/* Question */}
          <div>
            <label
              htmlFor="question"
              className="block text-sm text-[#f5f0eb]/60 mb-2 font-medium"
            >
              Your Question
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setQuestion(e.target.value);
                }
              }}
              placeholder="What would you love to know about their life?"
              required
              rows={5}
              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-[#f5f0eb] placeholder-[#f5f0eb]/25 text-base leading-relaxed focus:outline-none focus:border-[#E86D48]/50 transition-colors resize-none"
            />
            <div className="flex justify-end mt-1.5">
              <span
                className={`text-xs transition-colors ${
                  charCount > MAX_CHARS * 0.9
                    ? 'text-[#E86D48]'
                    : 'text-[#f5f0eb]/30'
                }`}
              >
                {charCount} / {MAX_CHARS}
              </span>
            </div>
          </div>

          {/* Inspiration Section */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowInspiration(!showInspiration)}
              className="flex items-center gap-2 text-[#E86D48]/80 hover:text-[#E86D48] transition-colors text-sm font-medium w-full justify-center py-2"
            >
              <span>Need inspiration?</span>
              <motion.svg
                animate={{ rotate: showInspiration ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </motion.svg>
            </button>

            <AnimatePresence>
              {showInspiration && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-3">
                    {PROMPT_CATEGORIES.map((cat, idx) => (
                      <div
                        key={cat.label}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCategory(
                              expandedCategory === idx ? null : idx
                            )
                          }
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-sm text-[#f5f0eb]/70 font-medium flex-1">
                            {cat.label}
                          </span>
                          <motion.svg
                            animate={{
                              rotate: expandedCategory === idx ? 180 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                            className="w-4 h-4 text-[#f5f0eb]/30 flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </motion.svg>
                        </button>

                        <AnimatePresence>
                          {expandedCategory === idx && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-3 space-y-1.5">
                                {cat.questions.map((q) => (
                                  <button
                                    key={q}
                                    type="button"
                                    onClick={() => handleSelectPrompt(q)}
                                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#f5f0eb]/55 hover:text-[#f5f0eb]/90 hover:bg-white/[0.05] transition-all leading-relaxed"
                                  >
                                    {q}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full py-4 rounded-xl text-white text-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, #E86D48, #c45a3a)'
                : 'rgba(255,255,255,0.08)',
              boxShadow: canSubmit
                ? '0 4px 24px rgba(232, 109, 72, 0.3)'
                : 'none',
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <svg
                  className="animate-spin w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="opacity-75"
                  />
                </svg>
                Sending...
              </span>
            ) : (
              'Send Your Question'
            )}
          </button>
        </form>
      </motion.div>
    </PageShell>
  );
}

// ─── Page Shell ───────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f0eb] relative overflow-x-hidden">
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center top,
            rgba(232, 109, 72, 0.06) 0%,
            rgba(26, 26, 46, 0.4) 40%,
            #0a0a0a 70%)`,
        }}
      />

      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-[480px] mx-auto px-5 py-10 sm:py-16">
        {/* Embers Wordmark */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
              boxShadow: '0 0 12px 3px rgba(232, 109, 72, 0.35)',
            }}
          />
          <span className="text-xl font-serif tracking-wide text-[#f5f0eb]/80">
            Embers
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}

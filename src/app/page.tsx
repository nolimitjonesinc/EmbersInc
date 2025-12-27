'use client';

import Link from 'next/link';
import { AmbientFire } from '@/components/conversation/AmbientFire';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0908] text-[#f9f7f2] overflow-hidden">
      {/* Subtle grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow from bottom - fire light */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full h-[80%] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center bottom,
            rgba(232, 109, 72, 0.12) 0%,
            rgba(196, 90, 58, 0.06) 30%,
            rgba(120, 50, 30, 0.02) 50%,
            transparent 70%)`,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0a0908]/60 backdrop-blur-md border-b border-white/[0.03]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span
              className="w-3 h-3 rounded-full transition-all duration-500 group-hover:scale-110"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                boxShadow: '0 0 15px 4px rgba(232, 109, 72, 0.4)',
              }}
            />
            <span className="text-xl font-serif tracking-wide text-[#f9f7f2]/80 group-hover:text-[#f9f7f2] transition-colors">
              Embers
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/stories"
              className="text-[#f9f7f2]/40 hover:text-[#f9f7f2]/80 transition-colors text-sm tracking-wide hidden sm:block"
            >
              Stories
            </Link>
            <Link
              href="/life-book"
              className="text-[#f9f7f2]/40 hover:text-[#f9f7f2]/80 transition-colors text-sm tracking-wide hidden sm:block"
            >
              Life Book
            </Link>
            <Link
              href="/conversation"
              className="px-5 py-2.5 rounded-full text-sm tracking-wide transition-all border border-[#E86D48]/20 text-[#E86D48]/80 hover:border-[#E86D48]/50 hover:bg-[#E86D48]/10"
            >
              Begin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
          {/* The Ambient Fire - Central Focus */}
          <div className="relative mb-12">
            <AmbientFire size="large" />
          </div>

          {/* Headline */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight tracking-tight text-[#f9f7f2]/95">
              Your stories deserve to live forever
            </h1>
            <p className="text-lg md:text-xl text-[#f9f7f2]/40 font-light leading-relaxed max-w-2xl mx-auto">
              Speak your memories. Let them become gifts for those you love—across
              time, across generations.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <Link
              href="/conversation"
              className="group relative px-10 py-4 rounded-full text-base tracking-wide transition-all overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #E86D48 0%, #c45a3a 100%)',
                boxShadow: '0 0 40px rgba(232, 109, 72, 0.25)',
              }}
            >
              <span className="relative z-10 text-white">Start Sharing</span>
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-xs text-[#f9f7f2]/25 tracking-wide">
              No account needed. Just your voice and your memories.
            </p>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#f9f7f2]/20">
            <span className="text-[10px] tracking-[0.2em] uppercase">Discover</span>
            <svg
              className="w-4 h-4 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-32 px-6 relative">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(232, 109, 72, 0.04) 0%, transparent 60%)',
            }}
          />
          <div className="max-w-3xl mx-auto text-center relative">
            <div className="text-[#E86D48]/30 text-5xl mb-6 font-serif">&ldquo;</div>
            <blockquote className="text-xl md:text-2xl lg:text-3xl font-serif leading-relaxed text-[#f9f7f2]/70 mb-6">
              It was Christmas 1952, and we had this beautiful pine tree that barely
              fit through the door. The star on top was bent from where it hit the
              ceiling, but Mom said it looked like it was winking at us...
            </blockquote>
            <p className="text-[#f9f7f2]/25 font-light italic text-sm">
              A memory preserved forever
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif text-center mb-20 text-[#f9f7f2]/80">
              As natural as a conversation
            </h2>
            <div className="grid md:grid-cols-3 gap-16">
              {[
                {
                  step: '01',
                  title: 'Speak',
                  description:
                    'Tap the ember and talk naturally. Share whatever comes to mind—a memory, a feeling, a moment.',
                },
                {
                  step: '02',
                  title: 'Listen',
                  description:
                    'A patient companion asks gentle questions, helping you remember details you thought were lost.',
                },
                {
                  step: '03',
                  title: 'Preserve',
                  description:
                    'Your stories become part of your Life Book—organized, searchable, ready to share.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="text-[#E86D48]/20 text-4xl font-light mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-serif mb-3 text-[#f9f7f2]/80">
                    {item.title}
                  </h3>
                  <p className="text-[#f9f7f2]/35 leading-relaxed text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Life Book Preview */}
        <section className="py-32 px-6 bg-[#080706]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-serif mb-4 text-[#f9f7f2]/80">
                Your Life Book
              </h2>
              <p className="text-[#f9f7f2]/35 text-base max-w-xl mx-auto">
                Every story finds its place in seven meaningful chapters
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { title: 'Who I Am', color: '#E86D48' },
                { title: 'Where I Come From', color: '#8B5E3C' },
                { title: "What I've Loved", color: '#D64545' },
                { title: "What I've Learned", color: '#5DADE2' },
                { title: "What's Been Hard", color: '#5D6D7E' },
                { title: 'Still Figuring Out', color: '#9B59B6' },
                { title: 'What I Want You to Know', color: '#F5A623' },
              ].map((chapter) => (
                <div
                  key={chapter.title}
                  className="relative p-5 rounded-xl border border-white/[0.04] hover:border-white/10 transition-all group cursor-pointer overflow-hidden"
                >
                  {/* Subtle glow */}
                  <div
                    className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity blur-2xl"
                    style={{ backgroundColor: chapter.color }}
                  />
                  <h3 className="relative text-sm font-serif text-[#f9f7f2]/60 group-hover:text-[#f9f7f2]/90 transition-colors">
                    {chapter.title}
                  </h3>
                </div>
              ))}
              <Link
                href="/life-book"
                className="p-5 rounded-xl border border-dashed border-white/[0.06] hover:border-[#E86D48]/30 transition-all flex items-center justify-center group"
              >
                <span className="text-[#f9f7f2]/25 group-hover:text-[#E86D48]/60 transition-colors text-sm">
                  Explore →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-32 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif text-center mb-16 text-[#f9f7f2]/80">
              Designed with care
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              {[
                {
                  title: 'Voice first',
                  description:
                    'No typing required. Just speak naturally, like talking to an old friend.',
                },
                {
                  title: 'Patient and kind',
                  description:
                    'Take all the time you need. Pause, think, remember. There is no rush here.',
                },
                {
                  title: 'Clear and readable',
                  description:
                    'Large text, high contrast, intuitive flow. Designed for comfort.',
                },
                {
                  title: 'Private and secure',
                  description:
                    'Your stories are yours. Share only what you choose, with whom you choose.',
                },
              ].map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="w-px bg-gradient-to-b from-[#E86D48]/40 to-transparent flex-shrink-0" />
                  <div>
                    <h3 className="text-base font-medium mb-2 text-[#f9f7f2]/70">
                      {feature.title}
                    </h3>
                    <p className="text-[#f9f7f2]/35 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 relative">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center bottom, rgba(232, 109, 72, 0.08) 0%, transparent 60%)',
            }}
          />
          <div className="max-w-2xl mx-auto text-center relative">
            {/* Small ember */}
            <div className="w-12 h-12 mx-auto mb-10 relative">
              <span
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                  boxShadow: '0 0 30px 8px rgba(232, 109, 72, 0.35)',
                  animation: 'ember-glow 5s ease-in-out infinite',
                }}
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif mb-4 text-[#f9f7f2]/90">
              Your family is waiting to hear your story
            </h2>
            <p className="text-[#f9f7f2]/35 text-base mb-10">
              Every memory you share becomes a gift that transcends time.
            </p>
            <Link
              href="/conversation"
              className="inline-block px-10 py-4 rounded-full text-base tracking-wide transition-all text-white"
              style={{
                background: 'linear-gradient(135deg, #E86D48 0%, #c45a3a 100%)',
                boxShadow: '0 0 35px rgba(232, 109, 72, 0.3)',
              }}
            >
              Begin Your Story
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.03] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                boxShadow: '0 0 8px 2px rgba(232, 109, 72, 0.3)',
              }}
            />
            <span className="font-serif text-base text-[#f9f7f2]/50">Embers</span>
          </div>
          <p className="text-[#f9f7f2]/20 text-xs">
            © {new Date().getFullYear()} Embers Inc. Preserving stories for
            generations.
          </p>
          <div className="flex gap-6 text-xs text-[#f9f7f2]/20">
            <Link
              href="/privacy"
              className="hover:text-[#f9f7f2]/40 transition-colors"
            >
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#f9f7f2]/40 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes ember-glow {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 0 30px 8px rgba(232, 109, 72, 0.35);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            box-shadow: 0 0 40px 12px rgba(232, 109, 72, 0.45);
          }
        }
      `}</style>
    </div>
  );
}

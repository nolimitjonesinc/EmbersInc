'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1a1714] text-[#f9f7f2] overflow-hidden">
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Warm ambient glow from top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(232, 109, 72, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#1a1714]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                boxShadow: '0 0 20px 5px rgba(232, 109, 72, 0.4)',
              }}
            />
            <span className="text-2xl font-serif tracking-wide">Embers</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/stories"
              className="text-[#f9f7f2]/60 hover:text-[#f9f7f2] transition-colors text-sm tracking-wide hidden sm:block"
            >
              Stories
            </Link>
            <Link
              href="/life-book"
              className="text-[#f9f7f2]/60 hover:text-[#f9f7f2] transition-colors text-sm tracking-wide hidden sm:block"
            >
              Life Book
            </Link>
            <Link
              href="/conversation"
              className="px-5 py-2.5 rounded-full text-sm tracking-wide transition-all border border-[#E86D48]/30 hover:border-[#E86D48] hover:bg-[#E86D48]/10"
            >
              Begin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
          {/* The Ember - Central Focus */}
          <div className="relative w-48 h-48 mb-16">
            {/* Outer glow rings */}
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(232, 109, 72, 0.3) 0%, transparent 70%)',
                animation: 'pulse 4s ease-in-out infinite',
              }}
            />
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-30"
              style={{
                background: 'radial-gradient(circle, rgba(232, 109, 72, 0.4) 0%, transparent 70%)',
                animation: 'pulse 4s ease-in-out infinite 1s',
              }}
            />
            {/* The core ember */}
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                boxShadow: `
                  0 0 60px 20px rgba(232, 109, 72, 0.5),
                  0 0 120px 40px rgba(232, 109, 72, 0.25),
                  0 0 180px 60px rgba(232, 109, 72, 0.1)
                `,
                animation: 'ember-glow 5s ease-in-out infinite',
              }}
            />
          </div>

          {/* Headline */}
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight tracking-tight">
              Your stories deserve to live forever
            </h1>
            <p className="text-xl md:text-2xl text-[#f9f7f2]/60 font-light leading-relaxed max-w-2xl mx-auto">
              Speak your memories. Let them become gifts for those you love—across time, across generations.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-16 flex flex-col items-center gap-6">
            <Link
              href="/conversation"
              className="group relative px-10 py-4 rounded-full text-lg tracking-wide transition-all overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #E86D48 0%, #c45a3a 100%)',
                boxShadow: '0 0 30px rgba(232, 109, 72, 0.3)',
              }}
            >
              <span className="relative z-10">Start Sharing</span>
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-sm text-[#f9f7f2]/40">
              No account needed. Just your voice and your memories.
            </p>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-[#f9f7f2]/30">
            <span className="text-xs tracking-widest uppercase">Discover</span>
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* The Story Quote Section */}
        <section className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#E86D48]/5 to-transparent" />
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="text-[#E86D48]/60 text-6xl mb-8 font-serif">&ldquo;</div>
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-serif leading-relaxed text-[#f9f7f2]/90 mb-8">
              It was Christmas 1952, and we had this beautiful pine tree that barely fit through the door.
              The star on top was bent from where it hit the ceiling, but Mom said it looked like it was winking at us...
            </blockquote>
            <p className="text-[#f9f7f2]/40 font-light italic">
              A memory preserved forever
            </p>
          </div>
        </section>

        {/* How It Works - Minimal */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif text-center mb-20">
              As natural as a conversation
            </h2>
            <div className="grid md:grid-cols-3 gap-16">
              {[
                {
                  step: '01',
                  title: 'Speak',
                  description: 'Press the ember and talk naturally. Share whatever comes to mind—a memory, a feeling, a moment.',
                },
                {
                  step: '02',
                  title: 'Listen',
                  description: 'A patient companion asks gentle questions, helping you remember details you thought were lost.',
                },
                {
                  step: '03',
                  title: 'Preserve',
                  description: 'Your stories become part of your Life Book—organized, searchable, ready to share with those you love.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="text-[#E86D48]/30 text-5xl font-light mb-6">{item.step}</div>
                  <h3 className="text-xl font-serif mb-4">{item.title}</h3>
                  <p className="text-[#f9f7f2]/50 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Life Book Preview */}
        <section className="py-32 px-6 bg-[#141210]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-serif mb-6">
                Your Life Book
              </h2>
              <p className="text-[#f9f7f2]/50 text-lg max-w-2xl mx-auto">
                Every story finds its place in seven meaningful chapters—the architecture of a life.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: '🌟', title: 'Who I Am', color: '#E86D48' },
                { icon: '🏡', title: 'Where I Come From', color: '#8B5E3C' },
                { icon: '❤️', title: "What I've Loved", color: '#D64545' },
                { icon: '📚', title: "What I've Learned", color: '#5DADE2' },
                { icon: '🌧️', title: "What's Been Hard", color: '#5D6D7E' },
                { icon: '🔮', title: "Still Figuring Out", color: '#9B59B6' },
                { icon: '💌', title: 'What I Want You to Know', color: '#F5A623' },
              ].map((chapter) => (
                <div
                  key={chapter.title}
                  className="p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${chapter.color}08 0%, transparent 100%)`,
                  }}
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{chapter.icon}</div>
                  <h3 className="text-sm font-medium text-[#f9f7f2]/80">{chapter.title}</h3>
                </div>
              ))}
              <Link
                href="/life-book"
                className="p-6 rounded-2xl border border-dashed border-white/10 hover:border-[#E86D48]/50 transition-all flex items-center justify-center group"
              >
                <span className="text-[#f9f7f2]/40 group-hover:text-[#E86D48] transition-colors text-sm">
                  Explore →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Designed for Everyone */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif text-center mb-20">
              Designed with care
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              {[
                {
                  title: 'Voice first',
                  description: 'No typing required. Just speak naturally, like talking to an old friend.',
                },
                {
                  title: 'Patient and kind',
                  description: 'Take all the time you need. Pause, think, remember. There is no rush here.',
                },
                {
                  title: 'Clear and readable',
                  description: 'Large text, high contrast, intuitive flow. Designed for comfort.',
                },
                {
                  title: 'Private and secure',
                  description: 'Your stories are yours. Share only what you choose, with whom you choose.',
                },
              ].map((feature) => (
                <div key={feature.title} className="flex gap-5">
                  <div className="w-px bg-gradient-to-b from-[#E86D48] to-transparent flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                    <p className="text-[#f9f7f2]/50 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#E86D48]/10 to-transparent" />
          <div className="max-w-3xl mx-auto text-center relative">
            {/* Small ember */}
            <div className="w-16 h-16 mx-auto mb-12 relative">
              <span
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                  boxShadow: '0 0 40px 10px rgba(232, 109, 72, 0.4)',
                }}
              />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif mb-6">
              Your family is waiting to hear your story
            </h2>
            <p className="text-[#f9f7f2]/50 text-lg mb-12">
              Every memory you share becomes a gift that transcends time.
            </p>
            <Link
              href="/conversation"
              className="inline-block px-12 py-5 rounded-full text-lg tracking-wide transition-all"
              style={{
                background: 'linear-gradient(135deg, #E86D48 0%, #c45a3a 100%)',
                boxShadow: '0 0 40px rgba(232, 109, 72, 0.35)',
              }}
            >
              Begin Your Story
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #f4a574, #E86D48 50%, #c45a3a)',
                boxShadow: '0 0 10px 3px rgba(232, 109, 72, 0.3)',
              }}
            />
            <span className="font-serif text-lg">Embers</span>
          </div>
          <p className="text-[#f9f7f2]/30 text-sm">
            © {new Date().getFullYear()} Embers Inc. Preserving stories for generations.
          </p>
          <div className="flex gap-8 text-sm text-[#f9f7f2]/30">
            <Link href="/privacy" className="hover:text-[#f9f7f2]/60 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#f9f7f2]/60 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes ember-glow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow:
              0 0 60px 20px rgba(232, 109, 72, 0.5),
              0 0 120px 40px rgba(232, 109, 72, 0.25),
              0 0 180px 60px rgba(232, 109, 72, 0.1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            box-shadow:
              0 0 80px 30px rgba(232, 109, 72, 0.6),
              0 0 150px 50px rgba(232, 109, 72, 0.3),
              0 0 200px 70px rgba(232, 109, 72, 0.15);
          }
        }
      `}</style>
    </div>
  );
}

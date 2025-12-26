import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🔥</span>
            <span className="text-2xl font-bold text-ember-gradient">Embers</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/conversation"
              className="text-gray-600 hover:text-ember-orange transition-colors hidden sm:block"
            >
              Start Talking
            </Link>
            <Button asChild size="sm">
              <Link href="/onboarding">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-24">
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Share Your{' '}
                <span className="text-ember-gradient">Family Stories</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Preserve your memories for generations. Just speak naturally, and
                Embers will guide you through sharing your life stories with your
                family.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link href="/onboarding">Start Your Story</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                No account needed. Just start talking.
              </p>
            </div>
            <div className="relative">
              <div className="bg-ember-gradient-subtle rounded-3xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="text-8xl animate-float">🔥</div>
                  <p className="text-lg text-gray-600 italic">
                    &ldquo;Every story you share is a gift to future generations&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              As Easy as Having a{' '}
              <span className="text-ember-gradient">Conversation</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🎙️',
                  title: 'Just Talk',
                  description:
                    'Press the button and speak naturally. Share memories like you\'re talking to a friend.',
                },
                {
                  icon: '💬',
                  title: 'We Listen & Ask',
                  description:
                    'Our AI companion asks thoughtful follow-up questions to help you remember more.',
                },
                {
                  icon: '📖',
                  title: 'Your Story Grows',
                  description:
                    'Your stories are organized into a beautiful Life Book to share with family.',
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="text-center p-8 rounded-2xl bg-background hover:shadow-lg transition-shadow"
                >
                  <div className="text-5xl mb-6">{step.icon}</div>
                  <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Life Book Chapters */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
              Your <span className="text-ember-gradient">Life Book</span>
            </h2>
            <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto mb-16">
              Stories are organized into meaningful chapters that capture the
              essence of your life.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '🌟', title: 'Who I Am', color: 'bg-orange-50' },
                { icon: '🏡', title: 'Where I Come From', color: 'bg-amber-50' },
                { icon: '❤️', title: "What I've Loved", color: 'bg-red-50' },
                { icon: '📚', title: "What I've Learned", color: 'bg-blue-50' },
                { icon: '🌧️', title: "What's Been Hard", color: 'bg-gray-50' },
                { icon: '🔮', title: "Still Figuring Out", color: 'bg-purple-50' },
                { icon: '💌', title: 'What I Want You to Know', color: 'bg-yellow-50' },
              ].map((chapter, index) => (
                <div
                  key={index}
                  className={`${chapter.color} rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer`}
                >
                  <div className="text-3xl mb-3">{chapter.icon}</div>
                  <h3 className="font-semibold text-gray-800">{chapter.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial / Example */}
        <section className="bg-ember-gradient text-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="text-6xl mb-8">✨</div>
            <blockquote className="text-2xl md:text-3xl font-light italic leading-relaxed mb-8">
              &ldquo;It was Christmas 1952, and we had this beautiful pine tree
              that barely fit through the door. The star on top was bent from
              where it hit the ceiling, but Mom said it looked like it was
              winking at us...&rdquo;
            </blockquote>
            <p className="text-lg opacity-90">
              — A story preserved for generations
            </p>
          </div>
        </section>

        {/* Features for Seniors */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Designed for <span className="text-ember-gradient">Everyone</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: '🗣️',
                  title: 'Voice First',
                  description:
                    'No typing required. Just press the big button and talk naturally.',
                },
                {
                  icon: '👁️',
                  title: 'Large, Clear Text',
                  description:
                    'Easy to read on any device with high contrast and big buttons.',
                },
                {
                  icon: '🤝',
                  title: 'Patient & Kind',
                  description:
                    'Take your time. There\'s no rush. Pause whenever you need.',
                },
                {
                  icon: '👨‍👩‍👧‍👦',
                  title: 'Family Sharing',
                  description:
                    'Easily share stories with family members via a simple link.',
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex gap-6 p-6 rounded-2xl bg-background"
                >
                  <div className="text-4xl">{feature.icon}</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Share Your Story?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Your family is waiting to hear your memories. Start preserving them
              today.
            </p>
            <Button asChild size="xl">
              <Link href="/onboarding">Start Talking Now</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className="text-xl font-bold">Embers</span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Embers Inc. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

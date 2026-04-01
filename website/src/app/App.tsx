import { ByteLogoMark } from './components/ByteLogoMark';
import { Navbar } from './components/Navbar';
import { PhoneMockup } from './components/PhoneMockup';
import { FeatureCard } from './components/FeatureCard';
import { AppScreen } from './components/AppScreen';

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      <Navbar />

      {/* Hero */}
      <section className="px-6 pb-20 pt-32">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2 lg:items-center">
          <div className="space-y-7">
            <h1 className="text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Nutrition tracking,
              <br />
              <span className="text-stone-400">without the clutter.</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-stone-400">
              Byte helps you log meals, hit macro targets, and build consistency with a calm, focused interface.
            </p>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-stone-200">
                Download Byte
              </button>
              <button className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30">
                See How It Works
              </button>
            </div>
          </div>

          <div className="relative mx-auto h-[540px] w-full max-w-[680px]">
            <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <PhoneMockup screenContent={<AppScreen type="dashboard" />} scale={1.03} rotation={-1.5} glow />
            </div>
            <div className="absolute left-1 top-1/2 hidden -translate-y-1/2 opacity-65 sm:block">
              <PhoneMockup screenContent={<AppScreen type="meals" />} scale={0.72} rotation={-8} />
            </div>
            <div className="absolute right-1 top-1/2 hidden -translate-y-1/2 opacity-65 sm:block">
              <PhoneMockup screenContent={<AppScreen type="progress" />} scale={0.72} rotation={8} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-white/10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 space-y-4 text-center">
            <h2 className="text-4xl tracking-tight sm:text-5xl">
              Everything you need.
              <br />
              <span className="text-stone-400">Nothing you do not.</span>
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={
                <svg className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Simple Tracking"
              description="Log meals quickly with minimal friction. No endless food databases or barcode scanning."
            />

            <FeatureCard
              icon={
                <svg className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Clear Progress"
              description="Weekly insights and macro tracking that actually make sense at a glance."
            />

            <FeatureCard
              icon={
                <svg className="h-6 w-6 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              }
              title="Voice Logging"
              description="Start cooking and log with voice. Hands-free tracking that fits your workflow."
            />

            <FeatureCard
              icon={
                <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
              title="Consistency Focused"
              description="Designed to build habits, not guilt. Track progress without the pressure."
            />
          </div>
        </div>
      </section>

      {/* Product */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl tracking-tight sm:text-5xl">Built to feel effortless.</h2>
            <p className="mt-3 text-lg text-stone-400">Simple surfaces. Clear metrics. No noise.</p>
          </div>

          <div className="grid items-center gap-6 md:grid-cols-3">
            <div className="mx-auto">
              <PhoneMockup screenContent={<AppScreen type="meals" />} scale={0.82} rotation={-5} />
            </div>
            <div className="mx-auto">
              <PhoneMockup screenContent={<AppScreen type="dashboard" />} scale={1.03} glow />
            </div>
            <div className="mx-auto">
              <PhoneMockup screenContent={<AppScreen type="goals" />} scale={0.82} rotation={5} />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-y border-white/10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 space-y-4 text-center">
            <h2 className="text-4xl tracking-tight sm:text-5xl">Get started in minutes</h2>
            <p className="text-lg text-stone-400">Three steps to better nutrition consistency.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-black">1</div>
              <h3 className="text-xl font-semibold text-white">Set your goals</h3>
              <p className="mt-2 leading-relaxed text-stone-400">
                Pick your calorie and macro targets once and Byte handles the rest.
              </p>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-black">2</div>
              <h3 className="text-xl font-semibold text-white">Log meals fast</h3>
              <p className="mt-2 leading-relaxed text-stone-400">
                Type, tap, or voice-log meals in seconds while your day keeps moving.
              </p>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-black">3</div>
              <h3 className="text-xl font-semibold text-white">Stay consistent</h3>
              <p className="mt-2 leading-relaxed text-stone-400">
                Review trends weekly and improve with small, repeatable adjustments.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <h2 className="text-5xl tracking-tight sm:text-6xl">Ready when you are.</h2>

          <p className="text-lg text-stone-400">
            Download Byte and start building better nutrition habits today.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-stone-200">
              Download Byte
            </button>
          </div>

          <p className="pt-4 text-sm text-stone-500">Available on iOS and Android • Free to download</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center py-1">
              <ByteLogoMark />
            </div>

            <div className="flex gap-8 text-sm text-stone-400">
              <a href="#" className="transition-colors hover:text-white">
                Privacy
              </a>
              <a href="#" className="transition-colors hover:text-white">
                Terms
              </a>
              <a href="#" className="transition-colors hover:text-white">
                Support
              </a>
            </div>

            <div className="text-sm text-stone-500">© 2026 Byte. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

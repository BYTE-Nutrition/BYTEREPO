import { ByteLogoMark } from './components/ByteLogoMark';
import { Navbar } from './components/Navbar';
import { PhoneMockup } from './components/PhoneMockup';
import { FeatureCard } from './components/FeatureCard';
import { TestimonialCard } from './components/TestimonialCard';
import { AppScreen } from './components/AppScreen';

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background gradient glow */}
        <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-blue-950/50 blur-3xl"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text content */}
            <div className="relative z-10 space-y-8">
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl tracking-tight leading-tight">
                  Track your nutrition.
                  <br />
                  <span className="bg-gradient-to-r from-slate-200 via-blue-300 to-indigo-400 bg-clip-text text-transparent">
                    Actually understand it.
                  </span>
                </h1>

                <p className="max-w-lg text-xl leading-relaxed text-stone-400">
                  Byte helps you log meals, track macros, and stay consistent—without friction.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button className="rounded-2xl bg-neutral-950 px-8 py-4 text-white shadow-lg shadow-black/30 ring-1 ring-white/10 transition-all duration-300 hover:scale-105 hover:bg-black hover:shadow-2xl hover:shadow-black/40">
                  Get Started
                </button>
                <button className="rounded-2xl border border-white/15 px-8 py-4 text-white backdrop-blur-sm transition-all duration-300 hover:border-blue-400/40">
                  See How It Works
                </button>
              </div>
            </div>

            {/* Right: Phone mockups */}
            <div className="relative h-[600px] lg:h-[700px]">
              {/* Main phone - center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <PhoneMockup
                  screenContent={<AppScreen type="dashboard" />}
                  rotation={-2}
                  scale={1.1}
                  zIndex={30}
                  glow={true}
                />
              </div>

              {/* Left phone */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2">
                <PhoneMockup
                  screenContent={<AppScreen type="meals" />}
                  rotation={-8}
                  scale={0.85}
                  zIndex={20}
                />
              </div>

              {/* Right phone */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2">
                <PhoneMockup
                  screenContent={<AppScreen type="progress" />}
                  rotation={8}
                  scale={0.85}
                  zIndex={20}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative">
        {/* Gradient orb */}
        <div className="absolute right-0 top-1/2 h-[600px] w-[600px] rounded-full bg-indigo-950/40 blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-5xl tracking-tight">
              Everything you need.
              <br />
              <span className="text-stone-400">Nothing you don't.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Interactive App Showcase */}
      <section className="py-32 px-6 relative">
        <div className="absolute left-1/2 top-1/2 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-950/45 via-indigo-950/35 to-slate-950/40 blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="relative">
            {/* Center phone */}
            <div className="flex justify-center">
              <div className="relative">
                <PhoneMockup
                  screenContent={<AppScreen type="dashboard" />}
                  scale={1.2}
                  glow={true}
                />

                {/* Callout labels */}
                <div className="absolute -left-48 top-32 hidden xl:block">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-white font-medium">Daily calorie tracking</div>
                      <div className="text-sm text-stone-400">See remaining calories at a glance</div>
                    </div>
                    <div className="h-px w-12 bg-gradient-to-r from-blue-400 to-transparent"></div>
                  </div>
                </div>

                <div className="absolute -right-48 top-56 hidden xl:block">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-12 bg-gradient-to-l from-indigo-400 to-transparent"></div>
                    <div>
                      <div className="font-medium text-white">Macro breakdown</div>
                      <div className="text-sm text-stone-400">Protein, carbs, and fats</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -left-48 bottom-32 hidden xl:block">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-white font-medium">Meal logging</div>
                      <div className="text-sm text-stone-400">Quick and effortless entry</div>
                    </div>
                    <div className="h-px w-12 bg-gradient-to-r from-slate-400 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side phones */}
            <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-0 opacity-40">
              <PhoneMockup
                screenContent={<AppScreen type="goals" />}
                rotation={-5}
                scale={0.7}
              />
            </div>

            <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 right-0 opacity-40">
              <PhoneMockup
                screenContent={<AppScreen type="meals" />}
                rotation={5}
                scale={0.7}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-5xl tracking-tight">Get started in minutes</h2>
            <p className="text-xl text-stone-400">Three simple steps to better nutrition tracking</p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute bottom-0 left-1/2 top-0 hidden w-px bg-gradient-to-b from-blue-800 via-indigo-700 to-slate-700 md:block"></div>

            <div className="space-y-24">
              {/* Step 1 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="md:text-right space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-800 to-blue-950 text-white shadow-lg shadow-blue-950/50 md:float-right">
                    1
                  </div>
                  <div className="clear-both">
                    <h3 className="mb-2 text-3xl">Set your goals</h3>
                    <p className="leading-relaxed text-stone-400">
                      Tell us your calorie target and macro preferences. We'll customize everything to fit your needs.
                    </p>
                  </div>
                </div>
                <div className="flex justify-center md:justify-start">
                  <div className="flex h-48 w-48 items-center justify-center rounded-3xl border border-blue-600/30 bg-gradient-to-br from-blue-950/60 to-indigo-950/40">
                    <svg className="h-20 w-20 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="flex justify-center md:justify-end md:order-1">
                  <div className="flex h-48 w-48 items-center justify-center rounded-3xl border border-indigo-600/30 bg-gradient-to-br from-indigo-950/60 to-blue-950/40">
                    <svg className="h-20 w-20 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-4 md:order-0">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-800 to-indigo-950 text-white shadow-lg shadow-indigo-950/50">
                    2
                  </div>
                  <div>
                    <h3 className="mb-2 text-3xl">Log your meals</h3>
                    <p className="leading-relaxed text-stone-400">
                      Type it, say it, or snap it. Logging is fast and friction-free, so you'll actually do it.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="md:text-right space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg shadow-black/40 ring-1 ring-blue-900/40 md:float-right">
                    3
                  </div>
                  <div className="clear-both">
                    <h3 className="mb-2 text-3xl">Track your progress</h3>
                    <p className="leading-relaxed text-stone-400">
                      See weekly trends, hit your goals, and build consistency. No guilt, just progress.
                    </p>
                  </div>
                </div>
                <div className="flex justify-center md:justify-start">
                  <div className="flex h-48 w-48 items-center justify-center rounded-3xl border border-slate-600/35 bg-gradient-to-br from-slate-900/80 to-blue-950/50">
                    <svg className="h-20 w-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 relative">
        <div className="absolute left-0 top-1/2 h-[600px] w-[600px] rounded-full bg-blue-950/35 blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-5xl tracking-tight">Loved by users</h2>
            <p className="text-xl text-stone-400">See what people are saying about Byte</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="This is the only app I actually stick with. It's so simple and gets out of my way."
              author="Alex Chen"
              role="Software Engineer"
            />

            <TestimonialCard
              quote="Super simple and clean—finally. No overwhelming features I'll never use."
              author="Jordan Lee"
              role="Student Athlete"
            />

            <TestimonialCard
              quote="The voice logging feature is a game changer. I can log while cooking without touching my phone."
              author="Taylor Morgan"
              role="Fitness Coach"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-slate-950/45 blur-3xl"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <h2 className="text-6xl tracking-tight leading-tight">
            Start building better
            <br />
            <span className="bg-gradient-to-r from-slate-200 via-blue-300 to-indigo-400 bg-clip-text text-transparent">
              habits today.
            </span>
          </h2>

          <p className="text-xl text-stone-400">
            Join thousands of users who are hitting their nutrition goals with Byte.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button className="rounded-2xl bg-neutral-950 px-10 py-5 text-lg text-white shadow-lg shadow-black/30 ring-1 ring-white/10 transition-all duration-300 hover:scale-105 hover:bg-black hover:shadow-2xl hover:shadow-black/40">
              Download Byte
            </button>
          </div>

          <p className="pt-8 text-sm text-stone-500">
            Available on iOS and Android • Free to download
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
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

            <div className="text-sm text-stone-500">
              © 2026 Byte. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
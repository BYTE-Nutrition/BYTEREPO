import { Navbar } from './components/Navbar';
import { PhoneMockup } from './components/PhoneMockup';
import { FeatureCard } from './components/FeatureCard';
import { TestimonialCard } from './components/TestimonialCard';
import { AppScreen } from './components/AppScreen';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2A2A2A] via-[#1A1A1A] to-[#0B0B0B] text-white overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text content */}
            <div className="relative z-10 space-y-8">
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl tracking-tight leading-tight">
                  Track your nutrition.
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                    Actually understand it.
                  </span>
                </h1>

                <p className="text-xl text-gray-400 max-w-lg leading-relaxed">
                  Byte helps you log meals, track macros, and stay consistent—without friction.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105">
                  Get Started
                </button>
                <button className="px-8 py-4 rounded-2xl border border-white/20 hover:border-white/40 text-white transition-all duration-300 backdrop-blur-sm">
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

      {/* Trust Strip */}
      <section className="py-12 px-6 border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm tracking-wide uppercase mb-8">
            Trusted by students, athletes, and builders
          </p>
          <div className="flex justify-center gap-12 items-center opacity-40">
            <div className="w-24 h-8 bg-white/10 rounded"></div>
            <div className="w-24 h-8 bg-white/10 rounded"></div>
            <div className="w-24 h-8 bg-white/10 rounded"></div>
            <div className="w-24 h-8 bg-white/10 rounded"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative">
        {/* Gradient orb */}
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-5xl tracking-tight">
              Everything you need.
              <br />
              <span className="text-gray-400">Nothing you don't.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Simple Tracking"
              description="Log meals quickly with minimal friction. No endless food databases or barcode scanning."
            />

            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Clear Progress"
              description="Weekly insights and macro tracking that actually make sense at a glance."
            />

            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              }
              title="Voice Logging"
              description="Start cooking and log with voice. Hands-free tracking that fits your workflow."
            />

            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>

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
                      <div className="text-gray-400 text-sm">See remaining calories at a glance</div>
                    </div>
                    <div className="w-12 h-px bg-gradient-to-r from-blue-500 to-transparent"></div>
                  </div>
                </div>

                <div className="absolute -right-48 top-56 hidden xl:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-px bg-gradient-to-l from-blue-500 to-transparent"></div>
                    <div>
                      <div className="text-white font-medium">Macro breakdown</div>
                      <div className="text-gray-400 text-sm">Protein, carbs, and fats</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -left-48 bottom-32 hidden xl:block">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-white font-medium">Meal logging</div>
                      <div className="text-gray-400 text-sm">Quick and effortless entry</div>
                    </div>
                    <div className="w-12 h-px bg-gradient-to-r from-indigo-500 to-transparent"></div>
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
            <p className="text-xl text-gray-400">Three simple steps to better nutrition tracking</p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 hidden md:block"></div>

            <div className="space-y-24">
              {/* Step 1 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="md:text-right space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white md:float-right">
                    1
                  </div>
                  <div className="clear-both">
                    <h3 className="text-3xl mb-2">Set your goals</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Tell us your calorie target and macro preferences. We'll customize everything to fit your needs.
                    </p>
                  </div>
                </div>
                <div className="flex justify-center md:justify-start">
                  <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center">
                    <svg className="w-20 h-20 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="flex justify-center md:justify-end md:order-1">
                  <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <svg className="w-20 h-20 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-4 md:order-0">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    2
                  </div>
                  <div>
                    <h3 className="text-3xl mb-2">Log your meals</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Type it, say it, or snap it. Logging is fast and friction-free, so you'll actually do it.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="md:text-right space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white md:float-right">
                    3
                  </div>
                  <div className="clear-both">
                    <h3 className="text-3xl mb-2">Track your progress</h3>
                    <p className="text-gray-400 leading-relaxed">
                      See weekly trends, hit your goals, and build consistency. No guilt, just progress.
                    </p>
                  </div>
                </div>
                <div className="flex justify-center md:justify-start">
                  <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
                    <svg className="w-20 h-20 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-5xl tracking-tight">Loved by users</h2>
            <p className="text-xl text-gray-400">See what people are saying about Byte</p>
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <h2 className="text-6xl tracking-tight leading-tight">
            Start building better
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              habits today.
            </span>
          </h2>

          <p className="text-xl text-gray-400">
            Join thousands of users who are hitting their nutrition goals with Byte.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button className="px-10 py-5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105">
              Download Byte
            </button>
          </div>

          <p className="text-sm text-gray-500 pt-8">
            Available on iOS and Android • Free to download
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <span className="text-xl font-semibold">Byte</span>
            </div>

            <div className="flex gap-8 text-gray-400 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>

            <div className="text-gray-500 text-sm">
              © 2026 Byte. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
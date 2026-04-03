import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logo from '@/assets/byte-logo.jpg'
import { useByte } from '@/context/useByte'
import { USER_GOAL_OPTIONS, computeGoalsFromProfile } from '@/lib/goalsFromProfile'
import type { UserGoal, UserProfile } from '@/lib/types'

const AGES = Array.from({ length: 88 }, (_, i) => i + 13)
const STEP_COUNT = 4

export function OnboardingPage() {
  const navigate = useNavigate()
  const { state, completeOnboarding } = useByte()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [age, setAge] = useState(28)
  const [goal, setGoal] = useState<UserGoal>('maintenance')

  const listRef = useRef<HTMLDivElement>(null)
  const ageRef = useRef(age)
  useEffect(() => {
    ageRef.current = age
  }, [age])

  useEffect(() => {
    if (state.onboardingComplete) {
      navigate('/home', { replace: true })
    }
  }, [state.onboardingComplete, navigate])

  const previewGoals = useMemo(() => computeGoalsFromProfile(age, goal), [age, goal])

  const scrollAgeIntoView = useCallback((a: number) => {
    const el = listRef.current?.querySelector(`[data-age="${a}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [])

  useLayoutEffect(() => {
    if (step !== 2 || !listRef.current) return
    const list = listRef.current
    const el = list.querySelector(`[data-age="${ageRef.current}"]`) as HTMLElement | null
    if (!el) return
    const top = el.offsetTop - list.clientHeight / 2 + el.offsetHeight / 2
    list.scrollTop = Math.max(0, top)
  }, [step])

  const canContinue = () => {
    if (step === 1) return name.trim().length >= 1
    return true
  }

  const next = () => {
    if (!canContinue()) return
    if (step < STEP_COUNT - 1) setStep((s) => s + 1)
  }

  const finish = () => {
    const profile: UserProfile = {
      name: name.trim(),
      age,
      goal,
    }
    completeOnboarding(profile)
    navigate('/home', { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col bg-[#f7f6f3]">
      <div className="flex flex-1 flex-col px-6 pt-14 pb-8">
        <div className="mb-10 flex items-center justify-center">
          <img
            src={logo}
            alt=""
            className="h-11 w-auto max-w-[200px] object-contain opacity-90"
            decoding="async"
          />
        </div>

        <div className="mb-8 flex justify-center gap-2">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-neutral-900' : i < step ? 'w-2 bg-neutral-400' : 'w-2 bg-neutral-200'
              }`}
            />
          ))}
        </div>

        <div className="mx-auto w-full max-w-sm flex-1">
          {step === 0 && (
            <div>
              <p className="text-label mb-3 text-center text-stone-400">Welcome</p>
              <h1 className="mb-4 text-center text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                Let&apos;s personalize Byte for you
              </h1>
              <p className="text-center text-[15px] leading-relaxed text-stone-500">
                A short conversation. Then we&apos;ll set gentle calorie and protein targets.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-label mb-3 text-stone-400">Question 1 of 3</p>
              <h1 className="mb-8 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                What should we call you?
              </h1>
              <input
                type="text"
                autoFocus
                autoComplete="given-name"
                placeholder="Your first name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canContinue() && next()}
                className="w-full border-0 border-b-2 border-stone-200 bg-transparent py-3 text-2xl font-medium text-stone-900 placeholder:text-stone-300 focus:border-stone-800 focus:outline-none"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-label mb-3 text-stone-400">Question 2 of 3</p>
              <h1 className="mb-2 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                How old are you?
              </h1>
              <p className="mb-6 text-sm text-stone-500">Scroll to select</p>
              <div className="relative h-52 overflow-hidden rounded-2xl bg-white shadow-inner ring-1 ring-stone-200/80">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-14 -translate-y-1/2 border-y border-stone-200/90 bg-stone-50/30" />
                <div
                  ref={listRef}
                  className="scrollbar-none h-full snap-y snap-mandatory overflow-y-auto py-[4.5rem]"
                  onScroll={(e) => {
                    const el = e.currentTarget
                    const mid = el.scrollTop + el.clientHeight / 2
                    const items = el.querySelectorAll('[data-age]')
                    let best: number | null = null
                    let bestDist = Infinity
                    items.forEach((node) => {
                      const h = node as HTMLElement
                      const c = h.offsetTop + h.offsetHeight / 2
                      const d = Math.abs(c - mid)
                      if (d < bestDist) {
                        bestDist = d
                        best = Number(h.dataset.age)
                      }
                    })
                    if (best != null && best !== age) setAge(best)
                  }}
                >
                  {AGES.map((a) => (
                    <button
                      key={a}
                      type="button"
                      data-age={a}
                      onClick={() => {
                        setAge(a)
                        scrollAgeIntoView(a)
                      }}
                      className={`flex h-14 w-full shrink-0 snap-center items-center justify-center text-lg transition-all ${
                        a === age
                          ? 'font-semibold text-stone-900'
                          : 'font-normal text-stone-300'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-label mb-3 text-stone-400">Question 3 of 3</p>
              <h1 className="mb-2 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                What&apos;s your main goal?
              </h1>
              <p className="mb-6 text-sm text-stone-500">We&apos;ll tune calories and protein to match.</p>
              <div className="max-h-[min(52vh,22rem)] space-y-2 overflow-y-auto pr-1">
                {USER_GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGoal(opt.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all ${
                      goal === opt.id
                        ? 'border-stone-800 bg-stone-900 text-white shadow-sm'
                        : 'border-stone-200/80 bg-white/80 text-stone-800 hover:border-stone-300/80'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        goal === opt.id ? 'border-white bg-white text-neutral-900' : 'border-stone-300'
                      }`}
                    >
                      {goal === opt.id && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block font-semibold">{opt.label}</span>
                      <span
                        className={`mt-0.5 block text-sm ${goal === opt.id ? 'text-white/75' : 'text-stone-500'}`}
                      >
                        {opt.hint}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-stone-200/60 bg-white/50 p-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                  Starting targets
                </p>
                <p className="text-sm leading-relaxed text-stone-600">
                  <span className="font-medium text-stone-900">{previewGoals.calorieGoal} kcal</span> daily ·{' '}
                  <span className="font-medium text-stone-900">{previewGoals.proteinGoal}g protein</span>
                  <span className="text-stone-500"> — tweak anytime in Profile.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-stone-200/80 bg-[#f7f6f3]/95 px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto flex max-w-sm gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-2xl border border-stone-300 bg-white px-5 py-4 text-sm font-semibold text-stone-700"
            >
              Back
            </button>
          )}
          {step < STEP_COUNT - 1 ? (
            <button
              type="button"
              disabled={!canContinue()}
              onClick={next}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-medium text-[#f5e6c8] shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-35"
            >
              Continue
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-medium text-[#f5e6c8] shadow-sm"
            >
              Start tracking
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

    </div>
  )
}

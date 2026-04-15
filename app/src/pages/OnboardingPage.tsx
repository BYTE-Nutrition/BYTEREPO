import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { useByte } from '@/context/useByte'
import { analytics } from '@/lib/analytics'
import {
  GOAL_PACE_OPTIONS,
  USER_GOAL_OPTIONS,
  computeGoalsFromProfile,
} from '@/lib/goalsFromProfile'
import type { GoalPace, UserGoal, UserProfile, UserSex } from '@/lib/types'

const AGES = Array.from({ length: 88 }, (_, i) => i + 13)
const STEP_COUNT = 10

const SEX_OPTIONS: { id: UserSex; label: string; hint: string }[] = [
  { id: 'female', label: 'Female', hint: 'For energy estimates' },
  { id: 'male', label: 'Male', hint: 'For energy estimates' },
  { id: 'prefer_not_say', label: 'Prefer not to say', hint: 'We’ll use a blended formula' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { state, completeOnboarding } = useByte()
  const [step, setStep] = useState(0)

  const [name, setName] = useState('')
  const [age, setAge] = useState(28)
  const [sex, setSex] = useState<UserSex>('prefer_not_say')
  const [heightCm, setHeightCm] = useState(170)
  const [weightKg, setWeightKg] = useState(72)
  const [cooksPerWeek, setCooksPerWeek] = useState(4)
  const [goal, setGoal] = useState<UserGoal>('maintenance')
  const [goalPace, setGoalPace] = useState<GoalPace>('steady')

  const listRef = useRef<HTMLDivElement>(null)
  const ageRef = useRef(age)
  useEffect(() => {
    ageRef.current = age
  }, [age])

  const draftProfile: UserProfile = useMemo(
    () => ({
      name: name.trim(),
      age,
      sex,
      heightCm,
      weightKg,
      cooksPerWeek,
      goal,
      goalPace,
    }),
    [name, age, sex, heightCm, weightKg, cooksPerWeek, goal, goalPace],
  )

  const previewGoals = useMemo(() => computeGoalsFromProfile(draftProfile), [draftProfile])

  useEffect(() => {
    if (state.onboardingComplete) {
      navigate('/home', { replace: true })
    }
  }, [state.onboardingComplete, navigate])

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
    switch (step) {
      case 1:
        return name.trim().length >= 1
      case 4:
        return heightCm >= 120 && heightCm <= 220
      case 5:
        return weightKg >= 35 && weightKg <= 250
      default:
        return true
    }
  }

  const next = () => {
    if (!canContinue()) return
    if (step < STEP_COUNT - 1) setStep((s) => s + 1)
  }

  const finish = () => {
    completeOnboarding({
      name: name.trim(),
      age,
      sex,
      heightCm,
      weightKg,
      cooksPerWeek,
      goal,
      goalPace,
    })
    analytics.track('onboarding_completed', { goal, goalPace })
    navigate('/home', { replace: true })
  }

  const stepLabel = step > 0 && step < STEP_COUNT ? `Step ${step} of ${STEP_COUNT - 1}` : ''

  return (
    <div className="flex min-h-svh flex-col bg-[#f7f6f3]">
      <div className="flex flex-1 flex-col px-6 pb-8 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="mb-8 flex items-center justify-center">
          <ByteLogo className="opacity-95" />
        </div>

        {step > 0 && (
          <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
            {stepLabel}
          </p>
        )}

        <div className="mb-8 flex justify-center gap-1.5">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-stone-900' : i < step ? 'w-1.5 bg-stone-400' : 'w-1.5 bg-stone-200'
              }`}
            />
          ))}
        </div>

        <div className="mx-auto w-full max-w-sm flex-1">
          {step === 0 && (
            <div className="text-center">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">Welcome</p>
              <h1 className="mb-4 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                Let&apos;s set up Byte with you
              </h1>
              <p className="mx-auto max-w-[20rem] text-[15px] leading-relaxed text-stone-500">
                A few questions about you, your kitchen, and how you want to feel—then we&apos;ll tune your
                targets.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">About you</p>
              <h1 className="mb-8 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                What should we call you?
              </h1>
              <input
                type="text"
                autoFocus
                autoComplete="given-name"
                placeholder="First name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canContinue() && next()}
                className="w-full border-0 border-b-2 border-stone-200 bg-transparent py-3 text-2xl font-medium text-stone-900 placeholder:text-stone-300 focus:border-stone-800 focus:outline-none"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">About you</p>
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
                        a === age ? 'font-semibold text-stone-900' : 'font-normal text-stone-300'
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
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Body</p>
              <h1 className="mb-2 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                Which best describes you?
              </h1>
              <p className="mb-6 text-sm text-stone-500">Helps us estimate your daily energy needs.</p>
              <div className="space-y-2">
                {SEX_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSex(opt.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all ${
                      sex === opt.id
                        ? 'border-stone-800 bg-stone-900 text-white shadow-sm'
                        : 'border-stone-200/80 bg-white/80 text-stone-800 hover:border-stone-300/80'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        sex === opt.id ? 'border-white bg-white text-stone-900' : 'border-stone-300'
                      }`}
                    >
                      {sex === opt.id && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block font-semibold">{opt.label}</span>
                      <span
                        className={`mt-0.5 block text-sm ${sex === opt.id ? 'text-white/75' : 'text-stone-500'}`}
                      >
                        {opt.hint}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Body</p>
              <h1 className="mb-2 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                How tall are you?
              </h1>
              <p className="mb-8 text-sm text-stone-500">Centimeters</p>
              <div className="mb-6 text-center">
                <span className="text-5xl font-light tabular-nums text-stone-900">{heightCm}</span>
                <span className="ml-1 text-lg text-stone-400">cm</span>
              </div>
              <input
                type="range"
                min={120}
                max={220}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-stone-900"
              />
              <div className="mt-2 flex justify-between text-xs text-stone-400">
                <span>120</span>
                <span>220</span>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Body</p>
              <h1 className="mb-2 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                What&apos;s your weight?
              </h1>
              <p className="mb-8 text-sm text-stone-500">Kilograms</p>
              <div className="mb-6 text-center">
                <span className="text-5xl font-light tabular-nums text-stone-900">{weightKg}</span>
                <span className="ml-1 text-lg text-stone-400">kg</span>
              </div>
              <input
                type="range"
                min={40}
                max={180}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-stone-900"
              />
              <div className="mt-2 flex justify-between text-xs text-stone-400">
                <span>40</span>
                <span>180</span>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Kitchen</p>
              <h1 className="mb-2 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                How often do you cook at home?
              </h1>
              <p className="mb-8 text-sm text-stone-500">Meals you prepare yourself per week</p>
              <div className="mb-6 text-center">
                <span className="text-5xl font-light tabular-nums text-stone-900">{cooksPerWeek}</span>
                <span className="ml-1 text-lg text-stone-400">× / week</span>
              </div>
              <input
                type="range"
                min={0}
                max={21}
                value={cooksPerWeek}
                onChange={(e) => setCooksPerWeek(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-stone-900"
              />
              <div className="mt-2 flex justify-between text-xs text-stone-400">
                <span>0</span>
                <span>21</span>
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Goals</p>
              <h1 className="mb-2 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                What&apos;s your main focus?
              </h1>
              <p className="mb-6 text-sm text-stone-500">We&apos;ll align calories and protein around this.</p>
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
                        goal === opt.id ? 'border-white bg-white text-stone-900' : 'border-stone-300'
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
            </div>
          )}

          {step === 8 && (
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Timeline</p>
              <h1 className="mb-2 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                How fast do you want to move?
              </h1>
              <p className="mb-6 text-sm text-stone-500">
                This sets how strong your calorie adjustment is. You can change it later.
              </p>
              <div className="space-y-2">
                {GOAL_PACE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGoalPace(opt.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all ${
                      goalPace === opt.id
                        ? 'border-stone-800 bg-stone-900 text-white shadow-sm'
                        : 'border-stone-200/80 bg-white/80 text-stone-800 hover:border-stone-300/80'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        goalPace === opt.id ? 'border-white bg-white text-stone-900' : 'border-stone-300'
                      }`}
                    >
                      {goalPace === opt.id && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block font-semibold">{opt.label}</span>
                      <span
                        className={`mt-0.5 block text-sm ${
                          goalPace === opt.id ? 'text-white/75' : 'text-stone-500'
                        }`}
                      >
                        {opt.hint}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 9 && (
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Ready</p>
              <h1 className="mb-6 text-[1.625rem] font-medium leading-snug tracking-[-0.02em] text-stone-900">
                You&apos;re all set{name.trim() ? `, ${name.trim()}` : ''}
              </h1>
              <div className="space-y-4 rounded-2xl border border-stone-200/60 bg-white/50 p-5 text-sm text-stone-600">
                <p>
                  <span className="text-stone-400">Height · weight · age</span>
                  <br />
                  <span className="font-medium text-stone-900">
                    {heightCm} cm · {weightKg} kg · {age} yrs
                  </span>
                </p>
                <p>
                  <span className="text-stone-400">Cooking at home</span>
                  <br />
                  <span className="font-medium text-stone-900">~{cooksPerWeek} meals / week</span>
                </p>
                <p>
                  <span className="text-stone-400">Daily targets</span>
                  <br />
                  <span className="font-medium text-stone-900">
                    {previewGoals.calorieGoal} kcal · {previewGoals.proteinGoal}g protein
                  </span>
                  <span className="text-stone-500"> — adjust anytime in Profile.</span>
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

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NoirByteMark, NoirStatusBar } from '@/components/noir/NoirPrimitives'
import { useByte } from '@/context/useByte'
import { analytics } from '@/lib/analytics'
import {
  GOAL_PACE_OPTIONS,
  USER_GOAL_OPTIONS,
  computeGoalsFromProfile,
} from '@/lib/goalsFromProfile'
import type { DietaryRestriction, GoalPace, UserGoal, UserProfile, UserSex } from '@/lib/types'

const AGES = Array.from({ length: 88 }, (_, i) => i + 13)
const STEP_COUNT = 11

const DIETARY_OPTIONS: { id: DietaryRestriction; label: string; hint: string }[] = [
  { id: 'none', label: 'No restrictions', hint: 'I eat everything' },
  { id: 'vegetarian', label: 'Vegetarian', hint: 'No meat or fish' },
  { id: 'vegan', label: 'Vegan', hint: 'No animal products' },
  { id: 'pescatarian', label: 'Pescatarian', hint: 'Fish yes; other meat no' },
  { id: 'other', label: 'Other', hint: 'Tell us what you avoid below' },
]

/** ~4′0″–7′3″ → stored as cm in profile */
const HEIGHT_IN_MIN = 48
const HEIGHT_IN_MAX = 87

const WEIGHT_LB_MIN = 80
const WEIGHT_LB_MAX = 400

function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54)
}

function cmToInches(cm: number): number {
  return Math.min(HEIGHT_IN_MAX, Math.max(HEIGHT_IN_MIN, Math.round(cm / 2.54)))
}

function lbToKg(lb: number): number {
  return Math.round((lb / 2.20462) * 10) / 10
}

function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462)
}

function formatFeetInches(totalInches: number): string {
  const ft = Math.floor(totalInches / 12)
  const inch = totalInches % 12
  return `${ft}′${inch}″`
}

const SEX_OPTIONS: { id: UserSex; label: string; hint: string }[] = [
  { id: 'female', label: 'Female', hint: 'For energy estimates' },
  { id: 'male', label: 'Male', hint: 'For energy estimates' },
  { id: 'prefer_not_say', label: 'Prefer not to say', hint: 'We’ll use a blended formula' },
]

const choiceBtn =
  'flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-colors active:bg-[var(--paper)]/5'
const choiceBtnOn =
  'border-[var(--champagne)]/50 bg-[var(--paper)]/12 text-[var(--paper)] shadow-sm ring-1 ring-[var(--champagne)]/25'
const choiceBtnOff =
  'border-[var(--line)] bg-[var(--ink-2)] text-[var(--paper)] hover:border-[var(--paper)]/20'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { state, completeOnboarding } = useByte()
  const [step, setStep] = useState(0)

  const [name, setName] = useState('')
  const [age, setAge] = useState(28)
  const [sex, setSex] = useState<UserSex>('prefer_not_say')
  const [heightInches, setHeightInches] = useState(() => cmToInches(170))
  const [weightLb, setWeightLb] = useState(() => kgToLb(72))
  const [cooksPerWeek, setCooksPerWeek] = useState(4)
  const [goal, setGoal] = useState<UserGoal>('maintenance')
  const [goalPace, setGoalPace] = useState<GoalPace>('steady')
  const [dietaryRestriction, setDietaryRestriction] = useState<DietaryRestriction>('none')
  const [dietaryNotes, setDietaryNotes] = useState('')

  const listRef = useRef<HTMLDivElement>(null)
  const ageRef = useRef(age)
  useEffect(() => {
    ageRef.current = age
  }, [age])

  const heightCm = useMemo(() => inchesToCm(heightInches), [heightInches])
  const weightKg = useMemo(() => lbToKg(weightLb), [weightLb])

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
      dietaryRestriction,
      dietaryNotes: dietaryNotes.trim(),
    }),
    [name, age, sex, heightCm, weightKg, cooksPerWeek, goal, goalPace, dietaryRestriction, dietaryNotes],
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
        return heightInches >= HEIGHT_IN_MIN && heightInches <= HEIGHT_IN_MAX
      case 5:
        return weightLb >= WEIGHT_LB_MIN && weightLb <= WEIGHT_LB_MAX
      case 9:
        return dietaryRestriction !== 'other' || dietaryNotes.trim().length >= 1
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
      dietaryRestriction,
      dietaryNotes: dietaryNotes.trim(),
    })
    analytics.track('onboarding_completed', { goal, goalPace, dietaryRestriction })
    navigate('/home', { replace: true })
  }

  const stepLabel = step > 0 && step < STEP_COUNT ? `Step ${step} of ${STEP_COUNT - 1}` : ''

  const rangeClass =
    'h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--ink-3)] accent-[var(--champagne)]'

  return (
    <div className="noir-page-enter noir-screen-root noir-surface relative min-h-full text-[var(--paper)]">
      <NoirStatusBar dark />

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-8 pt-12">
        <div className="mb-6 flex items-center justify-center">
          <NoirByteMark size="md" />
        </div>

        {step > 0 && (
          <p className="eyebrow mb-3 text-center text-[var(--paper)]/50">{stepLabel}</p>
        )}

        <div className="mb-8 flex justify-center gap-1.5">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-6 bg-[var(--champagne)]'
                  : i < step
                    ? 'w-1.5 bg-[var(--paper)]/45'
                    : 'w-1.5 bg-[var(--paper)]/15'
              }`}
            />
          ))}
        </div>

        <div className="mx-auto w-full max-w-sm flex-1 pb-4">
          {step === 0 && (
            <div className="text-center">
              <p className="eyebrow mb-3 text-[var(--paper)]/50">Welcome</p>
              <h1 className="display-serif mb-4 text-[1.75rem] leading-snug tracking-tight text-[var(--paper)]">
                Let&apos;s set up Byte with you
              </h1>
              <p className="mx-auto max-w-[20rem] text-[15px] leading-relaxed text-[var(--paper)]/55">
                A few questions about you, your kitchen, and how you want to feel—then we&apos;ll tune your
                targets.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="eyebrow mb-3 text-[var(--paper)]/50">About you</p>
              <h1 className="display-serif mb-8 text-[1.75rem] leading-snug tracking-tight text-[var(--paper)]">
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
                className="w-full rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] px-4 py-4 text-xl font-medium text-[var(--paper)] placeholder:text-[var(--paper)]/35 focus:border-[var(--champagne)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--champagne)]/25"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="eyebrow mb-3 text-[var(--paper)]/50">About you</p>
              <h1 className="display-serif mb-2 text-[1.75rem] leading-snug tracking-tight text-[var(--paper)]">
                How old are you?
              </h1>
              <p className="mb-6 text-sm text-[var(--paper)]/50">Scroll to select</p>
              <div className="relative h-52 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] shadow-inner">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-14 -translate-y-1/2 border-y border-[var(--paper)]/10 bg-[var(--ink)]/20" />
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
                        a === age ? 'font-semibold text-[var(--paper)]' : 'font-normal text-[var(--paper)]/30'
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
              <p className="eyebrow mb-3 text-[var(--paper)]/50">Body</p>
              <h1 className="display-serif mb-2 text-[1.75rem] leading-snug tracking-tight text-[var(--paper)]">
                Which best describes you?
              </h1>
              <p className="mb-6 text-sm text-[var(--paper)]/50">Helps us estimate your daily energy needs.</p>
              <div className="space-y-2">
                {SEX_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSex(opt.id)}
                    className={`${choiceBtn} ${sex === opt.id ? choiceBtnOn : choiceBtnOff}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        sex === opt.id
                          ? 'border-[var(--champagne)] bg-[var(--champagne)]/20 text-[var(--paper)]'
                          : 'border-[var(--paper)]/25'
                      }`}
                    >
                      {sex === opt.id && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block font-semibold">{opt.label}</span>
                      <span
                        className={`mt-0.5 block text-sm ${sex === opt.id ? 'text-[var(--paper)]/70' : 'text-[var(--paper)]/45'}`}
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
              <p className="eyebrow mb-3 text-[var(--paper)]/50">Body</p>
              <h1 className="display-serif mb-2 text-[1.75rem] leading-snug tracking-tight text-[var(--paper)]">
                How tall are you?
              </h1>
              <p className="mb-8 text-sm text-[var(--paper)]/50">Feet and inches (U.S.)</p>
              <div className="mb-6 text-center">
                <span className="display-serif text-5xl font-light tabular-nums text-[var(--paper)]">
                  {formatFeetInches(heightInches)}
                </span>
                <span className="ml-2 font-mono text-xs text-[var(--paper)]/40">({heightInches} in)</span>
              </div>
              <input
                type="range"
                min={HEIGHT_IN_MIN}
                max={HEIGHT_IN_MAX}
                value={heightInches}
                onChange={(e) => setHeightInches(Number(e.target.value))}
                className={rangeClass}
              />
              <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--paper)]/40">
                <span>{formatFeetInches(HEIGHT_IN_MIN)}</span>
                <span>{formatFeetInches(HEIGHT_IN_MAX)}</span>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="eyebrow mb-3 text-[var(--paper)]/50">Body</p>
              <h1 className="display-serif mb-2 text-[1.75rem] leading-snug tracking-tight text-[var(--paper)]">
                What&apos;s your weight?
              </h1>
              <p className="mb-8 text-sm text-[var(--paper)]/50">Pounds</p>
              <div className="mb-6 text-center">
                <span className="display-serif text-5xl font-light tabular-nums text-[var(--paper)]">{weightLb}</span>
                <span className="ml-2 text-lg text-[var(--paper)]/45">lb</span>
              </div>
              <input
                type="range"
                min={WEIGHT_LB_MIN}
                max={WEIGHT_LB_MAX}
                value={weightLb}
                onChange={(e) => setWeightLb(Number(e.target.value))}
                className={rangeClass}
              />
              <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--paper)]/40">
                <span>{WEIGHT_LB_MIN} lb</span>
                <span>{WEIGHT_LB_MAX} lb</span>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <p className="eyebrow mb-3 text-[var(--paper)]/50">Kitchen</p>
              <h1 className="display-serif mb-2 text-[1.75rem] leading-snug tracking-tight text-[var(--paper)]">
                How often do you cook at home?
              </h1>
              <p className="mb-8 text-sm text-[var(--paper)]/50">Meals you prepare yourself per week</p>
              <div className="mb-6 text-center">
                <span className="display-serif text-5xl font-light tabular-nums text-[var(--paper)]">{cooksPerWeek}</span>
                <span className="ml-2 text-lg text-[var(--paper)]/45">× / week</span>
              </div>
              <input
                type="range"
                min={0}
                max={21}
                value={cooksPerWeek}
                onChange={(e) => setCooksPerWeek(Number(e.target.value))}
                className={rangeClass}
              />
              <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--paper)]/40">
                <span>0</span>
                <span>21</span>
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <p className="eyebrow mb-3 text-[var(--paper)]/50">Goals</p>
              <h1 className="display-serif mb-2 text-[1.75rem] leading-snug tracking-tight text-[var(--paper)]">
                What&apos;s your main focus?
              </h1>
              <p className="mb-6 text-sm text-[var(--paper)]/50">We&apos;ll align calories and protein around this.</p>
              <div className="max-h-[min(52vh,22rem)] space-y-2 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {USER_GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGoal(opt.id)}
                    className={`${choiceBtn} ${goal === opt.id ? choiceBtnOn : choiceBtnOff}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        goal === opt.id
                          ? 'border-[var(--champagne)] bg-[var(--champagne)]/20 text-[var(--paper)]'
                          : 'border-[var(--paper)]/25'
                      }`}
                    >
                      {goal === opt.id && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block font-semibold">{opt.label}</span>
                      <span
                        className={`mt-0.5 block text-sm ${goal === opt.id ? 'text-[var(--paper)]/70' : 'text-[var(--paper)]/45'}`}
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
              <p className="eyebrow mb-3 text-[var(--paper)]/50">Timeline</p>
              <h1 className="display-serif mb-2 text-[1.75rem] leading-snug tracking-tight text-[var(--paper)]">
                How fast do you want to move?
              </h1>
              <p className="mb-6 text-sm text-[var(--paper)]/50">
                This sets how strong your calorie adjustment is. You can change it later.
              </p>
              <div className="space-y-2">
                {GOAL_PACE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGoalPace(opt.id)}
                    className={`${choiceBtn} ${goalPace === opt.id ? choiceBtnOn : choiceBtnOff}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        goalPace === opt.id
                          ? 'border-[var(--champagne)] bg-[var(--champagne)]/20 text-[var(--paper)]'
                          : 'border-[var(--paper)]/25'
                      }`}
                    >
                      {goalPace === opt.id && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block font-semibold">{opt.label}</span>
                      <span
                        className={`mt-0.5 block text-sm ${
                          goalPace === opt.id ? 'text-[var(--paper)]/70' : 'text-[var(--paper)]/45'
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
              <p className="eyebrow mb-3 text-[var(--paper)]/50">Eating style</p>
              <h1 className="display-serif mb-2 text-[1.75rem] leading-snug tracking-tight text-[var(--paper)]">
                Any dietary restrictions?
              </h1>
              <p className="mb-6 text-sm text-[var(--paper)]/50">
                We&apos;ll use this to tailor suggestions—not as medical advice.
              </p>
              <div className="max-h-[min(42vh,18rem)] space-y-2 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDietaryRestriction(opt.id)}
                    className={`${choiceBtn} ${dietaryRestriction === opt.id ? choiceBtnOn : choiceBtnOff}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        dietaryRestriction === opt.id
                          ? 'border-[var(--champagne)] bg-[var(--champagne)]/20 text-[var(--paper)]'
                          : 'border-[var(--paper)]/25'
                      }`}
                    >
                      {dietaryRestriction === opt.id && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block font-semibold">{opt.label}</span>
                      <span
                        className={`mt-0.5 block text-sm ${
                          dietaryRestriction === opt.id ? 'text-[var(--paper)]/70' : 'text-[var(--paper)]/45'
                        }`}
                      >
                        {opt.hint}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              {dietaryRestriction === 'other' ? (
                <label className="mt-6 block">
                  <span className="mb-2 block text-sm font-medium text-[var(--paper)]/70">
                    What don&apos;t you eat? <span className="text-[var(--champagne)]">*</span>
                  </span>
                  <textarea
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. No shellfish, no dairy, allergic to tree nuts…"
                    className="w-full resize-none rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] px-4 py-3 text-[15px] leading-relaxed text-[var(--paper)] placeholder:text-[var(--paper)]/35 focus:border-[var(--champagne)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--champagne)]/25"
                  />
                </label>
              ) : (
                <label className="mt-6 block">
                  <span className="mb-2 block text-sm font-medium text-[var(--paper)]/70">
                    Anything else to avoid? <span className="text-[var(--paper)]/40">(optional)</span>
                  </span>
                  <textarea
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
                    rows={2}
                    placeholder="Allergies, dislikes, or other notes…"
                    className="w-full resize-none rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] px-4 py-3 text-[15px] leading-relaxed text-[var(--paper)] placeholder:text-[var(--paper)]/35 focus:border-[var(--champagne)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--champagne)]/25"
                  />
                </label>
              )}
            </div>
          )}

          {step === 10 && (
            <div>
              <p className="eyebrow mb-3 text-[var(--paper)]/50">Ready</p>
              <h1 className="display-serif mb-6 text-[1.75rem] leading-snug tracking-tight text-[var(--paper)]">
                You&apos;re all set{name.trim() ? `, ${name.trim()}` : ''}
              </h1>
              <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)]/90 p-5 text-sm text-[var(--paper)]/75">
                <p>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--paper)]/40">
                    Height · weight · age
                  </span>
                  <br />
                  <span className="font-medium text-[var(--paper)]">
                    {formatFeetInches(heightInches)} · {weightLb} lb · {age} yrs
                  </span>
                </p>
                <p>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--paper)]/40">
                    Cooking at home
                  </span>
                  <br />
                  <span className="font-medium text-[var(--paper)]">~{cooksPerWeek} meals / week</span>
                </p>
                <p>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--paper)]/40">
                    Diet
                  </span>
                  <br />
                  <span className="font-medium text-[var(--paper)]">
                    {DIETARY_OPTIONS.find((o) => o.id === dietaryRestriction)?.label ?? dietaryRestriction}
                    {dietaryNotes.trim() ? ` — ${dietaryNotes.trim()}` : ''}
                  </span>
                </p>
                <p>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--paper)]/40">
                    Daily targets
                  </span>
                  <br />
                  <span className="font-medium text-[var(--paper)]">
                    {previewGoals.calorieGoal} kcal · {previewGoals.proteinGoal}g protein
                  </span>
                  <span className="text-[var(--paper)]/50"> — adjust anytime in Profile.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-[var(--line)] bg-[var(--ink)]/95 px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto flex max-w-sm gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="noir-magnet rounded-full border border-[var(--line-strong)] px-5 py-4 font-mono text-xs uppercase tracking-[0.18em] text-[var(--paper)]"
            >
              Back
            </button>
          )}
          {step < STEP_COUNT - 1 ? (
            <button
              type="button"
              disabled={!canContinue()}
              onClick={next}
              className="noir-magnet flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--paper)] py-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink)] shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-35"
            >
              Continue
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="noir-magnet flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--paper)] py-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink)] shadow-sm"
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

import {
  Apple,
  Coffee,
  Cookie,
  Droplet,
  Mic,
  Plus,
  TrendingUp,
  Utensils,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ByteLogo } from '@/components/ByteLogo'
import { Progress } from '@/components/ui/progress'
import { useByte } from '@/context/useByte'
import { dayNutritionTotals } from '@/lib/aggregate'
import { MEAL_LABELS, MEAL_ORDER, type MealSlot } from '@/lib/types'

const SLOT_ICONS: Record<MealSlot, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  snack: Cookie,
  dinner: Apple,
}

export function HomePage() {
  const navigate = useNavigate()
  const { day, goals, weekNumber, setWaterGlasses } = useByte()
  const totals = dayNutritionTotals(day)
  const exercise = day.exerciseCalories
  const calorieGoal = goals.calorieGoal
  const caloriesRemaining = calorieGoal - totals.calories + exercise
  const progressPercentage = Math.min(100, (totals.calories / calorieGoal) * 100)

  const macros = [
    {
      name: 'Protein',
      current: totals.protein,
      goal: goals.proteinGoal,
      color: 'bg-blue-500',
      unit: 'g',
    },
    {
      name: 'Carbs',
      current: totals.carbs,
      goal: goals.carbsGoal,
      color: 'bg-green-500',
      unit: 'g',
    },
    {
      name: 'Fat',
      current: totals.fat,
      goal: goals.fatGoal,
      color: 'bg-orange-500',
      unit: 'g',
    },
  ]

  return (
    <div>
      <div className="relative bg-black px-6 pb-6 pt-14 text-white">
        <div className="relative mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span>Week {weekNumber}</span>
          </div>
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <ByteLogo className="text-white" />
          </div>
          <div className="w-20" />
        </div>

        <div className="text-center">
          <div className="mb-2 text-5xl tabular-nums">{Math.round(caloriesRemaining)}</div>
          <div className="mb-4 text-sm text-gray-300">Calories Remaining</div>

          <div className="flex justify-center gap-8 text-sm">
            <div>
              <div className="text-gray-400">Goal</div>
              <div>{calorieGoal}</div>
            </div>
            <div>
              <div className="text-gray-400">Food</div>
              <div className="text-green-400">{Math.round(totals.calories)}</div>
            </div>
            <div>
              <div className="text-gray-400">Exercise</div>
              <div className="text-orange-400">{exercise}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-100 bg-white px-6 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Daily Progress</h2>
          <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="mb-4 h-2" />

        <div className="grid grid-cols-3 gap-3">
          {macros.map((macro) => (
            <div key={macro.name} className="rounded-lg bg-gray-50 p-3">
              <div className="mb-1 text-xs text-gray-500">{macro.name}</div>
              <div className="mb-1 text-lg font-semibold tabular-nums">
                {Math.round(macro.current)}
                <span className="text-xs text-gray-400">
                  /{macro.goal}
                  {macro.unit}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className={`${macro.color} h-1.5 rounded-full`}
                  style={{ width: `${Math.min(100, (macro.current / macro.goal) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        <h2 className="mb-4 font-semibold text-gray-900">Today&apos;s Meals</h2>

        <button
          type="button"
          onClick={() => navigate('/voice')}
          className="mb-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-5 text-left text-white shadow-xl transition-all hover:shadow-2xl active:scale-95"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <Mic className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xl font-bold">Start Cooking</div>
            <div className="text-sm text-blue-100">Log your meal with voice</div>
          </div>
        </button>

        <div className="space-y-3">
          {MEAL_ORDER.map((slot) => {
            const meal = day.meals[slot]
            const Icon = SLOT_ICONS[slot]
            const empty = !meal
            return (
              <button
                type="button"
                key={slot}
                onClick={() => (empty ? navigate(`/voice?slot=${slot}`) : navigate(`/meals/${slot}`))}
                className={`w-full rounded-xl border p-4 text-left ${
                  empty ? 'border-dashed border-gray-300 bg-white' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        empty ? 'bg-gray-100' : 'bg-black'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${empty ? 'text-gray-400' : 'text-white'}`} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{MEAL_LABELS[slot]}</div>
                      <div className="text-sm text-gray-500">
                        {empty ? 'Not logged' : meal.timeRangeLabel}
                      </div>
                    </div>
                  </div>
                  {empty ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
                      <Plus className="h-4 w-4 text-white" />
                    </span>
                  ) : (
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 tabular-nums">{meal.calories}</div>
                      <div className="text-xs text-gray-500">cal</div>
                    </div>
                  )}
                </div>
                {!empty && meal.items.length > 0 && (
                  <div className="mt-3 pl-[3.25rem]">
                    {meal.items.map((item) => (
                      <div key={item.id} className="text-sm text-gray-600">
                        • {item.name} ({item.amount})
                      </div>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Water Intake</h2>
            </div>
            <span className="text-sm text-gray-600">{day.waterGlasses}/8 glasses</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setWaterGlasses(i + 1)}
                className={`h-10 flex-1 rounded-lg transition-all ${
                  i < day.waterGlasses ? 'bg-blue-500 shadow-md' : 'border border-blue-200 bg-white/60'
                }`}
              >
                {i < day.waterGlasses && <Droplet className="mx-auto h-4 w-4 text-white" fill="white" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Screens: Splash, Home, Meals list, Meal detail, Progress — DARK default, no italics, no marquee */

/* ---------- Splash ---------- */
function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="screen-root noir grain canvas-bg">
      <StatusBar dark />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full opacity-35"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 65%)',
            animation: 'orbFloat 5s ease-in-out infinite',
          }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="logo-reveal">
          <div
            className="text-[var(--paper)] leading-none"
            style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 92, letterSpacing: '-0.03em' }}
          >
            BYTE
          </div>
        </div>
        <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--paper)]/45 logo-reveal" style={{animationDelay:'500ms'}}>
          Your cooking assistance
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <div className="h-[2px] w-20 bg-[var(--paper)]/15 overflow-hidden">
          <div className="h-full w-full bg-[var(--paper)]" style={{ animation: 'fillIn 2100ms cubic-bezier(0.22,1,0.36,1) both', '--pct': 1 }} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Home ---------- */
function HomeScreen({ go, day, goals }) {
  const totals = Object.values(day.meals).reduce(
    (a, m) => m ? { c: a.c + m.calories, p: a.p + m.protein, ca: a.ca + m.carbs, f: a.f + m.fat } : a,
    { c: 0, p: 0, ca: 0, f: 0 }
  );
  const remaining = Math.max(0, Math.round(goals.calorieGoal - totals.c + day.exerciseCalories));
  const loggedCount = MEAL_ORDER.filter(s => day.meals[s]).length;
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? 'Morning service' :
    hour < 15 ? 'Midday pause' :
    hour < 18 ? 'Afternoon' :
                'Evening service';

  return (
    <div className="screen-root noir">
      <StatusBar dark />
      <div className="pt-14 pb-32 px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <ByteMark size="md" />
          <button className="p-2 -mr-2 rounded-full magnet text-[var(--paper)]" aria-label="Menu">
            <I.Menu size={20} />
          </button>
        </div>

        {/* Headline */}
        <div className="relative mb-10 anim-up">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">{greeting} · Wed 18 Apr</div>
          <h1 className="display-serif text-[44px] leading-[1.02] tracking-tight text-[var(--paper)]">
            What are you<br />
            <span className="shimmer-on-dark">making today?</span>
          </h1>
        </div>

        {/* Primary voice CTA — large light orb on dark */}
        <button
          onClick={() => go('voice')}
          className="group relative mx-auto mb-4 block focus:outline-none"
          aria-label="Log meal with voice"
        >
          <div className="relative w-[168px] h-[168px] mx-auto">
            <div className="absolute inset-0 rounded-full ring" />
            <div className="absolute inset-0 rounded-full ring delay-1" />
            <div
              className="relative h-full w-full rounded-full overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 35% 32%, #2a2a2a 0%, #141414 55%, #080808 100%)',
                boxShadow: 'inset 0 0 30px rgba(255,255,255,0.06), inset 0 -10px 30px rgba(0,0,0,0.5), 0 20px 40px -10px rgba(0,0,0,0.6)',
                animation: 'orbBreath 3.4s ease-in-out infinite',
              }}
            >
              <div className="absolute inset-0 grid place-items-center text-[var(--paper)]">
                <I.Mic size={38} stroke={1.5} />
              </div>
            </div>
          </div>
        </button>
        <div className="text-center mb-10">
          <div className="display-serif text-[19px] text-[var(--paper)]">Tap to speak</div>
          <div className="eyebrow mt-1.5 text-[var(--paper)]/55">Byte is listening</div>
        </div>

        {/* Stat ticker */}
        <div className="relative mb-10 py-4 border-y border-[var(--line)]">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="eyebrow mb-1.5 text-[var(--paper)]/55">Remaining today</div>
              <div className="display-serif text-[44px] leading-none text-[var(--paper)]">
                <Rollover value={remaining} />
                <span className="font-sans font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--paper)]/45 ml-2">kcal</span>
              </div>
            </div>
            <div className="text-right">
              <div className="eyebrow mb-1.5 text-[var(--paper)]/55">Meals</div>
              <div className="display-serif text-[32px] leading-none text-[var(--paper)]">
                {loggedCount}<span className="text-[var(--paper)]/30">/{MEAL_ORDER.length}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-[2px] w-full bg-[var(--line-soft)] overflow-hidden">
            <div
              className="h-full bg-[var(--paper)] bar-fill"
              style={{ '--pct': Math.min(1, totals.c / goals.calorieGoal), width: '100%' }}
            />
          </div>
        </div>

        {/* Today timeline */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-3">
            <div className="eyebrow text-[var(--paper)]/60">Today's menu</div>
            <button onClick={() => go('meals')} className="eyebrow underline decoration-[0.5px] underline-offset-4 text-[var(--paper)]/70">
              All
            </button>
          </div>
          <div className="divide-y divide-[var(--line-soft)]">
            {MEAL_ORDER.map((slot, idx) => {
              const meal = day.meals[slot];
              const empty = !meal;
              return (
                <button
                  key={slot}
                  onClick={() => go(empty ? 'voice' : 'mealDetail', slot)}
                  className="group w-full flex items-center gap-4 py-4 text-left relative"
                  style={{ animation: `slideUp 600ms cubic-bezier(0.22,1,0.36,1) both`, animationDelay: `${120 + idx * 70}ms` }}
                >
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--paper)]/40 w-6">
                    0{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="display-serif text-[22px] leading-tight tracking-tight text-[var(--paper)]">
                      {MEAL_LABELS[slot]}
                    </div>
                    <div className="text-[12px] mt-0.5 text-[var(--paper)]/50">
                      {empty ? '— Not yet logged' : meal.items[0]?.name + (meal.items.length > 1 ? ` + ${meal.items.length - 1}` : '')}
                    </div>
                  </div>
                  {!empty && (
                    <div className="text-right">
                      <div className="font-mono text-[13px] tabular-nums text-[var(--paper)]">{meal.calories}</div>
                      <div className="eyebrow text-[9px] text-[var(--paper)]/50">kcal</div>
                    </div>
                  )}
                  <I.Chevron size={14} className="text-[var(--paper)]/30 transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Water */}
        <div className="mt-6 pt-6 border-t border-[var(--line)]">
          <div className="flex items-baseline justify-between mb-4">
            <div className="eyebrow text-[var(--paper)]/60">Hydration</div>
            <div className="font-mono text-[11px] tabular-nums text-[var(--paper)]/55">
              {day.waterGlasses}<span className="text-[var(--paper)]/30">/8</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => {
              const filled = i < day.waterGlasses;
              return (
                <div
                  key={i}
                  className={`flex-1 h-10 rounded-sm relative overflow-hidden transition-all ${
                    filled ? 'bg-[var(--paper)]' : 'bg-transparent border border-[var(--line)]'
                  }`}
                  style={{ transitionDelay: `${i * 40}ms` }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Meals list ---------- */
function MealsScreen({ go, day }) {
  return (
    <div className="screen-root noir">
      <StatusBar dark />
      <div className="pt-14 pb-32 px-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => go('home')} className="p-2 -ml-2 rounded-full magnet text-[var(--paper)]" aria-label="Back">
            <I.Back size={20} />
          </button>
          <button onClick={() => go('voice')} className="p-2 -mr-2 text-[var(--paper)]" aria-label="Voice">
            <I.Mic size={20} />
          </button>
        </div>

        <div className="mb-10 anim-up">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">Today · Wed 18 Apr</div>
          <h2 className="display-serif text-[48px] leading-[1.02] tracking-tight text-[var(--paper)]">
            Your<br />courses.
          </h2>
        </div>

        <div className="divide-y divide-[var(--line-soft)] border-y border-[var(--line)]">
          {MEAL_ORDER.map((slot, idx) => {
            const meal = day.meals[slot];
            const empty = !meal;
            return (
              <button
                key={slot}
                onClick={() => go(empty ? 'voice' : 'mealDetail', slot)}
                className="group w-full py-6 text-left flex gap-5 relative"
                style={{ animation: `slideUp 600ms cubic-bezier(0.22,1,0.36,1) both`, animationDelay: `${120 + idx * 80}ms` }}
              >
                <div className="w-14 shrink-0">
                  <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--paper)]/40 uppercase">
                    Course
                  </div>
                  <div className="display-serif text-[34px] leading-none mt-1 text-[var(--paper)]">0{idx + 1}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="display-serif text-[26px] leading-tight text-[var(--paper)]">
                    {MEAL_LABELS[slot]}
                  </div>
                  <div className="mt-1 text-[13px] text-[var(--paper)]/55 leading-snug">
                    {empty ? 'Awaiting ingredients' : meal.timeRangeLabel}
                  </div>
                  {!empty && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {meal.items.slice(0, 3).map((it) => (
                        <span key={it.id} className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--paper)]/65 border border-[var(--line)] px-2 py-1 rounded-full">
                          {it.name.length > 22 ? it.name.slice(0, 22) + '…' : it.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {empty ? (
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--paper)]/40">
                      — · —
                    </div>
                  ) : (
                    <>
                      <div className="display-serif text-[26px] leading-none text-[var(--paper)]"><Rollover value={meal.calories} /></div>
                      <div className="eyebrow text-[9px] mt-1 text-[var(--paper)]/50">kcal</div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 text-[13px] leading-relaxed text-[var(--paper)]/55">
          <p>
            Each meal is a chapter. Describe aloud what you're preparing — ingredients,
            portions, pairings — and Byte will compose the rest.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Meal detail ---------- */
function MealDetailScreen({ go, day, slot }) {
  const meal = day.meals[slot];
  if (!meal) {
    return (
      <div className="screen-root noir">
        <StatusBar dark />
        <div className="pt-14 px-6 text-[var(--paper)]">
          <button onClick={() => go('meals')} className="p-2 -ml-2 mb-10 text-[var(--paper)]" aria-label="Back"><I.Back /></button>
          <p>No meal here yet.</p>
        </div>
      </div>
    );
  }
  const total = meal.calories;
  const pProt = (meal.protein * 4) / total * 100;
  const pCarb = (meal.carbs * 4) / total * 100;
  const pFat  = (meal.fat * 9) / total * 100;

  return (
    <div className="screen-root noir">
      <StatusBar dark />
      <div className="pt-14 pb-32 px-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => go('meals')} className="p-2 -ml-2 magnet text-[var(--paper)]" aria-label="Back"><I.Back size={20} /></button>
          <div className="eyebrow text-[var(--paper)]/60">Course 0{MEAL_ORDER.indexOf(slot) + 1}</div>
          <button className="p-2 -mr-2 text-[var(--paper)]" aria-label="Edit"><I.Pencil size={18} /></button>
        </div>

        <div className="mb-8 anim-up">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">{meal.timeRangeLabel}</div>
          <h2 className="display-serif text-[52px] leading-[0.98] tracking-tight text-[var(--paper)]">
            {MEAL_LABELS[slot]}
          </h2>
        </div>

        {/* Hero image placeholder */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-8 border border-[var(--line)]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                repeating-linear-gradient(135deg, rgba(244,242,238,0.05) 0px, rgba(244,242,238,0.05) 1px, transparent 1px, transparent 12px),
                radial-gradient(ellipse at 30% 30%, #1a1a1a 0%, #000 60%)
              `,
            }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--paper)]/40">
              [ plate photography ]
            </div>
          </div>
          <div className="absolute left-5 bottom-5 right-5 flex items-end justify-between text-[var(--paper)]">
            <div className="display-serif text-[24px] leading-tight max-w-[65%]">
              {meal.items[0].name}
            </div>
            <div className="text-right">
              <div className="display-serif text-[36px] leading-none"><Rollover value={meal.calories} /></div>
              <div className="eyebrow text-[9px] mt-1 text-[var(--paper)]/60">kcal total</div>
            </div>
          </div>
        </div>

        {/* Macro composition bar */}
        <div className="mb-8">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">Composition</div>
          <div className="h-2 w-full flex rounded-full overflow-hidden bg-[var(--line-soft)]">
            <div className="bar-fill bg-[var(--paper)]" style={{ width: `${pProt}%`, '--pct': 1 }} />
            <div className="bar-fill bg-[var(--paper)]/50" style={{ width: `${pCarb}%`, '--pct': 1 }} />
            <div className="bar-fill bg-[var(--paper)]/25" style={{ width: `${pFat}%`, '--pct': 1 }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { l: 'Protein', v: meal.protein, dot: 'bg-[var(--paper)]' },
              { l: 'Carbs',   v: meal.carbs,   dot: 'bg-[var(--paper)]/50' },
              { l: 'Fat',     v: meal.fat,     dot: 'bg-[var(--paper)]/25' },
            ].map((m) => (
              <div key={m.l}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                  <span className="eyebrow text-[var(--paper)]/60">{m.l}</span>
                </div>
                <div className="display-serif text-[22px] leading-none text-[var(--paper)]">
                  <Rollover value={m.v} /><span className="font-sans font-mono text-[10px] ml-1 text-[var(--paper)]/45">g</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items list */}
        <div className="mb-8">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">On the plate</div>
          <div className="divide-y divide-[var(--line-soft)] border-y border-[var(--line)]">
            {meal.items.map((it, idx) => (
              <div key={it.id} className="py-4 flex items-baseline gap-4" style={{ animation: 'slideUp 600ms cubic-bezier(0.22,1,0.36,1) both', animationDelay: `${idx * 80}ms` }}>
                <span className="font-mono text-[10px] text-[var(--paper)]/40 w-6">0{idx + 1}</span>
                <div className="flex-1">
                  <div className="display-serif text-[19px] leading-tight text-[var(--paper)]">{it.name}</div>
                  <div className="text-[12px] text-[var(--paper)]/50 mt-0.5">{it.amount}</div>
                </div>
                <div className="font-mono text-[12px] tabular-nums text-[var(--paper)]">{it.calories}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 rounded-full border border-[var(--line-strong)] py-4 text-[13px] font-mono uppercase tracking-[0.2em] magnet text-[var(--paper)]">
            <I.Plus size={14} className="inline-block mr-1.5 -mt-0.5" /> Add
          </button>
          <button onClick={() => go('voice')} className="flex-1 rounded-full bg-[var(--paper)] text-[var(--ink)] py-4 text-[13px] font-mono uppercase tracking-[0.2em] magnet">
            Continue course
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Progress / Rhythm ---------- */
function ProgressScreen({ go, goals }) {
  const avg = Math.round(WEEK.reduce((a, d) => a + d.cals, 0) / WEEK.length);
  const max = Math.max(...WEEK.map(d => d.cals), goals.calorieGoal);
  return (
    <div className="screen-root noir">
      <StatusBar dark />
      <div className="pt-14 pb-32 px-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => go('home')} className="p-2 -ml-2 magnet text-[var(--paper)]" aria-label="Back"><I.Back size={20} /></button>
          <div className="eyebrow text-[var(--paper)]/60">Week 16</div>
          <div className="w-6" />
        </div>

        <div className="mb-10 anim-up">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">Your rhythm</div>
          <h2 className="display-serif text-[48px] leading-[1.02] tracking-tight text-[var(--paper)]">
            Steady hand,<br />steady heat.
          </h2>
        </div>

        <div className="mb-10 pb-8 border-b border-[var(--line)]">
          <div className="eyebrow mb-2 text-[var(--paper)]/60">Average intake</div>
          <div className="display-serif text-[92px] leading-none tracking-tight text-[var(--paper)]">
            <Rollover value={avg} />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--paper)]/50">kcal / day</div>
            <div className="font-mono text-[11px] text-[var(--paper)]/50">goal {goals.calorieGoal}</div>
          </div>
        </div>

        <div className="mb-10">
          <div className="eyebrow mb-4 text-[var(--paper)]/60">Energy by day</div>
          <div className="flex items-end justify-between gap-2 h-48">
            {WEEK.map((d, i) => {
              const pct = (d.cals / max);
              const over = d.cals > goals.calorieGoal;
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full h-full flex flex-col justify-end">
                    <div
                      className="w-full bar-fill rounded-t-sm"
                      style={{
                        height: `${pct * 100}%`,
                        background: over ? 'var(--champagne)' : 'var(--paper)',
                        '--pct': 1,
                        animationDelay: `${i * 80}ms`,
                      }}
                    />
                    <div
                      className="absolute left-0 right-0 border-t border-dashed border-[var(--paper)]/30"
                      style={{ bottom: `${(goals.calorieGoal / max) * 100}%` }}
                    />
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--paper)]/50">{d.key}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-[11px] text-[var(--paper)]/45 font-mono">— — goal line · <span style={{color:'var(--champagne)', fontWeight: 600}}>■</span> over</div>
        </div>

        <div className="mb-10">
          <div className="eyebrow mb-4 text-[var(--paper)]/60">Macros vs goal · weekly avg</div>
          <div className="space-y-5">
            {[
              { name: 'Protein', avg: 118, goal: goals.proteinGoal },
              { name: 'Carbs',   avg: 220, goal: goals.carbsGoal },
              { name: 'Fat',     avg: 68,  goal: goals.fatGoal },
            ].map((m, i) => {
              const pct = Math.min(1, m.avg / m.goal);
              return (
                <div key={m.name}>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="display-serif text-[18px] text-[var(--paper)]">{m.name}</span>
                    <span className="font-mono text-[11px] tabular-nums text-[var(--paper)]/55">
                      {m.avg}<span className="text-[var(--paper)]/35"> / {m.goal}g</span>
                    </span>
                  </div>
                  <div className="h-[3px] bg-[var(--line-soft)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--paper)] bar-fill"
                      style={{ width: '100%', transform: `scaleX(${pct})`, '--pct': pct, animationDelay: `${i * 120}ms` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[var(--line)] pt-8">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">Reflection</div>
          <p className="display-serif text-[22px] leading-[1.3] text-[var(--paper)]/90">
            "Five days inside your range this week, protein holding steady.
            Let the weekend breathe."
          </p>
          <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--paper)]/45">
            — Byte, your cooking assistant
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  SplashScreen, HomeScreen, MealsScreen, MealDetailScreen, ProgressScreen,
});

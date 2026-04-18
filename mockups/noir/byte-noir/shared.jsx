/* Shared components, icons, logo, phone frame */

const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

/* ---------- Icons (thin, custom) ---------- */
function Icon({ children, size = 20, stroke = 1.4, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}
const I = {
  Mic:      (p) => <Icon {...p}><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></Icon>,
  Menu:     (p) => <Icon {...p}><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></Icon>,
  Close:    (p) => <Icon {...p}><path d="M6 6l12 12"/><path d="M18 6l-12 12"/></Icon>,
  Chevron:  (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  Back:     (p) => <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>,
  Plus:     (p) => <Icon {...p}><path d="M12 5v14"/><path d="M5 12h14"/></Icon>,
  Keyboard: (p) => <Icon {...p}><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01"/><path d="M11 10h.01"/><path d="M15 10h.01"/><path d="M19 10h.01"/><path d="M7 14h10"/></Icon>,
  Droplet:  (p) => <Icon {...p}><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/></Icon>,
  Flame:    (p) => <Icon {...p}><path d="M12 3c1 3-1 4-1 6a3 3 0 0 0 6 0c0 5-3 8-5 10-2-2-5-5-5-10 0-3 3-5 5-6Z"/></Icon>,
  Spark:    (p) => <Icon {...p}><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="M5.6 5.6l2.8 2.8"/><path d="M15.6 15.6l2.8 2.8"/><path d="M5.6 18.4l2.8-2.8"/><path d="M15.6 8.4l2.8-2.8"/></Icon>,
  Clock:    (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  Leaf:     (p) => <Icon {...p}><path d="M20 4s-2 12-10 16C6 16 14 4 20 4Z"/><path d="M10 20c0-4 2-8 6-10"/></Icon>,
  Pencil:   (p) => <Icon {...p}><path d="M4 20h4l10-10-4-4L4 16v4Z"/></Icon>,
  Trash:    (p) => <Icon {...p}><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></Icon>,
  Signal:   (p) => <Icon {...p} stroke={1.8}><path d="M2 20h2v-4H2z" fill="currentColor"/><path d="M7 20h2v-8H7z" fill="currentColor"/><path d="M12 20h2v-12h-2z" fill="currentColor"/><path d="M17 20h2V4h-2z" fill="currentColor"/></Icon>,
  Wifi:     (p) => <Icon {...p}><path d="M2 9a15 15 0 0 1 20 0"/><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r="0.7" fill="currentColor"/></Icon>,
  Battery:  (p) => <Icon {...p}><rect x="2" y="8" width="18" height="8" rx="2"/><rect x="4" y="10" width="14" height="4" rx="1" fill="currentColor" stroke="none"/><path d="M22 11v2"/></Icon>,
};

/* ---------- Logo: official BYTE wordmark ---------- */
function ByteMark({ variant = "dark", size = "md", className = "" }) {
  // size: sm/md/lg → letter size
  const sz = size === "lg" ? "text-[56px]" : size === "sm" ? "text-[16px]" : "text-[22px]";
  // on "dark" screen background, wordmark is white. on "light" (paper), it's ink.
  const color = variant === "light" ? "text-[var(--ink)]" : "text-[var(--paper)]";
  return (
    <span
      className={`inline-flex items-center leading-none ${sz} ${color} font-sans ${className}`}
      style={{ fontWeight: 900, letterSpacing: '-0.02em' }}
      aria-label="BYTE"
    >
      BYTE
    </span>
  );
}

/* ---------- Status bar ---------- */
function StatusBar({ dark = false }) {
  return (
    <div className={`status-bar ${dark ? "on-dark" : ""}`}>
      <span className="font-mono tracking-tight">9:41</span>
      <span className="icons">
        <I.Signal size={15} />
        <I.Wifi size={14} />
        <I.Battery size={22} />
      </span>
    </div>
  );
}

/* ---------- Phone frame ---------- */
function Phone({ children, label }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="phone-shell">
        <div className="phone-screen">
          <div className="phone-notch" />
          {children}
        </div>
      </div>
      {label && (
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
          {label}
        </div>
      )}
    </div>
  );
}

/* ---------- Page transition wrapper ---------- */
function Screen({ route, children }) {
  const [render, setRender] = useState(route);
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    setAnimKey(k => k + 1);
    setRender(route);
  }, [route]);
  return (
    <div key={animKey} className="page page-enter">
      {children}
    </div>
  );
}

/* ---------- Animated number (rollover digit) ---------- */
function Rollover({ value, className = "" }) {
  // animate number changes with a smooth roll
  const [displayed, setDisplayed] = useState(value);
  const raf = useRef(null);
  useEffect(() => {
    const start = displayed;
    const target = value;
    const dur = 700;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = Math.round(start + (target - start) * eased);
      setDisplayed(cur);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line
  }, [value]);
  return <span className={`tabular-nums ${className}`}>{displayed}</span>;
}

/* ---------- Mock data / context ---------- */
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch:     'Lunch',
  dinner:    'Dinner',
  snack:     'Snack',
};

const INITIAL_DAY = {
  waterGlasses: 5,
  exerciseCalories: 210,
  meals: {
    breakfast: {
      calories: 420, protein: 22, carbs: 48, fat: 14,
      timeRangeLabel: '7:40 – 7:55 AM',
      items: [
        { id: 'b1', name: 'Greek yogurt bowl', amount: '1 cup · honey, blueberries', calories: 260 },
        { id: 'b2', name: 'Sourdough toast',   amount: '2 slices · salted butter',  calories: 160 },
      ],
    },
    lunch: {
      calories: 620, protein: 42, carbs: 58, fat: 22,
      timeRangeLabel: '12:30 – 1:05 PM',
      items: [
        { id: 'l1', name: 'Seared tuna niçoise', amount: 'bowl · soft egg',   calories: 420 },
        { id: 'l2', name: 'Baguette',            amount: '2 thin slices',     calories: 200 },
      ],
    },
    dinner: null,
    snack: {
      calories: 180, protein: 6, carbs: 20, fat: 9,
      timeRangeLabel: '3:45 PM',
      items: [
        { id: 's1', name: 'Almonds & dark chocolate', amount: 'small handful', calories: 180 },
      ],
    },
  },
};

const GOALS = {
  calorieGoal: 2100,
  proteinGoal: 130,
  carbsGoal:   240,
  fatGoal:     70,
};

const WEEK = [
  { key: 'Mon', cals: 1980 },
  { key: 'Tue', cals: 2050 },
  { key: 'Wed', cals: 1840 },
  { key: 'Thu', cals: 2180 },
  { key: 'Fri', cals: 2020 },
  { key: 'Sat', cals: 2260 },
  { key: 'Sun', cals: 1220 },
];

/* ---------- Nav (bottom tab) ---------- */
function BottomNav({ route, go }) {
  const tabs = [
    { key: 'home',     label: 'Home',     icon: (p) => <I.Spark {...p} /> },
    { key: 'meals',    label: 'Meals',    icon: (p) => <I.Leaf {...p} /> },
    { key: 'voice',    label: null,       icon: (p) => <I.Mic size={22} stroke={1.6} {...p} />, primary: true },
    { key: 'progress', label: 'Rhythm',   icon: (p) => <I.Flame {...p} /> },
    { key: 'profile',  label: 'Profile',  icon: (p) => <I.Clock {...p} /> },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 pb-5 pt-2 px-3 z-40">
      <div className="relative flex items-center justify-between rounded-full bg-[var(--ink)]/[0.92] backdrop-blur-xl px-2 py-2 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)]">
        {tabs.map((t) => {
          if (t.primary) {
            return (
              <button
                key={t.key}
                onClick={() => go(t.key)}
                aria-label="Voice"
                className="relative -mt-7 grid place-items-center h-14 w-14 rounded-full bg-[var(--paper)] text-[var(--ink)] shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)] magnet"
              >
                <span className="absolute inset-0 rounded-full ring-1 ring-[var(--champagne)]/40" />
                {t.icon({})}
              </button>
            );
          }
          const active = route === t.key;
          return (
            <button
              key={t.key}
              onClick={() => go(t.key)}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors ${active ? 'text-[var(--paper)]' : 'text-[#e8e4d8] hover:text-[var(--paper)]'}`}
            >
              {t.icon({ size: 16, stroke: active ? 2 : 1.7 })}
              <span>{t.label}</span>
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--champagne)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Exports ---------- */
Object.assign(window, {
  I, ByteMark, StatusBar, Phone, Screen, Rollover,
  MEAL_ORDER, MEAL_LABELS, INITIAL_DAY, GOALS, WEEK,
  BottomNav,
  useState, useEffect, useRef, useMemo, useCallback,
});

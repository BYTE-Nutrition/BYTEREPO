/* App controller: routing, state, tweaks, canvas layout */

function ByteApp({ variant }) {
  const [route, setRoute] = useState('splash'); // splash | home | meals | mealDetail | voice | progress
  const [slotArg, setSlotArg] = useState('lunch');
  const [day, setDay] = useState(INITIAL_DAY);

  // Restore route to home after splash the first time
  useEffect(() => {
    if (route === 'splash') {
      try {
        const saved = localStorage.getItem('byte-noir-route');
        if (saved && saved !== 'splash') {
          // skip splash on reload
          const t = setTimeout(() => setRoute(saved), 100);
          return () => clearTimeout(t);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('byte-noir-route', route); } catch {}
  }, [route]);

  const go = useCallback((r, arg) => {
    if (arg) setSlotArg(arg);
    setRoute(r);
  }, []);

  const onConfirmMeal = useCallback((slot, items, transcript) => {
    const totals = items.reduce((a, i) => ({
      calories: a.calories + i.calories,
      protein:  a.protein  + i.protein,
      carbs:    a.carbs    + i.carbs,
      fat:      a.fat      + i.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    setDay(d => ({
      ...d,
      meals: {
        ...d.meals,
        [slot]: {
          ...totals,
          timeRangeLabel: new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
          items: items.map(i => ({ id: i.id, name: i.name, amount: i.amount, calories: i.calories })),
        },
      },
    }));
  }, []);

  let body = null;
  switch (route) {
    case 'splash':     body = <SplashScreen onDone={() => setRoute('home')} variant={variant} />; break;
    case 'home':       body = <HomeScreen go={go} day={day} goals={GOALS} variant={variant} />; break;
    case 'meals':      body = <MealsScreen go={go} day={day} />; break;
    case 'mealDetail': body = <MealDetailScreen go={go} day={day} slot={slotArg} />; break;
    case 'voice':      body = <VoiceScreen go={go} onConfirm={onConfirmMeal} />; break;
    case 'progress':   body = <ProgressScreen go={go} goals={GOALS} />; break;
    default:           body = <HomeScreen go={go} day={day} goals={GOALS} variant={variant} />;
  }

  const showNav = !['splash', 'voice'].includes(route);

  return (
    <>
      <Screen route={route}>{body}</Screen>
      {showNav && (
        <BottomNav
          route={route}
          go={(k) => {
            if (k === 'home') return go('home');
            if (k === 'meals') return go('meals');
            if (k === 'voice') return go('voice');
            if (k === 'progress') return go('progress');
            if (k === 'profile') return go('home'); // not built; land home
          }}
        />
      )}
    </>
  );
}

/* ---------- Canvas with multiple phones showing the flow ---------- */

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "view": "flow",
  "accent": "champagne",
  "serifDisplay": "Instrument Serif"
}/*EDITMODE-END*/;

function Canvas() {
  const [tweaks, setTweaks] = useState(TWEAKS_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // Edit mode protocol
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setTweaksOpen(true);
      if (d.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const updateTweak = (patch) => {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
  };

  // Apply accent var
  useEffect(() => {
    const map = {
      champagne: '#d8c89c',
      paper:     '#f2efe8',
      ember:     '#c56a3b',
    };
    document.documentElement.style.setProperty('--champagne', map[tweaks.accent] || '#d8c89c');
  }, [tweaks.accent]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--serif-display',
      `"${tweaks.serifDisplay}", serif`
    );
  }, [tweaks.serifDisplay]);

  // Flow view: 5 phones, each locked to a different screen
  if (tweaks.view === 'flow') {
    return (
      <>
        <CanvasHeader title="Byte · Noir redesign" subtitle="Editorial black & white, voice-first. Five key screens." />
        <div className="grid-row">
          <FlowPhone label="01  Splash"        initial="splash"     />
          <FlowPhone label="02  Home"          initial="home"       />
          <FlowPhone label="03  Voice capture" initial="voice"      />
          <FlowPhone label="04  Meal detail"   initial="mealDetail" slot="lunch" />
          <FlowPhone label="05  Rhythm"        initial="progress"   />
        </div>
        <CanvasFooter />
        <TweaksPanel open={tweaksOpen} tweaks={tweaks} set={updateTweak} />
      </>
    );
  }

  // Single live prototype view
  return (
    <>
      <CanvasHeader title="Byte · Noir (interactive)" subtitle="Tap the orb. Navigate the flow. All screens live." />
      <div className="grid-row">
        <Phone>
          <ByteApp variant={tweaks.accent} />
        </Phone>
      </div>
      <CanvasFooter />
      <TweaksPanel open={tweaksOpen} tweaks={tweaks} set={updateTweak} />
    </>
  );
}

function FlowPhone({ label, initial, slot }) {
  return (
    <Phone label={label}>
      <LockedFlow initial={initial} slot={slot} />
    </Phone>
  );
}

// A phone locked to a particular screen but fully interactive within
function LockedFlow({ initial, slot }) {
  const [route, setRoute] = useState(initial);
  const [slotArg, setSlotArg] = useState(slot || 'lunch');
  const [day, setDay] = useState(INITIAL_DAY);

  const go = useCallback((r, arg) => {
    if (arg) setSlotArg(arg);
    setRoute(r);
  }, []);

  const onConfirmMeal = useCallback(() => setRoute(initial), [initial]);

  let body;
  switch (route) {
    case 'splash':     body = <SplashScreen onDone={() => setRoute('home')} />; break;
    case 'home':       body = <HomeScreen go={go} day={day} goals={GOALS} />; break;
    case 'meals':      body = <MealsScreen go={go} day={day} />; break;
    case 'mealDetail': body = <MealDetailScreen go={go} day={day} slot={slotArg} />; break;
    case 'voice':      body = <VoiceScreen go={go} onConfirm={onConfirmMeal} />; break;
    case 'progress':   body = <ProgressScreen go={go} goals={GOALS} />; break;
    default:           body = <HomeScreen go={go} day={day} goals={GOALS} />;
  }
  const showNav = !['splash', 'voice'].includes(route);
  return (
    <>
      <Screen route={route}>{body}</Screen>
      {showNav && (
        <BottomNav route={route} go={(k) => {
          if (k === 'home') return go('home');
          if (k === 'meals') return go('meals');
          if (k === 'voice') return go('voice');
          if (k === 'progress') return go('progress');
          if (k === 'profile') return go('home');
        }} />
      )}
    </>
  );
}

function CanvasHeader({ title, subtitle }) {
  return (
    <div className="canvas-header">
      <div className="title-col">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">Mockup · 2026.04</div>
        <div className="font-serif text-white text-[40px] leading-[1.05]">{title}</div>
        <div className="title-sub text-white/60 text-[14px] max-w-xl">{subtitle}</div>
      </div>
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/40 text-right shrink-0">
        iPhone 15 · 390×844<br/>
        <span className="text-white/25">AI cooking assistant</span>
      </div>
    </div>
  );
}

function CanvasFooter() {
  return (
    <div className="canvas-footer">
      <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35">
        Direction · Editorial noir · Dynamic movement · Preserves existing flow
      </div>
    </div>
  );
}

function TweaksPanel({ open, tweaks, set }) {
  if (!open) return null;
  const accents = ['champagne', 'paper', 'ember'];
  const views   = ['flow', 'interactive'];
  const serifs  = ['Instrument Serif', 'Archivo'];
  return (
    <div className="tweaks-panel">
      <h4>Tweaks</h4>
      <label>View</label>
      <div className="row">
        {views.map(v => (
          <button key={v} className={tweaks.view === v ? 'active' : ''} onClick={() => set({ view: v })}>
            {v}
          </button>
        ))}
      </div>
      <label>Accent</label>
      <div className="row">
        {accents.map(a => (
          <button key={a} className={tweaks.accent === a ? 'active' : ''} onClick={() => set({ accent: a })}>
            {a}
          </button>
        ))}
      </div>
      <label>Display type</label>
      <div className="row">
        {serifs.map(s => (
          <button key={s} className={tweaks.serifDisplay === s ? 'active' : ''} onClick={() => set({ serifDisplay: s })}>
            {s.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Mount + canvas CSS ---------- */
const style = document.createElement('style');
style.textContent = `
  #root {
    min-height: 100vh;
    background:
      radial-gradient(1400px 700px at 50% 0%, #1c1c1c 0%, #0a0a0a 60%, #050505 100%);
    padding: 48px 36px 72px;
    overflow: auto;
  }
  .canvas-header {
    max-width: 2200px;
    margin: 0 auto 48px;
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 32px;
    padding: 0 12px;
  }
  .canvas-header .title-col { flex: 1; min-width: 0; }
  .canvas-header .title-sub { margin-top: 18px; }
  .canvas-footer {
    max-width: 2200px;
    margin: 48px auto 0;
    text-align: center;
  }
  .grid-row {
    max-width: 2200px;
    margin: 0 auto;
    display: flex;
    gap: 40px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .phone-screen select { font-family: inherit; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(<Canvas />);

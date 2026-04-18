/* Voice capture: immersive orb + live transcript + review */

/* ---------- Meal Slot Rail (collapsible vertical toggle) ---------- */
function MealSlotRail({ slot, setSlot }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // close when tapping outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative select-none"
    >
      {/* Collapsed pill — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border transition-all ${
          open
            ? 'border-[var(--paper)]/10 bg-[var(--ink)]/0'
            : 'border-[var(--paper)]/18 bg-[var(--ink)]/50 backdrop-blur hover:border-[var(--paper)]/35'
        }`}
        aria-expanded={open}
        aria-label="Change meal slot"
      >
        <span className="relative grid place-items-center w-[11px] h-[11px]">
          <span className="absolute inset-0 rounded-full bg-[var(--champagne)]" />
          <span
            className="absolute -inset-[5px] rounded-full border border-[var(--champagne)]/35"
            style={{ animation: 'ringPulse 2.4s cubic-bezier(0.22,1,0.36,1) infinite' }}
          />
        </span>
        <span
          className={`text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--paper)] transition-opacity ${
            open ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {MEAL_LABELS[slot]}
        </span>
      </button>

      {/* Expanded rail */}
      <div
        className={`absolute left-0 top-0 pt-1.5 pl-2 transition-all duration-300 ${
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
        <div className="relative flex flex-col items-start gap-0 pt-1">
          <div className="absolute left-[5px] top-3 bottom-2 w-px bg-[var(--paper)]/15" aria-hidden />
          {MEAL_ORDER.map((s) => {
            const active = s === slot;
            return (
              <button
                key={s}
                onClick={() => { setSlot(s); setOpen(false); }}
                className="group relative flex items-center gap-3 py-[7px] pr-2 pl-0 text-left"
                aria-pressed={active}
              >
                <span className="relative z-10 grid place-items-center w-[11px] h-[11px] rounded-full">
                  <span
                    className={`absolute inset-0 rounded-full border transition-all ${
                      active
                        ? 'border-[var(--champagne)] bg-[var(--champagne)] scale-100'
                        : 'border-[var(--paper)]/35 bg-[var(--ink)]/60 scale-[0.85] group-hover:border-[var(--paper)]/70'
                    }`}
                  />
                </span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-[0.22em] transition-all ${
                    active
                      ? 'text-[var(--paper)]'
                      : 'text-[var(--paper)]/50 group-hover:text-[var(--paper)]/90'
                  }`}
                >
                  {MEAL_LABELS[s]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Voice immersive ---------- */
function VoiceScreen({ go, onConfirm }) {
  const [phase, setPhase] = useState('listen'); // listen | confirm
  const [transcript, setTranscript] = useState('');
  const [slot, setSlot] = useState('dinner');
  const [level, setLevel] = useState(0.2);
  const [liveItems, setLiveItems] = useState([]);

  // Scripted "speech" — types out a realistic cooking description
  const script = "pan-seared duck breast with cherry reduction, wild rice, and roasted carrots";
  useEffect(() => {
    if (phase !== 'listen') return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTranscript(script.slice(0, i));
      if (i >= script.length) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, [phase]);

  // fake audio level
  useEffect(() => {
    if (phase !== 'listen') return;
    const id = setInterval(() => {
      setLevel(0.15 + Math.random() * 0.55);
    }, 120);
    return () => clearInterval(id);
  }, [phase]);

  // Parse as we go (mock)
  useEffect(() => {
    const t = transcript.toLowerCase();
    const items = [];
    if (t.includes('duck')) items.push({ id: 'duck', name: 'Seared duck breast', amount: '1 breast · 160 g', calories: 340, protein: 32, carbs: 0, fat: 22 });
    if (t.includes('cherry')) items.push({ id: 'cherry', name: 'Cherry reduction', amount: '2 tbsp · port, shallot', calories: 80, protein: 0, carbs: 18, fat: 0 });
    if (t.includes('wild rice')) items.push({ id: 'rice', name: 'Wild rice pilaf', amount: '3/4 cup', calories: 160, protein: 5, carbs: 34, fat: 1 });
    if (t.includes('carrot')) items.push({ id: 'carrot', name: 'Roasted carrots', amount: '1 cup · thyme, honey', calories: 110, protein: 1, carbs: 22, fat: 3 });
    setLiveItems(items);
  }, [transcript]);

  const totalCals = liveItems.reduce((a, i) => a + i.calories, 0);

  if (phase === 'confirm') {
    return <ReviewScreen
      items={liveItems}
      transcript={transcript}
      slot={slot}
      onEdit={() => setPhase('listen')}
      onCancel={() => go('home')}
      onConfirm={() => {
        onConfirm(slot, liveItems, transcript);
        go('home');
      }}
    />;
  }

  // Orb sizing by audio
  const orbScale = 1 + level * 0.18;
  const orbRingOpacity = 0.25 + level * 0.45;

  return (
    <div className="screen-root noir canvas-bg grain">
      <StatusBar dark />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-14 px-6 flex items-center justify-between">
        <button onClick={() => go('home')} className="p-2 -ml-2 text-[var(--paper)]/70 hover:text-[var(--paper)]" aria-label="Close">
          <I.Close size={22} />
        </button>
        <div className="eyebrow text-[var(--paper)]/50">Voice</div>
        <button className="p-2 -mr-2 text-[var(--paper)]/70" aria-label="Keyboard">
          <I.Keyboard size={20} />
        </button>
      </div>

      {/* Drifting atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(216,200,156,0.18) 0%, rgba(216,200,156,0) 65%)',
            animation: 'orbFloat 6s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-10 -right-20 w-[360px] h-[360px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 65%)',
            animation: 'orbFloat 8s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Orb */}
      <div className="relative z-10 pt-[90px] flex flex-col items-center">
        {/* Meal slot rail — left aligned, vertically between orb and caption */}
        <div className="absolute left-5 top-[170px] z-20">
          <MealSlotRail slot={slot} setSlot={setSlot} />
        </div>

        <div className="relative w-[170px] h-[170px]">
          <div className="ring" style={{ opacity: orbRingOpacity }} />
          <div className="ring delay-1" style={{ opacity: orbRingOpacity * 0.8 }} />
          <div className="ring delay-2" style={{ opacity: orbRingOpacity * 0.6 }} />
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #2a2a2a 0%, #141414 55%, #080808 100%)',
              boxShadow: 'inset 0 0 40px rgba(255,255,255,0.05), inset 0 -20px 50px rgba(0,0,0,0.5), 0 30px 60px -10px rgba(0,0,0,0.7)',
              transform: `scale(${orbScale})`,
              transition: 'transform 120ms ease-out',
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at 35% 28%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)',
                animation: 'orbRotate 20s linear infinite',
              }}
            />
          </div>
        </div>

        <div className="mt-10 eyebrow text-[var(--paper)]/60">
          {transcript ? 'Byte is composing' : 'Byte is listening'}
        </div>

        {/* Live waveform */}
        <div className="mt-5 flex items-center gap-[3px] h-8 text-[var(--paper)]">
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className="wave-bar w-[3px] h-full"
              style={{
                animationDelay: `${i * 60}ms`,
                animationDuration: `${900 + (i % 5) * 100}ms`,
                opacity: 0.4 + (i % 4) * 0.15,
              }}
            />
          ))}
        </div>
      </div>

      {/* Conversation: your words + Byte's response */}
      <div className="relative z-10 px-6 mt-10 space-y-4">
        {/* YOU */}
        <div className="flex flex-col items-end">
          <div className="eyebrow text-[var(--paper)]/40 mb-1.5 pr-1">You</div>
          <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--paper)] text-[var(--ink)] px-4 py-3">
            <p className="display-serif text-[18px] leading-[1.25] min-h-[22px]">
              {transcript ? (
                <>
                  {transcript}
                  <span className="inline-block w-[2px] h-[16px] align-middle bg-[var(--ink)] ml-1 animate-pulse" />
                </>
              ) : (
                <span className="text-[var(--ink)]/40">Describe what you're making…</span>
              )}
            </p>
          </div>
        </div>

        {/* BYTE */}
        {transcript.length > 25 && (
          <div className="flex flex-col items-start anim-up">
            <div className="eyebrow text-[var(--paper)]/40 mb-1.5 pl-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-[var(--paper)]/60" />
              Byte
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-[var(--paper)]/15 bg-[var(--ink-2)] text-[var(--paper)] px-4 py-3">
              <p className="display-serif text-[17px] leading-[1.3]">
                {transcript.length >= script.length
                  ? `Nice pick — ${liveItems.length} items, about ${totalCals} kcal. Finish the duck to 57°C and rest it five minutes before slicing.`
                  : transcript.includes('duck')
                    ? 'Listening — duck breast, got it. What is it on?'
                    : 'Listening — keep going…'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live parsed items drawer */}
      {liveItems.length > 0 && (
        <div className="relative z-10 mt-8 mx-6 rounded-2xl border border-[var(--paper)]/12 bg-[var(--ink-2)]/80 backdrop-blur p-5 anim-up">
          <div className="flex items-baseline justify-between mb-3">
            <div className="eyebrow text-[var(--paper)]/55">Composing · {MEAL_LABELS[slot].toLowerCase()}</div>
            <div className="display-serif text-[22px] text-[var(--paper)]"><Rollover value={totalCals} /><span className="font-mono text-[10px] ml-1 text-[var(--paper)]/50">kcal</span></div>
          </div>
          <div className="divide-y divide-[var(--paper)]/10">
            {liveItems.map((it, i) => (
              <div
                key={it.id}
                className="py-2.5 flex items-baseline gap-3"
                style={{ animation: 'slideUp 500ms cubic-bezier(0.22,1,0.36,1) both' }}
              >
                <span className="font-mono text-[10px] text-[var(--paper)]/40 w-5">0{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="display-serif text-[17px] text-[var(--paper)] leading-tight">{it.name}</div>
                  <div className="text-[11px] text-[var(--paper)]/50 mt-0.5 font-mono">{it.amount}</div>
                </div>
                <div className="font-mono text-[12px] text-[var(--paper)]/80 tabular-nums">{it.calories}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-10 px-6">
        <div className="flex gap-3">
          <button
            onClick={() => go('home')}
            className="flex-1 rounded-full border border-[var(--paper)]/20 text-[var(--paper)]/80 py-4 text-[12px] font-mono uppercase tracking-[0.2em] magnet"
          >
            Cancel
          </button>
          <button
            onClick={() => setPhase('confirm')}
            disabled={liveItems.length === 0}
            className="flex-1 rounded-full bg-[var(--paper)] text-[var(--ink)] py-4 text-[12px] font-mono uppercase tracking-[0.2em] magnet disabled:opacity-40"
          >
            Review
          </button>
        </div>
        <div className="text-center mt-4 font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--paper)]/40">
          Tap orb to pause  ·  Keyboard to type
        </div>
      </div>
    </div>
  );
}

/* ---------- Review (confirm) screen ---------- */
function ReviewScreen({ items, transcript, slot, onEdit, onCancel, onConfirm }) {
  const totals = items.reduce((a, i) => ({
    c: a.c + i.calories, p: a.p + i.protein, ca: a.ca + i.carbs, f: a.f + i.fat,
  }), { c: 0, p: 0, ca: 0, f: 0 });

  return (
    <div className="screen-root noir">
      <StatusBar dark />
      <div className="pt-14 pb-32 px-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onCancel} className="p-2 -ml-2 magnet text-[var(--paper)]" aria-label="Close"><I.Close size={20} /></button>
          <div className="eyebrow text-[var(--paper)]/60">Mise en place</div>
          <button onClick={onEdit} className="p-2 -mr-2 text-[var(--paper)]" aria-label="Edit"><I.Pencil size={18} /></button>
        </div>

        <div className="mb-8 anim-up">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">{MEAL_LABELS[slot]} · review</div>
          <h2 className="display-serif text-[44px] leading-[1.02] tracking-tight text-[var(--paper)]">
            Does this<br /><span className="shimmer-on-dark">read right?</span>
          </h2>
        </div>

        <div className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-5">
          <div className="eyebrow mb-2 text-[var(--paper)]/55">You told Byte</div>
          <p className="display-serif text-[19px] leading-snug text-[var(--paper)]">
            "{transcript}"
          </p>
        </div>

        <div className="mb-8">
          <div className="eyebrow mb-3 text-[var(--paper)]/60">The composition</div>
          <div className="divide-y divide-[var(--line-soft)] border-y border-[var(--line)]">
            {items.map((it, i) => (
              <div
                key={it.id}
                className="py-4 flex items-baseline gap-4"
                style={{ animation: 'slideUp 600ms cubic-bezier(0.22,1,0.36,1) both', animationDelay: `${i * 80}ms` }}
              >
                <span className="font-mono text-[10px] text-[var(--paper)]/40 w-6">0{i + 1}</span>
                <div className="flex-1">
                  <div className="display-serif text-[20px] leading-tight text-[var(--paper)]">{it.name}</div>
                  <div className="text-[12px] text-[var(--paper)]/55 mt-0.5 font-mono">{it.amount}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[12px] tabular-nums text-[var(--paper)]">{it.calories}</div>
                  <div className="eyebrow text-[9px] mt-0.5 text-[var(--paper)]/50">kcal</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-10 pt-6 border-t border-[var(--line)]">
          <div className="flex items-end justify-between">
            <div>
              <div className="eyebrow mb-2 text-[var(--paper)]/60">Total energy</div>
              <div className="display-serif text-[76px] leading-none tracking-tight text-[var(--paper)]">
                <Rollover value={totals.c} />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--paper)]/50 mt-1">kcal</div>
            </div>
            <div className="text-right space-y-2">
              <div className="font-mono text-[11px] tabular-nums text-[var(--paper)]/70">P <Rollover value={totals.p} />g</div>
              <div className="font-mono text-[11px] tabular-nums text-[var(--paper)]/70">C <Rollover value={totals.ca} />g</div>
              <div className="font-mono text-[11px] tabular-nums text-[var(--paper)]/70">F <Rollover value={totals.f} />g</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full rounded-full bg-[var(--paper)] text-[var(--ink)] py-5 text-[12px] font-mono uppercase tracking-[0.22em] magnet"
          >
            Plate it · save to log
          </button>
          <button
            onClick={onEdit}
            className="w-full rounded-full border border-[var(--line-strong)] text-[var(--paper)] py-4 text-[12px] font-mono uppercase tracking-[0.2em] magnet"
          >
            Re-describe
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VoiceScreen, ReviewScreen });

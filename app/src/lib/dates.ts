export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(): string {
  return dateKey(new Date())
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDaysKey(key: string, delta: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + delta)
  return dateKey(d)
}

export function weekRangeLabel(endKey: string): string {
  const end = parseKey(endKey)
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
  const a = start.toLocaleDateString(undefined, opts)
  const b = end.toLocaleDateString(undefined, opts)
  return `${a.split(',')[0]} - ${b}`
}

export function planWeekNumber(planStartKey: string, currentKey: string): number {
  const start = parseKey(planStartKey).getTime()
  const cur = parseKey(currentKey).getTime()
  const diff = Math.floor((cur - start) / (86400000 * 7))
  return Math.max(1, diff + 1)
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatRange(start: Date, end: Date): string {
  return `${formatTime(start)} - ${formatTime(end)}`
}

/** Seven calendar days ending on `endKey` (oldest first). */
export function rollingWeekKeys(endKey: string = todayKey()): string[] {
  const end = parseKey(endKey)
  const out: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    out.push(dateKey(d))
  }
  return out
}

export function shortWeekdayLabel(key: string): string {
  return parseKey(key).toLocaleDateString(undefined, { weekday: 'short' })
}

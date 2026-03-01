export function getWeekStart(now = new Date()): { iso: string; label: string } {
  // 1. Find weekday index in ET (0=Sun, 1=Mon, … 6=Sat)
  const etWeekdayShort = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  }).format(now)
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(etWeekdayShort)

  // 2. Days to subtract to reach the most recent Monday
  const daysBack = weekdayIndex === 0 ? 6 : weekdayIndex - 1

  // 3. Approximate Monday in UTC (±1hr DST error is fine — we snap to ET midnight next)
  const approxMonday = new Date(now.getTime() - daysBack * 864e5)

  // 4. Get the ET calendar date for that Monday (en-CA gives YYYY-MM-DD)
  const mondayDateStr = approxMonday.toLocaleDateString('en-CA', {
    timeZone: 'America/New_York',
  }) // "2026-03-02"

  const [y, m, d] = mondayDateStr.split('-').map(Number)

  // 5. Find the UTC time that equals Monday 00:01 ET, handling EST vs EDT
  const iso = etMidnightToUTC(y, m, d)

  // 6. Human-readable label: "March 2, 2026"
  //    Use noon UTC to avoid any date-flip from timezone display
  const label = new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return { iso, label }
}

function etMidnightToUTC(year: number, month: number, day: number): string {
  // Try EST (+5 UTC offset) then EDT (+4 UTC offset); pick the one whose
  // ET local hour rounds to 0 (i.e. it actually is midnight ET)
  for (const utcHourOffset of [5, 4]) {
    const candidate = new Date(Date.UTC(year, month - 1, day, utcHourOffset, 1))
    const localHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hourCycle: 'h23',
      }).format(candidate)
    )
    if (localHour === 0) return candidate.toISOString()
  }
  // Fallback: assume EST
  return new Date(Date.UTC(year, month - 1, day, 5, 1)).toISOString()
}

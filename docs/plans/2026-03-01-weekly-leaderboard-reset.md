# Weekly Leaderboard Reset Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Filter the leaderboard to show only scores from the current week (Monday 12:01 AM ET through the following Sunday night), and display a subtitle "High scores for the week of [Monday's date]".

**Architecture:** A new pure utility `getWeekStart()` computes the Monday 12:01 AM ET boundary as a UTC ISO string (for Supabase filtering) plus a human-readable label. `fetchLeaderboard` adds a `.gte('played_at', ...)` filter and returns the label alongside entries. `LeaderboardScreen` renders the label as a subtitle. `App` stores and passes the label down.

**Tech Stack:** TypeScript, Supabase JS client, React, Vitest + Testing Library

---

### Task 1: Create `src/lib/weekStart.ts` — write the failing tests first

**Files:**
- Create: `src/lib/weekStart.test.ts`
- Create: `src/lib/weekStart.ts`

**Step 1: Write the failing tests**

Create `src/lib/weekStart.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getWeekStart } from './weekStart'

describe('getWeekStart', () => {
  it('returns Monday of the current week on a Wednesday (EST)', () => {
    // Wednesday 2026-03-04 at noon ET (EST = UTC-5) → 2026-03-04T17:00:00Z
    const wednesday = new Date('2026-03-04T17:00:00Z')
    const { iso, label } = getWeekStart(wednesday)
    expect(label).toBe('March 2, 2026')
    expect(iso).toBe('2026-03-02T05:01:00.000Z') // Monday 00:01 EST = 05:01 UTC
  })

  it('returns same Monday when called on a Monday after 12:01 AM (EST)', () => {
    // Monday 2026-03-02 at 8 AM ET = 2026-03-02T13:00:00Z
    const monday = new Date('2026-03-02T13:00:00Z')
    const { iso, label } = getWeekStart(monday)
    expect(label).toBe('March 2, 2026')
    expect(iso).toBe('2026-03-02T05:01:00.000Z')
  })

  it('returns the previous Monday when called on a Sunday (EST)', () => {
    // Sunday 2026-03-08 at 10 AM ET = 2026-03-08T15:00:00Z (still EST before DST)
    const sunday = new Date('2026-03-08T15:00:00Z')
    const { iso, label } = getWeekStart(sunday)
    expect(label).toBe('March 2, 2026')
    expect(iso).toBe('2026-03-02T05:01:00.000Z')
  })

  it('handles EDT correctly after DST switch (Monday at 1 AM EDT)', () => {
    // DST starts Sunday 2026-03-08 at 2 AM ET → clocks spring to 3 AM
    // Monday 2026-03-09 at 1 AM EDT = 2026-03-09T05:00:00Z (EDT = UTC-4)
    const mondayEDT = new Date('2026-03-09T05:00:00Z')
    const { iso, label } = getWeekStart(mondayEDT)
    expect(label).toBe('March 9, 2026')
    expect(iso).toBe('2026-03-09T04:01:00.000Z') // Monday 00:01 EDT = 04:01 UTC
  })
})
```

**Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/weekStart.test.ts
```

Expected: FAIL — "Cannot find module './weekStart'"

**Step 3: Implement `src/lib/weekStart.ts`**

```typescript
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
  })
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
```

**Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/weekStart.test.ts
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/lib/weekStart.ts src/lib/weekStart.test.ts
git commit -m "feat: add getWeekStart utility for Monday 12:01 AM ET boundary"
```

---

### Task 2: Update `src/lib/leaderboard.ts` to filter by current week and return weekLabel

**Files:**
- Modify: `src/lib/leaderboard.ts`
- Modify: `src/App.tsx` (just the import/call site — detailed in Task 4)

**Step 1: Update `leaderboard.ts`**

Replace the entire file contents:

```typescript
import { supabase } from './supabase'
import { getWeekStart } from './weekStart'
import type { LeaderboardEntry } from '../types'

export async function submitScore(entry: Omit<LeaderboardEntry, 'id' | 'played_at'>): Promise<void> {
  const { error } = await supabase.from('leaderboard').insert(entry)
  if (error) throw new Error(error.message)
}

export async function fetchLeaderboard(
  limit = 20
): Promise<{ entries: LeaderboardEntry[]; weekLabel: string }> {
  const { iso, label } = getWeekStart()
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .gte('played_at', iso)
    .order('score', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return { entries: data as LeaderboardEntry[], weekLabel: label }
}
```

**Step 2: Run all tests to confirm nothing is broken yet**

```bash
npm test
```

Expected: existing tests pass; App.tsx will have a TypeScript error (handled in Task 4) but tests should still pass since vitest doesn't typecheck.

**Step 3: Commit**

```bash
git add src/lib/leaderboard.ts
git commit -m "feat: filter leaderboard to current week using played_at"
```

---

### Task 3: Update `LeaderboardScreen` to show the week subtitle

**Files:**
- Modify: `src/components/LeaderboardScreen.tsx`
- Modify: `src/components/LeaderboardScreen.test.tsx`

**Step 1: Update the existing render calls in `LeaderboardScreen.test.tsx`**

All three `render(...)` calls need a `weekLabel` prop added. Also add a new test for the subtitle.

Replace `src/components/LeaderboardScreen.test.tsx` with:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LeaderboardScreen } from './LeaderboardScreen'
import type { LeaderboardEntry } from '../types'

const entries: LeaderboardEntry[] = [
  { id: '1', nickname: 'Keef', score: 120, max_score: 150, questions: 10, correct: 9, played_at: '2026-02-28T10:00:00Z' },
  { id: '2', nickname: 'Mick', score: 100, max_score: 150, questions: 10, correct: 8, played_at: '2026-02-28T11:00:00Z' },
]

describe('LeaderboardScreen', () => {
  it('renders entries in order', () => {
    render(<LeaderboardScreen entries={entries} currentNickname={null} loading={false} onPlayAgain={vi.fn()} weekLabel="February 23, 2026" />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Keef')
    expect(items[1]).toHaveTextContent('Mick')
  })

  it('highlights current player', () => {
    render(<LeaderboardScreen entries={entries} currentNickname="Keef" loading={false} onPlayAgain={vi.fn()} weekLabel="February 23, 2026" />)
    expect(screen.getByText('Keef').closest('li')?.getAttribute('style')).toContain('var(--red)')
  })

  it('shows loading state', () => {
    render(<LeaderboardScreen entries={[]} currentNickname={null} loading={true} onPlayAgain={vi.fn()} weekLabel="February 23, 2026" />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays the week label subtitle', () => {
    render(<LeaderboardScreen entries={entries} currentNickname={null} loading={false} onPlayAgain={vi.fn()} weekLabel="March 2, 2026" />)
    expect(screen.getByText('High scores for the week of March 2, 2026')).toBeInTheDocument()
  })
})
```

**Step 2: Run tests to confirm the new test fails (subtitle not rendered yet)**

```bash
npx vitest run src/components/LeaderboardScreen.test.tsx
```

Expected: 3 pass, 1 fail — "Unable to find text: High scores for the week of March 2, 2026"

**Step 3: Update `LeaderboardScreen.tsx`**

Add `weekLabel: string` to the `Props` interface and render the subtitle:

```typescript
import type { LeaderboardEntry } from '../types'

interface Props {
  entries: LeaderboardEntry[]
  currentNickname: string | null
  loading: boolean
  onPlayAgain: () => void
  weekLabel: string
}

export function LeaderboardScreen({ entries, currentNickname, loading, onPlayAgain, weekLabel }: Props) {
  return (
    <div className="screen">
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900 }}>Leaderboard</h2>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: -4 }}>
        High scores for the week of {weekLabel}
      </p>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : (
        <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((entry, i) => {
            const isMe = entry.nickname === currentNickname
            return (
              <li
                key={entry.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', background: 'var(--dark)', borderRadius: 'var(--radius)',
                  border: `2px solid ${isMe ? 'var(--red)' : 'transparent'}`,
                }}
              >
                <span style={{ color: 'var(--muted)', fontWeight: 700, minWidth: 24 }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontWeight: isMe ? 700 : 400 }}>{entry.nickname}</span>
                <span style={{ fontWeight: 700, color: 'var(--red)' }}>{entry.score}</span>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {entry.correct}/{entry.questions}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <button className="btn-primary" onClick={onPlayAgain} style={{ marginTop: 'auto' }}>
        Play Again
      </button>
    </div>
  )
}
```

**Step 4: Run the leaderboard tests to confirm all 4 pass**

```bash
npx vitest run src/components/LeaderboardScreen.test.tsx
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/components/LeaderboardScreen.tsx src/components/LeaderboardScreen.test.tsx
git commit -m "feat: show weekly subtitle in LeaderboardScreen"
```

---

### Task 4: Update `App.tsx` to wire `weekLabel` through

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update `App.tsx`**

Make three changes:
1. Add `weekLabel` state
2. Update `loadLeaderboard` to destructure `{ entries, weekLabel }` from `fetchLeaderboard`
3. Pass `weekLabel` to `<LeaderboardScreen>`

Replace the relevant parts of `src/App.tsx`:

```typescript
import { useState, useEffect } from 'react'
import type { Screen, Question, AnsweredQuestion, LeaderboardEntry } from './types'
import { CONFIG } from './config'
import { selectQuestions } from './lib/selectQuestions'
import { submitScore, fetchLeaderboard } from './lib/leaderboard'
import { HomeScreen } from './components/HomeScreen'
import { QuizScreen } from './components/QuizScreen'
import { EndScreen } from './components/EndScreen'
import { LeaderboardScreen } from './components/LeaderboardScreen'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [nickname, setNickname] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<AnsweredQuestion[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [weekLabel, setWeekLabel] = useState('')
  const [lbLoading, setLbLoading] = useState(false)

  useEffect(() => {
    fetch('/questions.json')
      .then(r => r.json())
      .then(setAllQuestions)
  }, [])

  function startQuiz(name: string) {
    setNickname(name)
    const selected = selectQuestions(allQuestions, CONFIG.questionsPerRound, CONFIG.categoryWeights)
    setQuestions(selected)
    setScreen('quiz')
  }

  function handleQuizComplete(quizResults: AnsweredQuestion[]) {
    setResults(quizResults)
    setScreen('end')
  }

  async function handleSubmitScore() {
    const totalScore = results.reduce((s, r) => s + r.pointsEarned, 0)
    const maxScore = results.length * (CONFIG.basePoints + CONFIG.maxSpeedBonus)
    await submitScore({
      nickname,
      score: totalScore,
      max_score: maxScore,
      questions: results.length,
      correct: results.filter(r => r.correct).length,
    })
    loadLeaderboard()
    setScreen('leaderboard')
  }

  async function loadLeaderboard() {
    setLbLoading(true)
    setScreen('leaderboard')
    const { entries, weekLabel: label } = await fetchLeaderboard()
    setLeaderboard(entries)
    setWeekLabel(label)
    setLbLoading(false)
  }

  function playAgain() {
    setScreen('home')
    setResults([])
  }

  return (
    <>
      {screen === 'home' && (
        <HomeScreen onStart={startQuiz} onLeaderboard={loadLeaderboard} />
      )}
      {screen === 'quiz' && (
        <QuizScreen questions={questions} onComplete={handleQuizComplete} />
      )}
      {screen === 'end' && (
        <EndScreen
          results={results}
          nickname={nickname}
          onSubmit={handleSubmitScore}
          onPlayAgain={playAgain}
        />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen
          entries={leaderboard}
          currentNickname={nickname || null}
          loading={lbLoading}
          weekLabel={weekLabel}
          onPlayAgain={playAgain}
        />
      )}
    </>
  )
}
```

**Step 2: Run all tests**

```bash
npm test
```

Expected: all tests pass

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire weekLabel through App to LeaderboardScreen"
```

---

### Task 5: Final verification

**Step 1: TypeScript check**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors

**Step 2: Run full test suite one more time**

```bash
npm test
```

Expected: all tests pass

**Step 3: Commit if anything was adjusted**

If no changes were needed, you're done. If any fixes were required, commit them:

```bash
git add -p
git commit -m "fix: resolve any remaining type errors from weekly leaderboard feature"
```

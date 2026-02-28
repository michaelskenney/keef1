# Rolling Stones Quiz App — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first Rolling Stones trivia quiz SPA with four question types, speed-bonus scoring, and a shared Supabase leaderboard.

**Architecture:** Vite + React (TypeScript) SPA with five screens managed via React state. Questions live in a static `questions.json` file; scores are persisted to a single Supabase table via the JS client. No router — screen transitions are state changes.

**Tech Stack:** Vite, React 18, TypeScript, fuse.js (fuzzy matching), @supabase/supabase-js, Vitest + @testing-library/react, plain CSS with custom properties, Netlify.

---

## Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`

**Step 1: Scaffold with Vite**

```bash
cd /Users/msk/new-project
npm create vite@latest . -- --template react-ts
```

Expected: files created, prompts answered (select "Ignore files and continue" if asked).

**Step 2: Install core dependencies**

```bash
npm install @supabase/supabase-js fuse.js
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

**Step 3: Configure Vitest in `vite.config.ts`**

Replace the file contents:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

**Step 4: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom'
```

**Step 5: Add test script to `package.json`**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 6: Verify setup**

```bash
npm run build
```

Expected: build succeeds with no errors.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript project"
```

---

## Task 2: Define types and config

**Files:**
- Create: `src/types.ts`
- Create: `src/config.ts`

**Step 1: Create `src/types.ts`**

```ts
export type QuestionType = 'multiple_choice' | 'fill_blank' | 'free_text' | 'image'
export type Category = 'albums' | 'members' | 'lyrics' | 'trivia'

export interface BaseQuestion {
  id: string
  type: QuestionType
  category: Category
  question: string
  answer: string
  points: number
  fuzzy?: boolean
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice'
  options: string[]
}

export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill_blank'
}

export interface FreeTextQuestion extends BaseQuestion {
  type: 'free_text'
  fuzzy: boolean
}

export interface ImageQuestion extends BaseQuestion {
  type: 'image'
  image: string
  fuzzy: boolean
}

export type Question =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | FreeTextQuestion
  | ImageQuestion

export interface AnsweredQuestion {
  question: Question
  userAnswer: string
  correct: boolean
  pointsEarned: number
  timeRemaining: number
}

export interface LeaderboardEntry {
  id: string
  nickname: string
  score: number
  max_score: number
  questions: number
  correct: number
  played_at: string
}

export type Screen = 'home' | 'quiz' | 'feedback' | 'end' | 'leaderboard'
```

**Step 2: Create `src/config.ts`**

```ts
export const CONFIG = {
  questionsPerRound: 10,
  secondsPerQuestion: 30,
  basePoints: 10,
  maxSpeedBonus: 5,
  feedbackDurationMs: 1500,
  categoryWeights: {
    albums: 1,
    members: 1,
    lyrics: 2,
    trivia: 1,
  } as Record<string, number>,
}
```

**Step 3: Commit**

```bash
git add src/types.ts src/config.ts
git commit -m "feat: add TypeScript types and config"
```

---

## Task 3: Create sample questions data

**Files:**
- Create: `public/questions.json`

**Step 1: Create `public/questions.json`** with one question of each type plus extras:

```json
[
  {
    "id": "mc-001",
    "type": "multiple_choice",
    "category": "albums",
    "question": "In what year was 'Exile on Main St.' released?",
    "options": ["1969", "1972", "1974", "1978"],
    "answer": "1972",
    "points": 10
  },
  {
    "id": "mc-002",
    "type": "multiple_choice",
    "category": "members",
    "question": "Which guitarist replaced Brian Jones in the Rolling Stones?",
    "options": ["Ron Wood", "Mick Taylor", "Keith Richards", "Nicky Hopkins"],
    "answer": "Mick Taylor",
    "points": 10
  },
  {
    "id": "lb-001",
    "type": "fill_blank",
    "category": "lyrics",
    "question": "Complete the lyric: 'Please allow me to introduce myself, I'm a man of ___ and taste'",
    "answer": "wealth",
    "points": 10
  },
  {
    "id": "lb-002",
    "type": "fill_blank",
    "category": "lyrics",
    "question": "Complete the lyric: 'I can't get no ___'",
    "answer": "satisfaction",
    "points": 10
  },
  {
    "id": "ft-001",
    "type": "free_text",
    "category": "members",
    "question": "What is the name of the Rolling Stones' longtime touring keyboardist known as 'the sixth Stone'?",
    "answer": "Chuck Leavell",
    "fuzzy": true,
    "points": 10
  },
  {
    "id": "ft-002",
    "type": "free_text",
    "category": "trivia",
    "question": "On which London street did Mick Jagger and Keith Richards famously reconnect on a train platform in 1961?",
    "answer": "Dartford",
    "fuzzy": true,
    "points": 10
  },
  {
    "id": "mc-003",
    "type": "multiple_choice",
    "category": "albums",
    "question": "What was the Rolling Stones' first UK number one single?",
    "options": ["Paint It Black", "It's All Over Now", "The Last Time", "Satisfaction"],
    "answer": "It's All Over Now",
    "points": 10
  },
  {
    "id": "mc-004",
    "type": "multiple_choice",
    "category": "trivia",
    "question": "Which Rolling Stones album featured the song 'Wild Horses'?",
    "options": ["Sticky Fingers", "Let It Bleed", "Beggars Banquet", "Goats Head Soup"],
    "answer": "Sticky Fingers",
    "points": 10
  },
  {
    "id": "lb-003",
    "type": "fill_blank",
    "category": "lyrics",
    "question": "Complete the lyric: 'Hey! You! Get off of my ___'",
    "answer": "cloud",
    "points": 10
  },
  {
    "id": "ft-003",
    "type": "free_text",
    "category": "albums",
    "question": "Name the 1968 Rolling Stones album that marked their embrace of blues roots.",
    "answer": "Beggars Banquet",
    "fuzzy": true,
    "points": 10
  }
]
```

**Step 2: Commit**

```bash
git add public/questions.json
git commit -m "feat: add sample questions data"
```

---

## Task 4: Question selection logic

**Files:**
- Create: `src/lib/selectQuestions.ts`
- Create: `src/lib/selectQuestions.test.ts`

**Step 1: Write the failing test — `src/lib/selectQuestions.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { selectQuestions } from './selectQuestions'
import type { Question } from '../types'

const makeQ = (id: string, category: string): Question => ({
  id,
  type: 'multiple_choice',
  category: category as any,
  question: 'Q',
  options: ['A', 'B', 'C', 'D'],
  answer: 'A',
  points: 10,
})

const pool: Question[] = [
  makeQ('a1', 'albums'),
  makeQ('a2', 'albums'),
  makeQ('m1', 'members'),
  makeQ('l1', 'lyrics'),
  makeQ('l2', 'lyrics'),
  makeQ('l3', 'lyrics'),
  makeQ('t1', 'trivia'),
]

describe('selectQuestions', () => {
  it('returns the requested number of questions', () => {
    const result = selectQuestions(pool, 5, { albums: 1, members: 1, lyrics: 2, trivia: 1 })
    expect(result).toHaveLength(5)
  })

  it('returns no duplicates', () => {
    const result = selectQuestions(pool, 5, { albums: 1, members: 1, lyrics: 2, trivia: 1 })
    const ids = result.map(q => q.id)
    expect(new Set(ids).size).toBe(5)
  })

  it('returns all questions if pool is smaller than requested count', () => {
    const result = selectQuestions(pool, 20, { albums: 1, members: 1, lyrics: 2, trivia: 1 })
    expect(result).toHaveLength(pool.length)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- selectQuestions
```

Expected: FAIL — "Cannot find module './selectQuestions'"

**Step 3: Implement `src/lib/selectQuestions.ts`**

```ts
import type { Question } from '../types'

export function selectQuestions(
  pool: Question[],
  count: number,
  weights: Record<string, number>
): Question[] {
  // Build a weighted pool by repeating each question according to its category weight
  const weighted = pool.flatMap(q => Array(weights[q.category] ?? 1).fill(q) as Question[])

  const selected: Question[] = []
  const usedIds = new Set<string>()

  const shuffled = [...weighted].sort(() => Math.random() - 0.5)

  for (const q of shuffled) {
    if (!usedIds.has(q.id)) {
      selected.push(q)
      usedIds.add(q.id)
    }
    if (selected.length >= count) break
  }

  return selected
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- selectQuestions
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/lib/selectQuestions.ts src/lib/selectQuestions.test.ts
git commit -m "feat: add weighted question selection with tests"
```

---

## Task 5: Scoring logic

**Files:**
- Create: `src/lib/scoring.ts`
- Create: `src/lib/scoring.test.ts`

**Step 1: Write the failing test — `src/lib/scoring.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { calcScore } from './scoring'

describe('calcScore', () => {
  it('returns base + full bonus for instant answer', () => {
    expect(calcScore(true, 30, 30, 10, 5)).toBe(15)
  })

  it('returns base + partial bonus for mid-speed answer', () => {
    expect(calcScore(true, 15, 30, 10, 5)).toBe(12)
  })

  it('returns base points only for last-second answer', () => {
    expect(calcScore(true, 1, 30, 10, 5)).toBe(10)
  })

  it('returns 0 for wrong answer', () => {
    expect(calcScore(false, 25, 30, 10, 5)).toBe(0)
  })

  it('returns 0 when time expires', () => {
    expect(calcScore(true, 0, 30, 10, 5)).toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- scoring
```

Expected: FAIL

**Step 3: Implement `src/lib/scoring.ts`**

```ts
export function calcScore(
  correct: boolean,
  timeRemaining: number,
  totalTime: number,
  basePoints: number,
  maxBonus: number
): number {
  if (!correct || timeRemaining <= 0) return 0
  const bonus = Math.floor((timeRemaining / totalTime) * maxBonus)
  return basePoints + bonus
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- scoring
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/lib/scoring.ts src/lib/scoring.test.ts
git commit -m "feat: add scoring logic with speed bonus"
```

---

## Task 6: Fuzzy matching utility

**Files:**
- Create: `src/lib/fuzzyMatch.ts`
- Create: `src/lib/fuzzyMatch.test.ts`

**Step 1: Write the failing test — `src/lib/fuzzyMatch.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { fuzzyMatch } from './fuzzyMatch'

describe('fuzzyMatch', () => {
  it('matches exact answer', () => {
    expect(fuzzyMatch('Bill Wyman', 'Bill Wyman')).toBe(true)
  })

  it('matches with typo', () => {
    expect(fuzzyMatch('Bil Wiman', 'Bill Wyman')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(fuzzyMatch('bill wyman', 'Bill Wyman')).toBe(true)
  })

  it('rejects clearly wrong answer', () => {
    expect(fuzzyMatch('Mick Jagger', 'Bill Wyman')).toBe(false)
  })

  it('matches partial for single-word answers', () => {
    expect(fuzzyMatch('satisfacton', 'satisfaction')).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- fuzzyMatch
```

Expected: FAIL

**Step 3: Implement `src/lib/fuzzyMatch.ts`**

```ts
import Fuse from 'fuse.js'

export function fuzzyMatch(userAnswer: string, correctAnswer: string): boolean {
  const fuse = new Fuse([correctAnswer], {
    threshold: 0.4,
    includeScore: true,
    isCaseSensitive: false,
  })
  const results = fuse.search(userAnswer.trim())
  return results.length > 0 && (results[0].score ?? 1) < 0.4
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- fuzzyMatch
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/lib/fuzzyMatch.ts src/lib/fuzzyMatch.test.ts
git commit -m "feat: add fuzzy answer matching with fuse.js"
```

---

## Task 7: CSS design system

**Files:**
- Create: `src/index.css` (replace existing)
- Create: `src/components/` (directory)

**Step 1: Replace `src/index.css`**

```css
:root {
  --red: #E8001C;
  --black: #0a0a0a;
  --dark: #1a1a1a;
  --mid: #2a2a2a;
  --light: #f0f0f0;
  --muted: #888;
  --font-size-base: 18px;
  --font-size-lg: 22px;
  --font-size-xl: 28px;
  --font-size-xxl: 40px;
  --radius: 8px;
  --tap-min: 52px;
  --transition: 0.15s ease;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: var(--font-size-base);
  background: var(--black);
  color: var(--light);
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100dvh;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

#root {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

button {
  min-height: var(--tap-min);
  border: none;
  border-radius: var(--radius);
  font-size: var(--font-size-base);
  font-weight: 700;
  cursor: pointer;
  transition: opacity var(--transition), transform var(--transition);
  -webkit-tap-highlight-color: transparent;
}

button:active {
  opacity: 0.8;
  transform: scale(0.98);
}

input[type="text"] {
  font-size: 16px; /* prevent iOS auto-zoom */
  min-height: var(--tap-min);
  padding: 0 16px;
  background: var(--mid);
  border: 2px solid var(--mid);
  border-radius: var(--radius);
  color: var(--light);
  width: 100%;
  outline: none;
  transition: border-color var(--transition);
}

input[type="text"]:focus {
  border-color: var(--red);
}

.btn-primary {
  background: var(--red);
  color: white;
  width: 100%;
  padding: 0 24px;
}

.btn-secondary {
  background: var(--mid);
  color: var(--light);
  width: 100%;
  padding: 0 24px;
}

.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 20px;
  gap: 20px;
}

.app-title {
  font-size: var(--font-size-xxl);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
}

.app-title span {
  color: var(--red);
}
```

**Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add CSS design system with dark rock-poster theme"
```

---

## Task 8: Home screen

**Files:**
- Create: `src/components/HomeScreen.tsx`
- Create: `src/components/HomeScreen.test.tsx`

**Step 1: Write the failing test — `src/components/HomeScreen.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from './HomeScreen'

describe('HomeScreen', () => {
  it('renders title and input', () => {
    render(<HomeScreen onStart={vi.fn()} onLeaderboard={vi.fn()} />)
    expect(screen.getByText(/rolling stones/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/nickname/i)).toBeInTheDocument()
  })

  it('calls onStart with trimmed nickname', async () => {
    const onStart = vi.fn()
    render(<HomeScreen onStart={onStart} onLeaderboard={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText(/nickname/i), '  Keef  ')
    await userEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(onStart).toHaveBeenCalledWith('Keef')
  })

  it('does not call onStart with empty nickname', async () => {
    const onStart = vi.fn()
    render(<HomeScreen onStart={onStart} onLeaderboard={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(onStart).not.toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- HomeScreen
```

Expected: FAIL

**Step 3: Implement `src/components/HomeScreen.tsx`**

```tsx
import { useState } from 'react'

interface Props {
  onStart: (nickname: string) => void
  onLeaderboard: () => void
}

export function HomeScreen({ onStart, onLeaderboard }: Props) {
  const [nickname, setNickname] = useState('')

  function handlePlay() {
    const trimmed = nickname.trim()
    if (!trimmed) return
    onStart(trimmed)
  }

  return (
    <div className="screen" style={{ justifyContent: 'center', gap: 32 }}>
      <div>
        <h1 className="app-title">THE<br /><span>ROLLING</span><br />STONES<br />QUIZ</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Your nickname"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePlay()}
          maxLength={30}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
        />
        <button className="btn-primary" onClick={handlePlay}>
          Play
        </button>
        <button className="btn-secondary" onClick={onLeaderboard}>
          Leaderboard
        </button>
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- HomeScreen
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/components/HomeScreen.tsx src/components/HomeScreen.test.tsx
git commit -m "feat: add Home screen component"
```

---

## Task 9: Timer component

**Files:**
- Create: `src/components/TimerBar.tsx`
- Create: `src/components/TimerBar.test.tsx`

**Step 1: Write the failing test — `src/components/TimerBar.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimerBar } from './TimerBar'

describe('TimerBar', () => {
  it('renders at full width when time is full', () => {
    render(<TimerBar timeRemaining={30} totalTime={30} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '30')
    expect(bar).toHaveAttribute('aria-valuemax', '30')
  })

  it('renders at half width when half time remains', () => {
    render(<TimerBar timeRemaining={15} totalTime={30} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '15')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- TimerBar
```

Expected: FAIL

**Step 3: Implement `src/components/TimerBar.tsx`**

```tsx
interface Props {
  timeRemaining: number
  totalTime: number
}

export function TimerBar({ timeRemaining, totalTime }: Props) {
  const pct = (timeRemaining / totalTime) * 100
  const color = pct > 50 ? 'var(--red)' : pct > 25 ? '#ff8800' : '#ff2200'

  return (
    <div style={{ background: 'var(--mid)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div
        role="progressbar"
        aria-valuenow={timeRemaining}
        aria-valuemin={0}
        aria-valuemax={totalTime}
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          transition: 'width 0.25s linear, background 0.5s ease',
        }}
      />
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- TimerBar
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/TimerBar.tsx src/components/TimerBar.test.tsx
git commit -m "feat: add TimerBar component"
```

---

## Task 10: Question components

**Files:**
- Create: `src/components/QuestionCard.tsx`
- Create: `src/components/QuestionCard.test.tsx`

**Step 1: Write the failing test — `src/components/QuestionCard.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionCard } from './QuestionCard'
import type { Question } from '../types'

const mcQuestion: Question = {
  id: 'mc-1',
  type: 'multiple_choice',
  category: 'albums',
  question: 'What year was Exile on Main St. released?',
  options: ['1969', '1972', '1974', '1978'],
  answer: '1972',
  points: 10,
}

const ftQuestion: Question = {
  id: 'ft-1',
  type: 'free_text',
  category: 'members',
  question: 'Who played keyboards?',
  answer: 'Chuck Leavell',
  fuzzy: true,
  points: 10,
}

describe('QuestionCard', () => {
  it('renders multiple choice options as buttons', () => {
    render(<QuestionCard question={mcQuestion} onAnswer={vi.fn()} disabled={false} />)
    expect(screen.getByText('1972')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('calls onAnswer when option clicked', async () => {
    const onAnswer = vi.fn()
    render(<QuestionCard question={mcQuestion} onAnswer={onAnswer} disabled={false} />)
    await userEvent.click(screen.getByText('1972'))
    expect(onAnswer).toHaveBeenCalledWith('1972')
  })

  it('renders free text with input', () => {
    render(<QuestionCard question={ftQuestion} onAnswer={vi.fn()} disabled={false} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('calls onAnswer on free text submit', async () => {
    const onAnswer = vi.fn()
    render(<QuestionCard question={ftQuestion} onAnswer={onAnswer} disabled={false} />)
    await userEvent.type(screen.getByRole('textbox'), 'Chuck Leavell')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(onAnswer).toHaveBeenCalledWith('Chuck Leavell')
  })

  it('disables inputs when disabled=true', () => {
    render(<QuestionCard question={mcQuestion} onAnswer={vi.fn()} disabled={true} />)
    screen.getAllByRole('button').forEach(btn => expect(btn).toBeDisabled())
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- QuestionCard
```

Expected: FAIL

**Step 3: Implement `src/components/QuestionCard.tsx`**

```tsx
import { useState } from 'react'
import type { Question } from '../types'

interface Props {
  question: Question
  onAnswer: (answer: string) => void
  disabled: boolean
}

export function QuestionCard({ question, onAnswer, disabled }: Props) {
  const [textInput, setTextInput] = useState('')

  function handleTextSubmit() {
    if (!textInput.trim()) return
    onAnswer(textInput.trim())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {question.type === 'image' && (
        <img
          src={question.image}
          alt="Question"
          style={{ width: '100%', borderRadius: 8, maxHeight: 240, objectFit: 'cover' }}
        />
      )}

      <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, lineHeight: 1.4 }}>
        {question.question}
      </p>

      {question.type === 'multiple_choice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {question.options.map(opt => (
            <button
              key={opt}
              className="btn-secondary"
              onClick={() => onAnswer(opt)}
              disabled={disabled}
              style={{ textAlign: 'left', padding: '0 16px' }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {(question.type === 'fill_blank' || question.type === 'free_text' || question.type === 'image') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !disabled && handleTextSubmit()}
            disabled={disabled}
            autoComplete="off"
            autoCorrect="off"
            placeholder="Your answer"
          />
          <button
            className="btn-primary"
            onClick={handleTextSubmit}
            disabled={disabled || !textInput.trim()}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- QuestionCard
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/components/QuestionCard.tsx src/components/QuestionCard.test.tsx
git commit -m "feat: add QuestionCard component supporting all four question types"
```

---

## Task 11: Quiz engine (state + logic)

**Files:**
- Create: `src/lib/quizEngine.ts`
- Create: `src/lib/quizEngine.test.ts`

**Step 1: Write the failing test — `src/lib/quizEngine.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { checkAnswer } from './quizEngine'
import type { Question } from '../types'

const mcQ: Question = {
  id: '1', type: 'multiple_choice', category: 'albums',
  question: 'Q', options: ['A', 'B', 'C', 'D'], answer: 'B', points: 10,
}
const ftQ: Question = {
  id: '2', type: 'free_text', category: 'members',
  question: 'Q', answer: 'Bill Wyman', fuzzy: true, points: 10,
}

describe('checkAnswer', () => {
  it('exact match is correct for multiple choice', () => {
    expect(checkAnswer(mcQ, 'B')).toBe(true)
  })

  it('wrong option is incorrect', () => {
    expect(checkAnswer(mcQ, 'A')).toBe(false)
  })

  it('fuzzy match accepts close spelling', () => {
    expect(checkAnswer(ftQ, 'bil wiman')).toBe(true)
  })

  it('fuzzy match rejects wrong answer', () => {
    expect(checkAnswer(ftQ, 'Mick Jagger')).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- quizEngine
```

Expected: FAIL

**Step 3: Implement `src/lib/quizEngine.ts`**

```ts
import type { Question } from '../types'
import { fuzzyMatch } from './fuzzyMatch'

export function checkAnswer(question: Question, userAnswer: string): boolean {
  const correct = question.answer
  if (question.fuzzy) {
    return fuzzyMatch(userAnswer, correct)
  }
  return userAnswer.trim().toLowerCase() === correct.trim().toLowerCase()
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- quizEngine
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/lib/quizEngine.ts src/lib/quizEngine.test.ts
git commit -m "feat: add quiz answer checking logic"
```

---

## Task 12: Quiz screen

**Files:**
- Create: `src/components/QuizScreen.tsx`

This component is stateful with a timer — test it manually in the browser.

**Step 1: Create `src/components/QuizScreen.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import type { Question, AnsweredQuestion } from '../types'
import { CONFIG } from '../config'
import { checkAnswer } from '../lib/quizEngine'
import { calcScore } from '../lib/scoring'
import { TimerBar } from './TimerBar'
import { QuestionCard } from './QuestionCard'

interface Props {
  questions: Question[]
  onComplete: (results: AnsweredQuestion[]) => void
}

export function QuizScreen({ questions, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(CONFIG.secondsPerQuestion)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<AnsweredQuestion[]>([])
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number } | null>(null)

  const currentQuestion = questions[index]
  const totalScore = results.reduce((sum, r) => sum + r.pointsEarned, 0)

  const handleAnswer = useCallback((userAnswer: string) => {
    if (answered) return
    setAnswered(true)

    const correct = checkAnswer(currentQuestion, userAnswer)
    const points = calcScore(
      correct,
      timeRemaining,
      CONFIG.secondsPerQuestion,
      CONFIG.basePoints,
      CONFIG.maxSpeedBonus
    )

    const result: AnsweredQuestion = {
      question: currentQuestion,
      userAnswer,
      correct,
      pointsEarned: points,
      timeRemaining,
    }

    setLastResult({ correct, points })

    setTimeout(() => {
      const newResults = [...results, result]
      if (index + 1 >= questions.length) {
        onComplete(newResults)
      } else {
        setResults(newResults)
        setIndex(i => i + 1)
        setTimeRemaining(CONFIG.secondsPerQuestion)
        setAnswered(false)
        setLastResult(null)
      }
    }, CONFIG.feedbackDurationMs)
  }, [answered, currentQuestion, timeRemaining, results, index, questions.length, onComplete])

  // Timer
  useEffect(() => {
    if (answered) return
    if (timeRemaining <= 0) {
      handleAnswer('')
      return
    }
    const id = setTimeout(() => setTimeRemaining(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timeRemaining, answered, handleAnswer])

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {index + 1} / {questions.length}
        </span>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--red)' }}>
          {totalScore} pts
        </span>
      </div>

      <TimerBar timeRemaining={timeRemaining} totalTime={CONFIG.secondsPerQuestion} />

      <QuestionCard question={currentQuestion} onAnswer={handleAnswer} disabled={answered} />

      {lastResult && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', zIndex: 10,
        }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 64 }}>{lastResult.correct ? '✓' : '✗'}</div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginTop: 8 }}>
              {lastResult.correct ? `+${lastResult.points} pts` : `Correct: ${currentQuestion.answer}`}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/QuizScreen.tsx
git commit -m "feat: add Quiz screen with timer and feedback overlay"
```

---

## Task 13: End screen

**Files:**
- Create: `src/components/EndScreen.tsx`
- Create: `src/components/EndScreen.test.tsx`

**Step 1: Write the failing test — `src/components/EndScreen.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EndScreen } from './EndScreen'
import type { AnsweredQuestion, Question } from '../types'

const makeResult = (correct: boolean, points: number): AnsweredQuestion => ({
  question: { id: '1', type: 'multiple_choice', category: 'albums', question: 'Q', options: [], answer: 'A', points: 10 } as unknown as Question,
  userAnswer: correct ? 'A' : 'B',
  correct,
  pointsEarned: points,
  timeRemaining: 20,
})

describe('EndScreen', () => {
  it('shows total score', () => {
    const results = [makeResult(true, 13), makeResult(false, 0), makeResult(true, 10)]
    render(<EndScreen results={results} nickname="Keef" onSubmit={vi.fn()} onPlayAgain={vi.fn()} />)
    expect(screen.getByText('23')).toBeInTheDocument()
  })

  it('shows correct count', () => {
    const results = [makeResult(true, 13), makeResult(false, 0)]
    render(<EndScreen results={results} nickname="Keef" onSubmit={vi.fn()} onPlayAgain={vi.fn()} />)
    expect(screen.getByText(/1.*2/)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- EndScreen
```

Expected: FAIL

**Step 3: Implement `src/components/EndScreen.tsx`**

```tsx
import type { AnsweredQuestion } from '../types'
import { CONFIG } from '../config'

interface Props {
  results: AnsweredQuestion[]
  nickname: string
  onSubmit: () => void
  onPlayAgain: () => void
}

export function EndScreen({ results, nickname, onSubmit, onPlayAgain }: Props) {
  const totalScore = results.reduce((s, r) => s + r.pointsEarned, 0)
  const maxScore = results.length * (CONFIG.basePoints + CONFIG.maxSpeedBonus)
  const correctCount = results.filter(r => r.correct).length

  return (
    <div className="screen">
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900 }}>
        Nice work, {nickname}!
      </h2>

      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: 'var(--red)', lineHeight: 1 }}>
          {totalScore}
        </div>
        <div style={{ color: 'var(--muted)', marginTop: 4 }}>out of {maxScore} pts</div>
        <div style={{ marginTop: 8 }}>{correctCount} / {results.length} correct</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <button className="btn-primary" onClick={onSubmit}>
          Submit to Leaderboard
        </button>
        <button className="btn-secondary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 10, color: 'var(--muted)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
          Breakdown
        </h3>
        {results.map((r, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid var(--mid)',
            fontSize: 14,
          }}>
            <div style={{ flex: 1, marginRight: 12, color: r.correct ? 'var(--light)' : 'var(--muted)' }}>
              {r.question.question.length > 50
                ? r.question.question.slice(0, 50) + '…'
                : r.question.question}
            </div>
            <div style={{ color: r.correct ? 'var(--red)' : 'var(--muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {r.correct ? `+${r.pointsEarned}` : '✗'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- EndScreen
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/EndScreen.tsx src/components/EndScreen.test.tsx
git commit -m "feat: add End screen with score breakdown"
```

---

## Task 14: Supabase setup

**Files:**
- Create: `.env.local` (not committed)
- Create: `src/lib/supabase.ts`
- Create: `.env.example`

**Step 1: Create a Supabase project**

1. Go to https://supabase.com and create a free project.
2. In the Supabase dashboard, open the SQL Editor and run:

```sql
create table leaderboard (
  id uuid default gen_random_uuid() primary key,
  nickname text not null,
  score integer not null,
  max_score integer not null,
  questions integer not null,
  correct integer not null,
  played_at timestamptz default now() not null
);

-- Allow anonymous inserts and reads (no auth needed)
alter table leaderboard enable row level security;

create policy "Anyone can insert" on leaderboard
  for insert with check (true);

create policy "Anyone can select" on leaderboard
  for select using (true);
```

3. Copy your Project URL and `anon` public key from Settings > API.

**Step 2: Create `.env.local`** (do not commit this file)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Step 3: Create `.env.example`**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

**Step 4: Create `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 5: Add `.env.local` to `.gitignore`**

```bash
echo ".env.local" >> .gitignore
```

**Step 6: Commit**

```bash
git add .env.example .gitignore src/lib/supabase.ts
git commit -m "feat: add Supabase client setup"
```

---

## Task 15: Leaderboard service

**Files:**
- Create: `src/lib/leaderboard.ts`

(Integration tests against Supabase require a live connection — test manually via browser.)

**Step 1: Create `src/lib/leaderboard.ts`**

```ts
import { supabase } from './supabase'
import type { LeaderboardEntry } from '../types'

export async function submitScore(entry: Omit<LeaderboardEntry, 'id' | 'played_at'>): Promise<void> {
  const { error } = await supabase.from('leaderboard').insert(entry)
  if (error) throw new Error(error.message)
}

export async function fetchLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data as LeaderboardEntry[]
}
```

**Step 2: Commit**

```bash
git add src/lib/leaderboard.ts
git commit -m "feat: add leaderboard service (submit + fetch)"
```

---

## Task 16: Leaderboard screen

**Files:**
- Create: `src/components/LeaderboardScreen.tsx`
- Create: `src/components/LeaderboardScreen.test.tsx`

**Step 1: Write the failing test — `src/components/LeaderboardScreen.test.tsx`**

```tsx
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
    render(<LeaderboardScreen entries={entries} currentNickname={null} loading={false} onPlayAgain={vi.fn()} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Keef')
    expect(items[1]).toHaveTextContent('Mick')
  })

  it('highlights current player', () => {
    render(<LeaderboardScreen entries={entries} currentNickname="Keef" loading={false} onPlayAgain={vi.fn()} />)
    expect(screen.getByText('Keef').closest('li')).toHaveStyle({ borderColor: 'var(--red)' })
  })

  it('shows loading state', () => {
    render(<LeaderboardScreen entries={[]} currentNickname={null} loading={true} onPlayAgain={vi.fn()} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- LeaderboardScreen
```

Expected: FAIL

**Step 3: Implement `src/components/LeaderboardScreen.tsx`**

```tsx
import type { LeaderboardEntry } from '../types'

interface Props {
  entries: LeaderboardEntry[]
  currentNickname: string | null
  loading: boolean
  onPlayAgain: () => void
}

export function LeaderboardScreen({ entries, currentNickname, loading, onPlayAgain }: Props) {
  return (
    <div className="screen">
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900 }}>Leaderboard</h2>

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

**Step 4: Run test to verify it passes**

```bash
npm test -- LeaderboardScreen
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/components/LeaderboardScreen.tsx src/components/LeaderboardScreen.test.tsx
git commit -m "feat: add Leaderboard screen component"
```

---

## Task 17: Wire everything together in App.tsx

**Files:**
- Modify: `src/App.tsx` (replace entirely)
- Delete: `src/App.css`

**Step 1: Replace `src/App.tsx`**

```tsx
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
    const entries = await fetchLeaderboard()
    setLeaderboard(entries)
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
          onPlayAgain={playAgain}
        />
      )}
    </>
  )
}
```

**Step 2: Delete `src/App.css`**

```bash
rm /Users/msk/new-project/src/App.css
```

**Step 3: Remove App.css import from `src/main.tsx`** if present (check and remove `import './App.css'`)

**Step 4: Run all tests**

```bash
npm test
```

Expected: all tests pass

**Step 5: Start dev server and manually verify on iPhone (or iPhone simulator)**

```bash
npm run dev
```

Open the local URL on your iPhone or use Safari's Responsive Design Mode (Develop > Enter Responsive Design Mode, select iPhone).

Verify:
- Home screen renders, nickname input works
- Quiz starts, timer counts down, questions display
- Multiple choice tapping works
- Free text input doesn't cause zoom on iPhone (font ≥ 16px)
- Feedback overlay appears and auto-advances
- End screen shows score
- Leaderboard submits (requires Supabase `.env.local` to be set)

**Step 6: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: wire all screens together in App"
```

---

## Task 18: Netlify deployment

**Files:**
- Create: `netlify.toml`

**Step 1: Create `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Step 2: Deploy to Netlify**

```bash
npx netlify-cli deploy --prod
```

Or connect the GitHub repo to Netlify via the Netlify dashboard (recommended):
1. Push repo to GitHub: `git remote add origin <your-github-url> && git push -u origin main`
2. Go to https://app.netlify.com > "Add new site" > "Import from Git"
3. Select your repo
4. Set environment variables in Netlify dashboard: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. Deploy

**Step 3: Commit**

```bash
git add netlify.toml
git commit -m "feat: add Netlify deployment config"
```

---

## Final verification checklist

- [ ] `npm test` — all tests pass
- [ ] `npm run build` — build succeeds, no TypeScript errors
- [ ] Home screen: nickname required, enter key works
- [ ] Quiz: all 4 question types render correctly
- [ ] Timer counts down and auto-submits on expiry
- [ ] Speed bonus calculated correctly
- [ ] Fuzzy matching accepts typos, rejects wrong answers
- [ ] End screen shows correct totals
- [ ] Score submits to Supabase leaderboard
- [ ] Leaderboard fetches and highlights current player
- [ ] No iOS Safari zoom on input focus
- [ ] Safe area insets respected on notched iPhone
- [ ] Tap targets are large enough (≥ 44px)

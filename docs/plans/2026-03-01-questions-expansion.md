# Questions Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand `public/questions.json` from 75 to 250 questions, add image question rendering, add answer-dedup to round selection, and re-enable lyrics.

**Architecture:** Three code changes (selectQuestions dedup, QuestionCard image rendering, config lyrics weight), then five content-generation tasks appending new questions to `public/questions.json`. Code tasks use TDD. Content tasks use a fetch → generate → validate → commit pattern.

**Tech Stack:** TypeScript, React, Vitest + Testing Library, Python 3 (JSON validation), Wikimedia Commons (image URLs)

---

### Task 1: Add answer dedup + image pool to `selectQuestions.ts`

**Files:**
- Modify: `src/lib/selectQuestions.ts`
- Modify: `src/lib/selectQuestions.test.ts`

**Background:** `pickUnique` currently deduplicates by question ID only. We need it to also skip questions whose answer (normalized: lowercased + trimmed) has already been used in the round. The MC pool must also include `image` type questions. All existing tests use `answer: 'A'` for every question — once dedup is added, these all collide. Fix by changing the helpers to use `id` as the answer.

**Step 1: Write the failing tests**

Replace the full contents of `src/lib/selectQuestions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { selectQuestions } from './selectQuestions'
import type { Question } from '../types'

const makeMC = (id: string, category: string): Question => ({
  id,
  type: 'multiple_choice',
  category: category as any,
  question: 'Q',
  options: ['A', 'B', 'C', 'D'],
  answer: id,   // unique per question — prevents dedup collisions in existing tests
  points: 10,
})

const makeFB = (id: string, category: string): Question => ({
  id,
  type: 'fill_blank',
  category: category as any,
  question: 'Fill in ___',
  answer: id,   // unique per question
  points: 10,
})

const makeImage = (id: string, category: string): Question => ({
  id,
  type: 'image',
  category: category as any,
  question: 'Who is this?',
  image: 'https://example.com/img.jpg',
  options: ['A', 'B', 'C', 'D'],
  answer: id,
  points: 10,
})

const pool: Question[] = [
  makeMC('a1', 'albums'),
  makeMC('a2', 'albums'),
  makeMC('m1', 'members'),
  makeMC('m2', 'members'),
  makeMC('t1', 'trivia'),
  makeMC('t2', 'trivia'),
  makeFB('fb1', 'albums'),
  makeFB('fb2', 'members'),
  makeFB('fb3', 'trivia'),
]

const weights = { albums: 1, members: 1, trivia: 1, lyrics: 1 }

describe('selectQuestions', () => {
  it('returns the requested number of questions', () => {
    const result = selectQuestions(pool, 7, weights)
    expect(result).toHaveLength(7)
  })

  it('returns no duplicate IDs', () => {
    const result = selectQuestions(pool, 7, weights)
    const ids = result.map(q => q.id)
    expect(new Set(ids).size).toBe(7)
  })

  it('last question is always fill_blank', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectQuestions(pool, 7, weights)
      expect(result[result.length - 1].type).toBe('fill_blank')
    }
  })

  it('all questions except the last are multiple_choice or image', () => {
    const result = selectQuestions(pool, 7, weights)
    result.slice(0, -1).forEach(q => {
      expect(['multiple_choice', 'image']).toContain(q.type)
    })
  })

  it('returns all available questions if pool is smaller than requested count', () => {
    const small: Question[] = [
      makeMC('x1', 'albums'),
      makeMC('x2', 'albums'),
      makeFB('xf1', 'albums'),
    ]
    const result = selectQuestions(small, 7, weights)
    expect(result.length).toBeLessThanOrEqual(small.length)
  })

  it('never selects two questions with the same normalized answer in one round', () => {
    const dedupPool: Question[] = [
      // mc-dup-1 and mc-dup-2 both answer "Mick Taylor"
      { id: 'mc-dup-1', type: 'multiple_choice', category: 'members' as any, question: 'Q1', options: ['A','B','C','D'], answer: 'Mick Taylor', points: 10 },
      { id: 'mc-dup-2', type: 'multiple_choice', category: 'members' as any, question: 'Q2', options: ['A','B','C','D'], answer: 'mick taylor', points: 10 },
      { id: 'mc-3', type: 'multiple_choice', category: 'members' as any, question: 'Q3', options: ['A','B','C','D'], answer: 'Keith Richards', points: 10 },
      { id: 'mc-4', type: 'multiple_choice', category: 'members' as any, question: 'Q4', options: ['A','B','C','D'], answer: 'Charlie Watts', points: 10 },
      { id: 'mc-5', type: 'multiple_choice', category: 'members' as any, question: 'Q5', options: ['A','B','C','D'], answer: 'Ronnie Wood', points: 10 },
      { id: 'mc-6', type: 'multiple_choice', category: 'members' as any, question: 'Q6', options: ['A','B','C','D'], answer: 'Bill Wyman', points: 10 },
      // fb-dup also answers "Mick Taylor" — should not appear if mc-dup-1 was picked
      { id: 'fb-dup', type: 'fill_blank', category: 'members' as any, question: 'Q?', answer: 'Mick Taylor', points: 10 },
      { id: 'fb-2', type: 'fill_blank', category: 'members' as any, question: 'Q?', answer: 'Brian Jones', points: 10 },
    ]
    for (let i = 0; i < 30; i++) {
      const result = selectQuestions(dedupPool, 7, { members: 1 })
      const answers = result.map(q => q.answer.toLowerCase().trim())
      expect(new Set(answers).size).toBe(answers.length)
    }
  })

  it('includes image questions in the MC slots', () => {
    const poolWithImage: Question[] = [
      ...Array.from({ length: 5 }, (_, i) => makeMC(`mc-${i}`, 'albums')),
      makeImage('img-1', 'members'),
      makeFB('fb-1', 'albums'),
      makeFB('fb-2', 'members'),
    ]
    const results = Array.from({ length: 20 }, () =>
      selectQuestions(poolWithImage, 7, { albums: 1, members: 1 })
    )
    const anyImage = results.some(r => r.some(q => q.type === 'image'))
    expect(anyImage).toBe(true)
  })
})
```

**Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/selectQuestions.test.ts
```

Expected: several failures — dedup test fails, image test fails, and the "all questions except last are MC or image" test may fail.

**Step 3: Update `src/lib/selectQuestions.ts`**

```typescript
import type { Question } from '../types'

function pickUnique(
  pool: Question[],
  n: number,
  weights: Record<string, number>,
  usedIds: Set<string>,
  usedAnswers: Set<string>
): Question[] {
  const weighted = pool.flatMap(q =>
    Array(weights[q.category] ?? 1).fill(q) as Question[]
  )
  const shuffled = [...weighted].sort(() => Math.random() - 0.5)
  const result: Question[] = []
  for (const q of shuffled) {
    const normAnswer = q.answer.toLowerCase().trim()
    if (!usedIds.has(q.id) && !usedAnswers.has(normAnswer)) {
      result.push(q)
      usedIds.add(q.id)
      usedAnswers.add(normAnswer)
    }
    if (result.length >= n) break
  }
  return result
}

export function selectQuestions(
  pool: Question[],
  count: number,
  weights: Record<string, number>
): Question[] {
  const mcPool = pool.filter(q => q.type === 'multiple_choice' || q.type === 'image')
  const fbPool = pool.filter(q => q.type === 'fill_blank')

  const usedIds = new Set<string>()
  const usedAnswers = new Set<string>()
  const mcQuestions = pickUnique(mcPool, count - 1, weights, usedIds, usedAnswers)
  const fbQuestion = pickUnique(fbPool, 1, weights, usedIds, usedAnswers)

  return [...mcQuestions, ...fbQuestion]
}
```

**Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/selectQuestions.test.ts
```

Expected: 8 tests pass.

**Step 5: Commit**

```bash
git add src/lib/selectQuestions.ts src/lib/selectQuestions.test.ts
git commit -m "feat: add answer dedup and image pool to selectQuestions"
```

---

### Task 2: Update `ImageQuestion` type and `QuestionCard` image rendering

**Files:**
- Modify: `src/types.ts`
- Modify: `src/components/QuestionCard.tsx`
- Modify: `src/components/QuestionCard.test.tsx`

**Background:** `ImageQuestion` currently has `fuzzy: boolean` but no `options`. Image questions are always multiple-choice (options to choose from), so they need `options: string[]`. The `QuestionCard` currently renders image questions with a text input — change it to render MC buttons (like `multiple_choice`) while still showing the image above.

**Step 1: Write the failing test**

Add this to `src/components/QuestionCard.test.tsx` (after the existing `ftQuestion` fixture and inside the describe block):

```typescript
const imageQuestion: Question = {
  id: 'img-1',
  type: 'image',
  category: 'members',
  question: 'Who is pictured?',
  image: 'https://upload.wikimedia.org/wikipedia/commons/test/img.jpg',
  options: ['Mick Jagger', 'Keith Richards', 'Ronnie Wood', 'Charlie Watts'],
  answer: 'Keith Richards',
  points: 10,
}
```

Add these tests inside the `describe('QuestionCard', ...)` block:

```typescript
  it('renders image and MC buttons for image type questions', () => {
    render(<QuestionCard question={imageQuestion} onAnswer={vi.fn()} disabled={false} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', imageQuestion.image)
    expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.getByText('Keith Richards')).toBeInTheDocument()
  })

  it('does not show text input for image type questions', () => {
    render(<QuestionCard question={imageQuestion} onAnswer={vi.fn()} disabled={false} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
```

**Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/QuestionCard.test.tsx
```

Expected: TypeScript error on `imageQuestion` (no `options` on `ImageQuestion`) and test failures.

**Step 3: Update `src/types.ts` — fix `ImageQuestion`**

Change the `ImageQuestion` interface from:

```typescript
export interface ImageQuestion extends BaseQuestion {
  type: 'image'
  image: string
  fuzzy: boolean
}
```

To:

```typescript
export interface ImageQuestion extends BaseQuestion {
  type: 'image'
  image: string
  options: string[]
}
```

**Step 4: Update `src/components/QuestionCard.tsx`**

Change the MC buttons condition (line 32) from:

```typescript
      {question.type === 'multiple_choice' && (
```

To:

```typescript
      {(question.type === 'multiple_choice' || question.type === 'image') && (
```

Change the text input condition (line 48) from:

```typescript
      {(question.type === 'fill_blank' || question.type === 'free_text' || question.type === 'image') && (
```

To:

```typescript
      {(question.type === 'fill_blank' || question.type === 'free_text') && (
```

**Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/components/QuestionCard.test.tsx
```

Expected: 7 tests pass.

**Step 6: Run full suite to check nothing regressed**

```bash
npm test
```

Expected: all tests pass.

**Step 7: Commit**

```bash
git add src/types.ts src/components/QuestionCard.tsx src/components/QuestionCard.test.tsx
git commit -m "feat: image questions render with MC buttons"
```

---

### Task 3: Re-enable lyrics in config

**Files:**
- Modify: `src/config.ts`

**Step 1: Update `src/config.ts`**

Change `lyrics: 0` to `lyrics: 1`:

```typescript
export const CONFIG = {
  questionsPerRound: 7,
  secondsPerQuestion: 30,
  basePoints: 10,
  maxSpeedBonus: 5,
  feedbackDurationMs: 1500,
  categoryWeights: {
    albums: 1,
    members: 1,
    lyrics: 1,
    trivia: 1,
  } as Record<string, number>,
}
```

**Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add src/config.ts
git commit -m "feat: re-enable lyrics category in round selection"
```

---

### Task 4: Generate albums expansion batch (+32 questions)

**Files:**
- Modify: `public/questions.json`

**Background:** Current albums questions: 12 MC (`mc-alb-001`–`mc-alb-012`), 8 FB (`fb-alb-001`–`fb-alb-008`), 5 FT (`ft-alb-001`–`ft-alb-005`). Need 32 more to reach 57. Avoid duplicating any existing question topics.

**ID ranges for new questions:**
- MC: `mc-alb-013` through `mc-alb-027` (15 questions)
- FB: `fb-alb-009` through `fb-alb-019` (11 questions)
- FT: `ft-alb-006` through `ft-alb-011` (6 questions)

**Step 1: Fetch source material**

Fetch and read these pages before generating questions:
- https://en.wikipedia.org/wiki/The_Rolling_Stones_discography
- https://en.wikipedia.org/wiki/Exile_on_Main_St.
- https://en.wikipedia.org/wiki/Sticky_Fingers
- https://en.wikipedia.org/wiki/Let_It_Bleed
- https://en.wikipedia.org/wiki/Beggars_Banquet
- https://en.wikipedia.org/wiki/Some_Girls_(album)
- https://en.wikipedia.org/wiki/Tattoo_You

**Step 2: Generate 32 questions as a JSON array**

Use the schema:
```json
{
  "id": "mc-alb-013",
  "type": "multiple_choice",
  "category": "albums",
  "difficulty": "medium",
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "answer": "...",
  "points": 10
}
```

For `fill_blank`:
```json
{
  "id": "fb-alb-009",
  "type": "fill_blank",
  "category": "albums",
  "difficulty": "medium",
  "question": "The Rolling Stones album ___ was recorded in a mobile studio at a French villa.",
  "answer": "Exile on Main St.",
  "points": 10
}
```

For `free_text`:
```json
{
  "id": "ft-alb-006",
  "type": "free_text",
  "category": "albums",
  "difficulty": "hard",
  "question": "...",
  "answer": "...",
  "fuzzy": true,
  "points": 10
}
```

Cover topics across the full discography — B-sides, chart positions, recording locations, producers, guest musicians, cover art, release years, chart performance in UK vs US.

**Step 3: Append to `public/questions.json`**

Read the current file, append the 32 new questions to the JSON array, and write it back. Maintain the existing array structure.

**Step 4: Validate**

```bash
python3 -c "
import json
with open('public/questions.json') as f:
    data = json.load(f)
albums = [q for q in data if q['category'] == 'albums']
print(f'Albums: {len(albums)} (expected 57)')
ids = [q['id'] for q in data]
assert len(ids) == len(set(ids)), 'DUPLICATE IDs!'
print(f'Total: {len(data)}, no duplicate IDs')
"
```

Expected: `Albums: 57`, `Total: 107`

**Step 5: Run tests**

```bash
npm test
```

Expected: all tests pass.

**Step 6: Commit**

```bash
git add public/questions.json
git commit -m "content: add albums expansion batch (+32 questions, total 57)"
```

---

### Task 5: Generate members expansion batch (+31 questions)

**Files:**
- Modify: `public/questions.json`

**ID ranges:**
- MC: `mc-mem-013` through `mc-mem-027` (15 questions)
- FB: `fb-mem-009` through `fb-mem-018` (10 questions)
- FT: `ft-mem-006` through `ft-mem-011` (6 questions)

**Step 1: Fetch source material**

- https://en.wikipedia.org/wiki/Mick_Jagger
- https://en.wikipedia.org/wiki/Keith_Richards
- https://en.wikipedia.org/wiki/Ronnie_Wood
- https://en.wikipedia.org/wiki/Charlie_Watts
- https://en.wikipedia.org/wiki/Bill_Wyman
- https://en.wikipedia.org/wiki/Brian_Jones
- https://en.wikipedia.org/wiki/Mick_Taylor

**Step 2: Generate 31 questions** following the same schema as Task 4. Cover: birth dates/places, instruments, side projects, marriages, non-Stones work, joining/leaving dates, musical influences, personal history.

**Step 3: Append, validate, and commit**

```bash
python3 -c "
import json
with open('public/questions.json') as f:
    data = json.load(f)
members = [q for q in data if q['category'] == 'members']
print(f'Members: {len(members)} (expected 56)')
ids = [q['id'] for q in data]
assert len(ids) == len(set(ids)), 'DUPLICATE IDs!'
print(f'Total: {len(data)}, no duplicate IDs')
"
```

Expected: `Members: 56`, `Total: 138`

```bash
npm test
git add public/questions.json
git commit -m "content: add members expansion batch (+31 questions, total 56)"
```

---

### Task 6: Generate lyrics batch (+56 questions, all fill_blank)

**Files:**
- Modify: `public/questions.json`

**ID ranges:** `fb-lyr-001` through `fb-lyr-056` (all fill_blank)

**Step 1: Fetch source material**

Search for Rolling Stones song lyrics on Wikipedia and official sources:
- https://en.wikipedia.org/wiki/List_of_Rolling_Stones_songs
- Wikipedia pages for individual songs: "(I Can't Get No) Satisfaction", "Paint It Black", "Sympathy for the Devil", "Wild Horses", "Gimme Shelter", "Start Me Up", "Brown Sugar", "Ruby Tuesday", "Jumpin' Jack Flash", "You Can't Always Get What You Want", and others.

**Step 2: Generate 56 fill_blank questions**

Format: the question presents a lyric with one key word/phrase blanked out.

```json
{
  "id": "fb-lyr-001",
  "type": "fill_blank",
  "category": "lyrics",
  "difficulty": "easy",
  "question": "Complete the lyric: 'I can't get no ___'",
  "answer": "satisfaction",
  "points": 10
}
```

```json
{
  "id": "fb-lyr-002",
  "type": "fill_blank",
  "category": "lyrics",
  "difficulty": "easy",
  "question": "Complete the lyric: 'Paint it ___'",
  "answer": "black",
  "points": 10
}
```

Rules:
- The blank should be a single word or short phrase (2–5 words)
- The answer must be unambiguous — only one correct fill-in
- Mix difficulty: easy (iconic, well-known lines), medium (verses), hard (obscure lines)
- Spread across many different songs — don't use more than 2 questions from the same song
- Answers should be exact as they appear in the lyrics (check carefully)

**Step 3: Validate and commit**

```bash
python3 -c "
import json
with open('public/questions.json') as f:
    data = json.load(f)
lyrics = [q for q in data if q['category'] == 'lyrics']
print(f'Lyrics: {len(lyrics)} (expected 56)')
ids = [q['id'] for q in data]
assert len(ids) == len(set(ids)), 'DUPLICATE IDs!'
print(f'Total: {len(data)}, no duplicate IDs')
"
```

Expected: `Lyrics: 56`, `Total: 194`

```bash
npm test
git add public/questions.json
git commit -m "content: add lyrics batch (56 fill_blank questions)"
```

---

### Task 7: Generate trivia expansion batch (+31 questions)

**Files:**
- Modify: `public/questions.json`

**ID ranges:**
- MC: `mc-trv-013` through `mc-trv-027` (15 questions)
- FB: `fb-trv-009` through `fb-trv-018` (10 questions)
- FT: `ft-trv-006` through `ft-trv-011` (6 questions)

**Step 1: Fetch source material**

- https://en.wikipedia.org/wiki/The_Rolling_Stones
- https://en.wikipedia.org/wiki/Rolling_Stones_discography
- https://en.wikipedia.org/wiki/Altamont_Free_Concert
- https://en.wikipedia.org/wiki/Rolling_Stones_Rock_and_Roll_Circus
- https://en.wikipedia.org/wiki/The_Rolling_Stones_in_concert

**Step 2: Generate 31 questions** covering: tours, record labels, TV appearances, legal troubles, business ventures, collaborators, film appearances, ABKCO/Rolling Stones Records, cultural milestones, awards.

**Step 3: Validate and commit**

```bash
python3 -c "
import json
with open('public/questions.json') as f:
    data = json.load(f)
trivia = [q for q in data if q['category'] == 'trivia']
print(f'Trivia: {len(trivia)} (expected 56)')
ids = [q['id'] for q in data]
assert len(ids) == len(set(ids)), 'DUPLICATE IDs!'
print(f'Total: {len(data)}, no duplicate IDs')
"
```

Expected: `Trivia: 56`, `Total: 225`

```bash
npm test
git add public/questions.json
git commit -m "content: add trivia expansion batch (+31 questions, total 56)"
```

---

### Task 8: Generate image batch (+25 questions)

**Files:**
- Modify: `public/questions.json`

**ID ranges:**
- Band member photos: `img-mem-001` through `img-mem-015` (category: `members`)
- Album covers: `img-alb-001` through `img-alb-008` (category: `albums`)
- Concert/other: `img-trv-001` through `img-trv-002` (category: `trivia`)

**Step 1: Find Wikimedia Commons image URLs**

Search Wikimedia Commons for each image. Use URLs in the format:
`https://upload.wikimedia.org/wikipedia/commons/...`

Required images to source:
- Photos of: Mick Jagger, Keith Richards, Charlie Watts, Ronnie Wood, Bill Wyman, Brian Jones, Mick Taylor — find multiple per person for variety
- Album covers: Sticky Fingers, Exile on Main St., Beggars Banquet, Let It Bleed, Some Girls, Aftermath, Between the Buttons, Tattoo You
- Concert: a well-known Rolling Stones live photo

To find URLs: search `site:commons.wikimedia.org "Keith Richards"` or similar, then get the direct upload URL.

**Step 2: Generate 25 image questions**

Schema:
```json
{
  "id": "img-mem-001",
  "type": "image",
  "category": "members",
  "difficulty": "easy",
  "question": "Who is pictured?",
  "image": "https://upload.wikimedia.org/wikipedia/commons/...",
  "options": ["Mick Jagger", "Keith Richards", "Ronnie Wood", "Charlie Watts"],
  "answer": "Keith Richards",
  "points": 10
}
```

For album cover questions:
```json
{
  "id": "img-alb-001",
  "type": "image",
  "category": "albums",
  "difficulty": "easy",
  "question": "Which Rolling Stones album is this?",
  "image": "https://upload.wikimedia.org/wikipedia/commons/...",
  "options": ["Exile on Main St.", "Sticky Fingers", "Let It Bleed", "Beggars Banquet"],
  "answer": "Sticky Fingers",
  "points": 10
}
```

Rules:
- All 4 options must be plausible (e.g. all band members, not one member + three random people)
- The correct answer must be unambiguously identifiable from the photo
- Verify each Wikimedia URL actually loads before including it

**Step 3: Validate and commit**

```bash
python3 -c "
import json
with open('public/questions.json') as f:
    data = json.load(f)
from collections import Counter
cats = Counter(q['category'] for q in data)
types = Counter(q['type'] for q in data)
print(f'Total: {len(data)} (expected 250)')
print('By category:', dict(cats))
print('By type:', dict(types))
ids = [q['id'] for q in data]
assert len(ids) == len(set(ids)), 'DUPLICATE IDs!'
print('No duplicate IDs ✓')
"
```

Expected:
```
Total: 250
By category: {'albums': 57, 'members': 56, 'trivia': 56, 'lyrics': 56, 'image': 25}  ← note: image questions are split across categories
```

Wait — image questions have `category: 'members'`, `'albums'`, or `'trivia'` (not a separate `image` category). The type is `image` but the category is one of the existing four. Validate by type instead:

```bash
python3 -c "
import json
with open('public/questions.json') as f:
    data = json.load(f)
from collections import Counter
cats = Counter(q['category'] for q in data)
types = Counter(q['type'] for q in data)
print(f'Total: {len(data)} (expected 250)')
print('By category:', dict(cats))
print('By type:', dict(types))
ids = [q['id'] for q in data]
assert len(ids) == len(set(ids)), 'DUPLICATE IDs!'
print('No duplicate IDs ✓')
assert data[0].get('id'), 'Missing id field'
print('Schema spot check ✓')
"
```

```bash
npm test
git add public/questions.json
git commit -m "content: add image batch (25 questions with Wikimedia URLs)"
```

---

### Task 9: Final validation

**Step 1: Run full build and test suite**

```bash
npm run build && npm test
```

Expected: build succeeds, all tests pass.

**Step 2: Final JSON sanity check**

```bash
python3 -c "
import json
with open('public/questions.json') as f:
    data = json.load(f)
from collections import Counter
cats = Counter(q['category'] for q in data)
types = Counter(q['type'] for q in data)
print(f'Total: {len(data)}')
print('By category:', dict(cats))
print('By type:', dict(types))

# Verify all required fields present
for q in data:
    assert 'id' in q and 'type' in q and 'category' in q and 'question' in q and 'answer' in q
    if q['type'] == 'multiple_choice':
        assert 'options' in q and len(q['options']) == 4
    if q['type'] == 'image':
        assert 'options' in q and len(q['options']) == 4
        assert 'image' in q and q['image'].startswith('https://')
print('All schema checks passed ✓')

ids = [q['id'] for q in data]
assert len(ids) == len(set(ids)), 'DUPLICATE IDs!'
print('No duplicate IDs ✓')
"
```

**Step 3: Commit if any fixes were made, otherwise done**

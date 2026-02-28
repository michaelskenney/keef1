# Rolling Stones Quiz App — Design Document

**Date:** 2026-02-28
**Status:** Approved

---

## Overview

A mobile-first web quiz app that tests users' knowledge of the Rolling Stones — lyrics, album dates, band members, and arcane trivia. Designed for personal/friends use with a shared competitive leaderboard. No accounts; players enter a nickname to play.

---

## Architecture

**Stack:**
- Vite + React (TypeScript) SPA
- Deployed to Netlify (free tier)
- Supabase (hosted Postgres) for leaderboard — no auth required
- Questions in a `questions.json` file bundled with the app

**Game Flow:**
1. **Home** — enter nickname, tap "Play"
2. **Quiz** — 10 randomly drawn questions, one at a time with countdown timer
3. **Feedback** — after each answer: correct/wrong, answer revealed, points shown (auto-advances after 1.5s)
4. **End screen** — final score, breakdown, "Submit to Leaderboard" button
5. **Leaderboard** — top scores with nicknames and dates; player's entry highlighted

**iPhone-specific care:**
- All tap targets ≥ 44px
- Font size ≥ 16px on inputs (prevents iOS auto-zoom)
- Safe area insets for notched iPhones
- No hover-dependent interactions
- Compatible with iOS Safari quirks

---

## Question Types & Data Model

Four question types stored in `questions.json`:

### Multiple Choice
```json
{
  "id": "mc-001",
  "type": "multiple_choice",
  "category": "albums",
  "question": "In what year was Exile on Main St. released?",
  "options": ["1969", "1972", "1974", "1978"],
  "answer": "1972",
  "points": 10
}
```

### Fill in the Blank
```json
{
  "type": "fill_blank",
  "category": "lyrics",
  "question": "Complete the lyric: 'Please allow me to introduce myself, I'm a man of ___ and taste'",
  "answer": "wealth",
  "points": 10
}
```

### Free Text (with fuzzy matching)
```json
{
  "type": "free_text",
  "category": "members",
  "question": "Who played bass on most early Stones recordings but was never an official member?",
  "answer": "Bill Wyman",
  "fuzzy": true,
  "points": 10
}
```

### Image
```json
{
  "type": "image",
  "category": "trivia",
  "question": "Who is pictured here with Mick Jagger at the 1969 Hyde Park concert?",
  "image": "images/hyde-park-1969.jpg",
  "answer": "Brian Jones",
  "fuzzy": true,
  "points": 10
}
```

**Fuzzy matching:** uses [fuse.js](https://fusejs.io/) for `free_text` and `fill_blank` questions. Tolerates typos and minor spelling errors; threshold tunable per question.

**Categories:** `albums`, `members`, `lyrics`, `trivia`

### Leaderboard Table (Supabase)
```sql
id          uuid          primary key
nickname    text          not null
score       integer       not null
max_score   integer       not null
questions   integer       not null
correct     integer       not null
played_at   timestamptz   default now()
```

---

## Scoring & Timer

**Per-question timer:** 30 seconds with a visible shrinking countdown bar.

**Base points:** 10 per correct answer.

**Speed bonus:** up to 5 extra points:
```
bonus = Math.floor((timeRemaining / 30) * 5)
```
- Instant answer = 15 pts total
- 1 second remaining ≈ 1 pt bonus
- Time expired = 0 pts

**Quiz length:** 10 questions per round, drawn randomly with no repeats. Categories weighted to avoid clustering:

```ts
const CONFIG = {
  questionsPerRound: 10,
  secondsPerQuestion: 30,
  basePoints: 10,
  maxSpeedBonus: 5,
  categoryWeights: { albums: 1, members: 1, lyrics: 2, trivia: 1 }
}
```

**End screen:** shows total score, max possible, and per-question breakdown (correct?, speed bonus earned).

---

## UI Components & Mobile UX

**5 screens managed via React state (no router needed):**

| Screen | Contents |
|--------|----------|
| Home | App title, nickname input, "Play" button, "Leaderboard" link |
| Quiz | Question card, timer bar, answer UI (varies by type), running score |
| Feedback | ✓/✗ overlay, correct answer, points earned — auto-advances after 1.5s |
| End | Final score, breakdown table, "Submit Score" + "Play Again" buttons |
| Leaderboard | Ranked list, player's entry highlighted, "Play Again" |

**Answer UI per question type:**
- **Multiple choice** — 4 full-width stacked tap buttons, no keyboard
- **Fill in the blank** — inline text input within sentence display, 16px+ font
- **Free text** — text input + "Submit" button; fuzzy match on submit
- **Image** — image above question, free text input below

**Visual design:** dark background, bold high-contrast type, rock-poster aesthetic. Accent color: Stones tongue red (`#E8001C`). No external UI framework — plain CSS with custom properties for small bundle size and full mobile control.

---

## Out of Scope (Future Work)

- Question sourcing / admin tooling to populate `questions.json`
- User accounts or persistent player profiles
- Multiplayer / head-to-head mode
- Audio questions (song clips)

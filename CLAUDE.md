# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Rolling Stones music trivia quiz — a single-page React app where players answer 10 questions per round with a countdown timer, earn speed-bonus points, and submit scores to a weekly Supabase leaderboard.

## Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Type-check + Vite build
npm run lint         # ESLint
npm run test         # Run all tests once
npm run test:watch   # Run tests in watch mode
```

Run a single test file:
```bash
npx vitest run src/lib/scoring.test.ts
```

## Environment Variables

Requires a `.env.local` with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

**Screen flow** (`src/App.tsx`): `home → quiz → end → leaderboard`. Screen state and all cross-screen data (nickname, questions, results) live in `App`. No router — plain `screen` state enum drives conditional rendering.

**Question data** (`public/questions.json`): Static JSON fetched at runtime. Four categories (`albums`, `members`, `lyrics`, `trivia`) and four types (`multiple_choice`, `fill_blank`, `free_text`, `image`). Image questions reference files under `public/images/`; attribution metadata is in `public/images/attribution.json`.

**Question selection** (`src/lib/selectQuestions.ts`): Every round guarantees exactly 1 lyrics question, 1 album-cover image question, and 1 band-member image question, then fills the rest randomly using category weights from `CONFIG`.

**Answer checking** (`src/lib/quizEngine.ts` + `src/lib/fuzzyMatch.ts`): Questions with `fuzzy: true` are matched via Fuse.js (threshold 0.4). All others use exact case-insensitive comparison.

**Scoring** (`src/lib/scoring.ts`): `basePoints + floor(timeRemaining / totalTime * maxSpeedBonus)`. All game constants (questions per round, timer, points) are in `src/config.ts`.

**Leaderboard** (`src/lib/leaderboard.ts`): Writes to and reads from a Supabase `leaderboard` table. Scores are filtered to the current ISO week (`src/lib/weekStart.ts`).

**Build-time globals**: `vite.config.ts` injects `__APP_VERSION__` (from `package.json`) and `__BUILD_DATE__`. Declared in `src/globals.d.ts`.

## Testing

Vitest + jsdom + Testing Library. Setup file `src/test-setup.ts` imports `@testing-library/jest-dom`. Supabase is mocked in leaderboard tests. Tests live alongside source files as `*.test.ts(x)`.

## Content Scripts

Python scripts in `scripts/` are one-off content generators — not part of the build:
- `parse_lyrics.py` / `parse_album_covers.py` — parse raw data into `questions.json` entries
- `fetch_images.py` — downloads and organizes images into `public/images/`

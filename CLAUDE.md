# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Rolling Stones music trivia quiz — a single-page React app where players answer 10 questions per round with a countdown timer, earn speed-bonus points, and submit scores to a weekly leaderboard backed by a Cloudflare D1 Worker.

## Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Type-check + Vite build
npm run lint         # ESLint
npm run test         # Run all tests once
npm run test:watch   # Run tests in watch mode
npm run preview      # Preview production build locally
```

Run a single test file:
```bash
npx vitest run src/lib/scoring.test.ts
```

## Environment Variables

Requires a `.env.local` with:
```
VITE_LEADERBOARD_API_URL=https://keef1-leaderboard.mike-d8a.workers.dev
```

## Architecture

**Code organization**: `src/components/` has React screen components and UI elements (flat, no nesting). `src/lib/` has pure logic modules (scoring, question selection, fuzzy matching, etc.). Tests are colocated as `*.test.ts(x)` in both directories. Shared types live in `src/types.ts`; game constants in `src/config.ts`.

**Screen flow** (`src/App.tsx`): `home → quiz → feedback → end → leaderboard`. Screen state and all cross-screen data (nickname, questions, results) live in `App`. No router — plain `screen` state enum drives conditional rendering.

**Question data** (`public/questions.json`): Static JSON fetched at runtime. Four categories (`albums`, `members`, `lyrics`, `trivia`) and five types (`multiple_choice`, `fill_blank`, `free_text`, `image`, `timeline`). Image questions reference files under `public/images/`; attribution metadata is in `public/images/attribution.json`.

**Timeline questions**: Drag-to-reorder UI (`TimelineCard`) where the player sorts albums chronologically. The answer is a JSON-serialized array of album names; correctness is checked by comparing to year-sorted order in `quizEngine.ts`.

**Question selection** (`src/lib/selectQuestions.ts`): Every round guarantees exactly 1 lyrics question, 1 album-cover image question, and 1 band-member image question, then fills the rest randomly using category weights from `CONFIG`. Duplicate answers are prevented across the round.

**Answer checking** (`src/lib/quizEngine.ts` + `src/lib/fuzzyMatch.ts`): Questions with `fuzzy: true` are matched via Fuse.js (threshold 0.4). All others use exact case-insensitive comparison. Timeline questions compare user-submitted JSON order against year-sorted order.

**Scoring** (`src/lib/scoring.ts`): `basePoints + floor(timeRemaining / totalTime * maxSpeedBonus)`. All game constants (questions per round, timer, points) are in `src/config.ts`.

**Leaderboard** (`src/lib/leaderboard.ts`): Submits and fetches scores via a Cloudflare D1 Worker (`POST /scores`, `GET /scores`). Scores are filtered to the current ISO week (`src/lib/weekStart.ts`).

**Build-time globals**: `vite.config.ts` injects `__APP_VERSION__` (from `package.json`) and `__BUILD_DATE__`. Declared in `src/globals.d.ts`.

## Testing

Vitest + jsdom + Testing Library. Setup file `src/test-setup.ts` imports `@testing-library/jest-dom`. Tests live alongside source files as `*.test.ts(x)`.

## Deployment

Deployed to Netlify (`netlify.toml`). SPA catch-all redirect is configured. Build output goes to `dist/`.

## Content Scripts

Python scripts in `scripts/` are one-off content generators — not part of the build:
- `parse_lyrics.py` / `parse_album_covers.py` — parse raw data into `questions.json` entries
- `fetch_images.py` — downloads and organizes images into `public/images/`

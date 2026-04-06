# The Rolling Stones Quiz

A timed music trivia game covering the Rolling Stones' albums, lyrics, band members, and history. Players answer 10 questions per round, earn speed-bonus points, and compete on a weekly leaderboard.

**Live site:** Deployed on Cloudflare Pages

## How It Works

1. Enter a nickname and start a round.
2. Answer 10 questions against a 60-second countdown timer per question.
3. Earn points for correct answers plus a speed bonus for answering quickly.
4. After each round, see your results and submit your score to the weekly leaderboard.

### Question Types

- **Multiple choice** — pick the right answer
- **Fill in the blank** — complete a lyric or fact (fuzzy matching via Fuse.js)
- **Free text** — type your answer
- **Image** — identify album covers or band members from photos
- **Timeline** — drag-and-drop albums into chronological order

Every round guarantees at least one lyrics question, one album-cover image question, and one band-member image question; the rest are filled randomly across categories.

## Tech Stack

- **React 19** + **TypeScript** — single-page app, no router
- **Vite** — dev server and build tooling
- **Cloudflare D1** — weekly leaderboard persistence (via Cloudflare Worker)
- **Fuse.js** — fuzzy answer matching for free-text questions
- **Vitest** + **Testing Library** — unit and component tests
- **Cloudflare Pages** — hosting with SPA redirect

## Getting Started

```bash
npm install
cp .env.example .env.local   # then fill in the Worker API URL
npm run dev                   # http://localhost:5173
```

### Environment Variables

Create a `.env.local` with:

```
VITE_LEADERBOARD_API_URL=https://your-worker-url.workers.dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
  components/   # React screens and UI elements (flat, no nesting)
  lib/          # Pure logic — scoring, question selection, fuzzy matching
  config.ts     # Game constants (timer, points, questions per round)
  types.ts      # Shared TypeScript types
  App.tsx       # Screen flow: home → quiz → feedback → end → leaderboard
public/
  questions.json          # Question bank (fetched at runtime)
  images/                 # Album covers and band member photos
  images/attribution.json # Image attribution metadata
scripts/        # One-off Python content generators (not part of the build)
```

## License

Private project.

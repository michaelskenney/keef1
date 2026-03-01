# Weekly Leaderboard Reset — Design

**Date:** 2026-03-01

## Problem

The leaderboard currently shows all-time scores. We want it to show only scores from the current week, resetting each Monday at 12:01 AM Eastern time, and display a label indicating which week's scores are shown.

## Decision

Filter by `played_at` in the Supabase query (Option A). No DB schema changes required — `played_at` is already stored automatically on each row.

Old scores remain in the database but are excluded from the leaderboard query.

## Components

### `src/lib/weekStart.ts` (new)

Exports `getWeekStart()` which returns:
- `iso`: ISO 8601 string of the most recent Monday at 12:01 AM Eastern, converted to UTC — used as the Supabase query lower bound
- `label`: Human-readable string like `"March 2, 2026"` — used in the UI

DST is handled via `Intl.DateTimeFormat` to correctly determine the ET offset at the relevant Monday, with no external dependencies.

### `src/lib/leaderboard.ts` (updated)

`fetchLeaderboard` adds `.gte('played_at', weekStart.iso)` to the Supabase query.

Returns `{ entries: LeaderboardEntry[], weekLabel: string }` instead of just the entries array.

### `src/components/LeaderboardScreen.tsx` (updated)

Accepts a new `weekLabel: string` prop. Renders a subtitle beneath the "Leaderboard" heading:

> High scores for the week of March 2, 2026

### `src/App.tsx` (updated)

- Adds `weekLabel` state (string)
- `loadLeaderboard` destructures `{ entries, weekLabel }` from the updated `fetchLeaderboard` and stores both in state
- Passes `weekLabel` to `LeaderboardScreen`

## Out of Scope

- Deleting old records
- Historical week browsing
- Server-side scheduled jobs

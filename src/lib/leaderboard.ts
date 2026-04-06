import { getWeekStart } from './weekStart'
import type { LeaderboardEntry } from '../types'

const API_URL = import.meta.env.VITE_LEADERBOARD_API_URL as string

export async function submitScore(entry: Omit<LeaderboardEntry, 'id' | 'played_at'>): Promise<void> {
  const res = await fetch(`${API_URL}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || `Submit failed: ${res.status}`)
  }
}

export async function fetchLeaderboard(
  limit = 20
): Promise<{ entries: LeaderboardEntry[]; weekLabel: string }> {
  const { iso, label } = getWeekStart()
  const res = await fetch(`${API_URL}/scores?since=${encodeURIComponent(iso)}&limit=${limit}`)
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || `Fetch failed: ${res.status}`)
  }
  const data = await res.json()
  return { entries: data.entries as LeaderboardEntry[], weekLabel: label }
}

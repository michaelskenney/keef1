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

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

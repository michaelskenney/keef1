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
    expect(screen.getByText('Keef').closest('li')?.getAttribute('style')).toContain('var(--red)')
  })

  it('shows loading state', () => {
    render(<LeaderboardScreen entries={[]} currentNickname={null} loading={true} onPlayAgain={vi.fn()} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

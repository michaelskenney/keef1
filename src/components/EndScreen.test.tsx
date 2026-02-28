import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EndScreen } from './EndScreen'
import type { AnsweredQuestion, Question } from '../types'

const makeResult = (correct: boolean, points: number): AnsweredQuestion => ({
  question: { id: '1', type: 'multiple_choice', category: 'albums', question: 'Q', options: [], answer: 'A', points: 10 } as unknown as Question,
  userAnswer: correct ? 'A' : 'B',
  correct,
  pointsEarned: points,
  timeRemaining: 20,
})

describe('EndScreen', () => {
  it('shows total score', () => {
    const results = [makeResult(true, 13), makeResult(false, 0), makeResult(true, 10)]
    render(<EndScreen results={results} nickname="Keef" onSubmit={vi.fn()} onPlayAgain={vi.fn()} />)
    expect(screen.getByText('23')).toBeInTheDocument()
  })

  it('shows correct count', () => {
    const results = [makeResult(true, 13), makeResult(false, 0)]
    render(<EndScreen results={results} nickname="Keef" onSubmit={vi.fn()} onPlayAgain={vi.fn()} />)
    expect(screen.getByText(/1.*2/)).toBeInTheDocument()
  })
})

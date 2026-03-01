import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { QuizScreen } from './QuizScreen'
import type { Question } from '../types'

const ftQ1: Question = {
  id: 'ft-1', type: 'fill_blank', category: 'lyrics',
  question: "Complete: I can't get no ___", answer: 'satisfaction', points: 10,
}
const ftQ2: Question = {
  id: 'ft-2', type: 'fill_blank', category: 'lyrics',
  question: 'Complete: Paint it ___', answer: 'black', points: 10,
}

afterEach(() => { vi.useRealTimers() })

describe('QuizScreen', () => {
  it('clears text input when advancing to the next fill-blank question', () => {
    vi.useFakeTimers()
    render(<QuizScreen questions={[ftQ1, ftQ2]} onComplete={vi.fn()} />)

    // Answer question 1 with fireEvent (synchronous, no timer conflicts)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'satisfaction' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    // Advance past the 1500ms feedback overlay
    act(() => { vi.advanceTimersByTime(1600) })

    // Question 2 input should be empty
    expect(screen.getByRole('textbox')).toHaveValue('')
  })
})

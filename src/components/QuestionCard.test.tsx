import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionCard } from './QuestionCard'
import type { Question } from '../types'

const mcQuestion: Question = {
  id: 'mc-1',
  type: 'multiple_choice',
  category: 'albums',
  question: 'What year was Exile on Main St. released?',
  options: ['1969', '1972', '1974', '1978'],
  answer: '1972',
  points: 10,
}

const ftQuestion: Question = {
  id: 'ft-1',
  type: 'free_text',
  category: 'members',
  question: 'Who played keyboards?',
  answer: 'Chuck Leavell',
  fuzzy: true,
  points: 10,
}

const imageQuestion: Question = {
  id: 'img-1',
  type: 'image',
  category: 'members',
  question: 'Who is pictured?',
  image: 'https://upload.wikimedia.org/wikipedia/commons/test/img.jpg',
  options: ['Mick Jagger', 'Keith Richards', 'Ronnie Wood', 'Charlie Watts'],
  answer: 'Keith Richards',
  points: 10,
}

describe('QuestionCard', () => {
  it('renders multiple choice options as buttons', () => {
    render(<QuestionCard question={mcQuestion} onAnswer={vi.fn()} disabled={false} />)
    expect(screen.getByText('1972')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('calls onAnswer when option clicked', async () => {
    const onAnswer = vi.fn()
    render(<QuestionCard question={mcQuestion} onAnswer={onAnswer} disabled={false} />)
    await userEvent.click(screen.getByText('1972'))
    expect(onAnswer).toHaveBeenCalledWith('1972')
  })

  it('renders free text with input', () => {
    render(<QuestionCard question={ftQuestion} onAnswer={vi.fn()} disabled={false} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('calls onAnswer on free text submit', async () => {
    const onAnswer = vi.fn()
    render(<QuestionCard question={ftQuestion} onAnswer={onAnswer} disabled={false} />)
    await userEvent.type(screen.getByRole('textbox'), 'Chuck Leavell')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(onAnswer).toHaveBeenCalledWith('Chuck Leavell')
  })

  it('disables inputs when disabled=true', () => {
    render(<QuestionCard question={mcQuestion} onAnswer={vi.fn()} disabled={true} />)
    screen.getAllByRole('button').forEach(btn => expect(btn).toBeDisabled())
  })

  it('renders image and MC buttons for image type questions', () => {
    render(<QuestionCard question={imageQuestion} onAnswer={vi.fn()} disabled={false} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', imageQuestion.image)
    expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.getByText('Keith Richards')).toBeInTheDocument()
  })

  it('does not show text input for image type questions', () => {
    render(<QuestionCard question={imageQuestion} onAnswer={vi.fn()} disabled={false} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})

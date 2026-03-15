import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimelineCard } from './TimelineCard'
import type { TimelineQuestion } from '../types'

const tlQ: TimelineQuestion = {
  id: 'tl-1', type: 'timeline', category: 'albums',
  question: 'Order these albums (earliest first)',
  albums: [
    { name: 'Sticky Fingers', year: 1971, image: '/img/a.jpg' },
    { name: 'Exile on Main St.', year: 1972, image: '/img/b.jpg' },
    { name: 'Some Girls', year: 1978, image: '/img/c.jpg' },
  ],
  points: 10,
}

describe('TimelineCard', () => {
  it('renders all 3 album names', () => {
    render(<TimelineCard question={tlQ} onAnswer={vi.fn()} disabled={false} />)
    expect(screen.getByText('Sticky Fingers')).toBeInTheDocument()
    expect(screen.getByText('Exile on Main St.')).toBeInTheDocument()
    expect(screen.getByText('Some Girls')).toBeInTheDocument()
  })

  it('renders the question text', () => {
    render(<TimelineCard question={tlQ} onAnswer={vi.fn()} disabled={false} />)
    expect(screen.getByText('Order these albums (earliest first)')).toBeInTheDocument()
  })

  it('has a Lock In button', () => {
    render(<TimelineCard question={tlQ} onAnswer={vi.fn()} disabled={false} />)
    expect(screen.getByRole('button', { name: /lock in/i })).toBeInTheDocument()
  })

  it('calls onAnswer with JSON array of album names when Lock In is clicked', () => {
    const onAnswer = vi.fn()
    render(<TimelineCard question={tlQ} onAnswer={onAnswer} disabled={false} />)
    fireEvent.click(screen.getByRole('button', { name: /lock in/i }))
    expect(onAnswer).toHaveBeenCalledOnce()
    const arg = onAnswer.mock.calls[0][0]
    const parsed = JSON.parse(arg)
    expect(parsed).toHaveLength(3)
    expect(parsed).toContain('Sticky Fingers')
    expect(parsed).toContain('Exile on Main St.')
    expect(parsed).toContain('Some Girls')
  })

  it('disables Lock In button when disabled prop is true', () => {
    render(<TimelineCard question={tlQ} onAnswer={vi.fn()} disabled={true} />)
    expect(screen.getByRole('button', { name: /lock in/i })).toBeDisabled()
  })
})

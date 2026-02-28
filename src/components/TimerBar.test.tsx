import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimerBar } from './TimerBar'

describe('TimerBar', () => {
  it('renders at full width when time is full', () => {
    render(<TimerBar timeRemaining={30} totalTime={30} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '30')
    expect(bar).toHaveAttribute('aria-valuemax', '30')
  })

  it('renders at half width when half time remains', () => {
    render(<TimerBar timeRemaining={15} totalTime={30} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '15')
  })
})

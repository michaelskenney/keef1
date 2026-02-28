import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from './HomeScreen'

describe('HomeScreen', () => {
  it('renders title and input', () => {
    render(<HomeScreen onStart={vi.fn()} onLeaderboard={vi.fn()} />)
    expect(screen.getByText('ROLLING')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/nickname/i)).toBeInTheDocument()
  })

  it('calls onStart with trimmed nickname', async () => {
    const onStart = vi.fn()
    render(<HomeScreen onStart={onStart} onLeaderboard={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText(/nickname/i), '  Keef  ')
    await userEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(onStart).toHaveBeenCalledWith('Keef')
  })

  it('does not call onStart with empty nickname', async () => {
    const onStart = vi.fn()
    render(<HomeScreen onStart={onStart} onLeaderboard={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(onStart).not.toHaveBeenCalled()
  })
})

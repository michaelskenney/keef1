import { describe, it, expect } from 'vitest'
import { calcScore } from './scoring'

describe('calcScore', () => {
  it('returns base + full bonus for instant answer', () => {
    expect(calcScore(true, 30, 30, 10, 5)).toBe(15)
  })

  it('returns base + partial bonus for mid-speed answer', () => {
    expect(calcScore(true, 15, 30, 10, 5)).toBe(12)
  })

  it('returns base points only for last-second answer', () => {
    expect(calcScore(true, 1, 30, 10, 5)).toBe(10)
  })

  it('returns 0 for wrong answer', () => {
    expect(calcScore(false, 25, 30, 10, 5)).toBe(0)
  })

  it('returns 0 when time expires', () => {
    expect(calcScore(true, 0, 30, 10, 5)).toBe(0)
  })
})

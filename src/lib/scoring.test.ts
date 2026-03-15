import { describe, it, expect } from 'vitest'
import { calcScore, calcTimelineScore } from './scoring'

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

describe('calcTimelineScore', () => {
  it('awards full points when all 3 albums correct', () => {
    // 3 * floor(10/3)=9 base + floor(3/3 * 45/60 * 5)=3 speed = 12
    expect(calcTimelineScore(3, 3, 45, 60, 10, 5)).toBe(12)
  })

  it('awards partial points for 2 correct', () => {
    // 2*3=6 base + floor(2/3 * 45/60 * 5)=floor(2.5)=2 speed = 8
    expect(calcTimelineScore(2, 3, 45, 60, 10, 5)).toBe(8)
  })

  it('awards partial points for 1 correct', () => {
    // 1*3=3 base + floor(1/3 * 30/60 * 5)=floor(0.83)=0 speed = 3
    expect(calcTimelineScore(1, 3, 30, 60, 10, 5)).toBe(3)
  })

  it('returns 0 when none correct', () => {
    expect(calcTimelineScore(0, 3, 45, 60, 10, 5)).toBe(0)
  })

  it('returns 0 when time expired', () => {
    expect(calcTimelineScore(3, 3, 0, 60, 10, 5)).toBe(0)
  })
})

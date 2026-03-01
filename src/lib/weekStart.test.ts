import { describe, it, expect } from 'vitest'
import { getWeekStart } from './weekStart'

describe('getWeekStart', () => {
  it('returns Monday of the current week on a Wednesday (EST)', () => {
    // Wednesday 2026-03-04 at noon ET (EST = UTC-5) → 2026-03-04T17:00:00Z
    const wednesday = new Date('2026-03-04T17:00:00Z')
    const { iso, label } = getWeekStart(wednesday)
    expect(label).toBe('March 2, 2026')
    expect(iso).toBe('2026-03-02T05:01:00.000Z') // Monday 00:01 EST = 05:01 UTC
  })

  it('returns same Monday when called on a Monday after 12:01 AM (EST)', () => {
    // Monday 2026-03-02 at 8 AM ET = 2026-03-02T13:00:00Z
    const monday = new Date('2026-03-02T13:00:00Z')
    const { iso, label } = getWeekStart(monday)
    expect(label).toBe('March 2, 2026')
    expect(iso).toBe('2026-03-02T05:01:00.000Z')
  })

  it('returns the previous Monday when called on a Sunday (EST)', () => {
    // Sunday 2026-03-08 at 10 AM ET = 2026-03-08T15:00:00Z (still EST before DST)
    const sunday = new Date('2026-03-08T15:00:00Z')
    const { iso, label } = getWeekStart(sunday)
    expect(label).toBe('March 2, 2026')
    expect(iso).toBe('2026-03-02T05:01:00.000Z')
  })

  it('handles EDT correctly after DST switch (Monday at 1 AM EDT)', () => {
    // DST starts Sunday 2026-03-08 at 2 AM ET → clocks spring to 3 AM
    // Monday 2026-03-09 at 1 AM EDT = 2026-03-09T05:00:00Z (EDT = UTC-4)
    const mondayEDT = new Date('2026-03-09T05:00:00Z')
    const { iso, label } = getWeekStart(mondayEDT)
    expect(label).toBe('March 9, 2026')
    expect(iso).toBe('2026-03-09T04:01:00.000Z') // Monday 00:01 EDT = 04:01 UTC
  })

  it('returns current Monday boundary when called on Monday at 12:30 AM ET (after cutoff)', () => {
    // Monday 2026-03-02 at 12:30 AM ET = 2026-03-02T05:30:00Z (after the 00:01 anchor)
    const mondayAfterCutoff = new Date('2026-03-02T05:30:00Z')
    const { iso, label } = getWeekStart(mondayAfterCutoff)
    expect(label).toBe('March 2, 2026')
    expect(iso).toBe('2026-03-02T05:01:00.000Z')
  })
})

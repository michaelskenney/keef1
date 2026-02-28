import { describe, it, expect } from 'vitest'
import { fuzzyMatch } from './fuzzyMatch'

describe('fuzzyMatch', () => {
  it('matches exact answer', () => {
    expect(fuzzyMatch('Bill Wyman', 'Bill Wyman')).toBe(true)
  })

  it('matches with typo', () => {
    expect(fuzzyMatch('Bil Wiman', 'Bill Wyman')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(fuzzyMatch('bill wyman', 'Bill Wyman')).toBe(true)
  })

  it('rejects clearly wrong answer', () => {
    expect(fuzzyMatch('Mick Jagger', 'Bill Wyman')).toBe(false)
  })

  it('matches partial for single-word answers', () => {
    expect(fuzzyMatch('satisfacton', 'satisfaction')).toBe(true)
  })
})

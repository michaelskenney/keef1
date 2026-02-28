import { describe, it, expect } from 'vitest'
import { selectQuestions } from './selectQuestions'
import type { Question } from '../types'

const makeQ = (id: string, category: string): Question => ({
  id,
  type: 'multiple_choice',
  category: category as any,
  question: 'Q',
  options: ['A', 'B', 'C', 'D'],
  answer: 'A',
  points: 10,
})

const pool: Question[] = [
  makeQ('a1', 'albums'),
  makeQ('a2', 'albums'),
  makeQ('m1', 'members'),
  makeQ('l1', 'lyrics'),
  makeQ('l2', 'lyrics'),
  makeQ('l3', 'lyrics'),
  makeQ('t1', 'trivia'),
]

describe('selectQuestions', () => {
  it('returns the requested number of questions', () => {
    const result = selectQuestions(pool, 5, { albums: 1, members: 1, lyrics: 2, trivia: 1 })
    expect(result).toHaveLength(5)
  })

  it('returns no duplicates', () => {
    const result = selectQuestions(pool, 5, { albums: 1, members: 1, lyrics: 2, trivia: 1 })
    const ids = result.map(q => q.id)
    expect(new Set(ids).size).toBe(5)
  })

  it('returns all questions if pool is smaller than requested count', () => {
    const result = selectQuestions(pool, 20, { albums: 1, members: 1, lyrics: 2, trivia: 1 })
    expect(result).toHaveLength(pool.length)
  })
})

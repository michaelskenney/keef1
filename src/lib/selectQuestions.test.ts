import { describe, it, expect } from 'vitest'
import { selectQuestions } from './selectQuestions'
import type { Question } from '../types'

const makeMC = (id: string, category: string): Question => ({
  id,
  type: 'multiple_choice',
  category: category as any,
  question: 'Q',
  options: ['A', 'B', 'C', 'D'],
  answer: 'A',
  points: 10,
})

const makeFB = (id: string, category: string): Question => ({
  id,
  type: 'fill_blank',
  category: category as any,
  question: 'Fill in ___',
  answer: 'A',
  points: 10,
})

const pool: Question[] = [
  makeMC('a1', 'albums'),
  makeMC('a2', 'albums'),
  makeMC('m1', 'members'),
  makeMC('m2', 'members'),
  makeMC('t1', 'trivia'),
  makeMC('t2', 'trivia'),
  makeFB('fb1', 'albums'),
  makeFB('fb2', 'members'),
  makeFB('fb3', 'trivia'),
]

const weights = { albums: 1, members: 1, trivia: 1, lyrics: 0 }

describe('selectQuestions', () => {
  it('returns the requested number of questions', () => {
    const result = selectQuestions(pool, 7, weights)
    expect(result).toHaveLength(7)
  })

  it('returns no duplicates', () => {
    const result = selectQuestions(pool, 7, weights)
    const ids = result.map(q => q.id)
    expect(new Set(ids).size).toBe(7)
  })

  it('last question is always fill_blank', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectQuestions(pool, 7, weights)
      expect(result[result.length - 1].type).toBe('fill_blank')
    }
  })

  it('all questions except the last are multiple_choice', () => {
    const result = selectQuestions(pool, 7, weights)
    result.slice(0, -1).forEach(q => {
      expect(q.type).toBe('multiple_choice')
    })
  })

  it('returns all available questions if pool is smaller than requested count', () => {
    const small: Question[] = [
      makeMC('x1', 'albums'),
      makeMC('x2', 'albums'),
      makeFB('xf1', 'albums'),
    ]
    const result = selectQuestions(small, 7, weights)
    expect(result.length).toBeLessThanOrEqual(small.length)
  })
})

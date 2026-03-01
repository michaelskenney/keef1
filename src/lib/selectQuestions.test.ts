import { describe, it, expect } from 'vitest'
import { selectQuestions } from './selectQuestions'
import type { Question } from '../types'

const makeMC = (id: string, category: string): Question => ({
  id,
  type: 'multiple_choice',
  category: category as any,
  question: 'Q',
  options: ['A', 'B', 'C', 'D'],
  answer: id,   // unique per question — prevents dedup collisions in existing tests
  points: 10,
})

const makeFB = (id: string, category: string): Question => ({
  id,
  type: 'fill_blank',
  category: category as any,
  question: 'Fill in ___',
  answer: id,   // unique per question
  points: 10,
})

const makeImage = (id: string, category: string): Question => ({
  id,
  type: 'image',
  category: category as any,
  question: 'Who is this?',
  image: 'https://example.com/img.jpg',
  options: ['A', 'B', 'C', 'D'],
  answer: id,
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

const weights = { albums: 1, members: 1, trivia: 1, lyrics: 1 }

describe('selectQuestions', () => {
  it('returns the requested number of questions', () => {
    const result = selectQuestions(pool, 7, weights)
    expect(result).toHaveLength(7)
  })

  it('returns no duplicate IDs', () => {
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

  it('all questions except the last are multiple_choice or image', () => {
    const result = selectQuestions(pool, 7, weights)
    result.slice(0, -1).forEach(q => {
      expect(['multiple_choice', 'image']).toContain(q.type)
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

  it('never selects two questions with the same normalized answer in one round', () => {
    const dedupPool: Question[] = [
      // mc-dup-1 and mc-dup-2 both answer "Mick Taylor"
      { id: 'mc-dup-1', type: 'multiple_choice', category: 'members' as any, question: 'Q1', options: ['A','B','C','D'], answer: 'Mick Taylor', points: 10 },
      { id: 'mc-dup-2', type: 'multiple_choice', category: 'members' as any, question: 'Q2', options: ['A','B','C','D'], answer: 'mick taylor', points: 10 },
      { id: 'mc-3', type: 'multiple_choice', category: 'members' as any, question: 'Q3', options: ['A','B','C','D'], answer: 'Keith Richards', points: 10 },
      { id: 'mc-4', type: 'multiple_choice', category: 'members' as any, question: 'Q4', options: ['A','B','C','D'], answer: 'Charlie Watts', points: 10 },
      { id: 'mc-5', type: 'multiple_choice', category: 'members' as any, question: 'Q5', options: ['A','B','C','D'], answer: 'Ronnie Wood', points: 10 },
      { id: 'mc-6', type: 'multiple_choice', category: 'members' as any, question: 'Q6', options: ['A','B','C','D'], answer: 'Bill Wyman', points: 10 },
      // fb-dup also answers "Mick Taylor" — should not appear if mc-dup-1 was picked
      { id: 'fb-dup', type: 'fill_blank', category: 'members' as any, question: 'Q?', answer: 'Mick Taylor', points: 10 },
      { id: 'fb-2', type: 'fill_blank', category: 'members' as any, question: 'Q?', answer: 'Brian Jones', points: 10 },
    ]
    for (let i = 0; i < 30; i++) {
      const result = selectQuestions(dedupPool, 7, { members: 1 })
      const answers = result.map(q => q.answer.toLowerCase().trim())
      expect(new Set(answers).size).toBe(answers.length)
    }
  })

  it('includes image questions in the MC slots', () => {
    const poolWithImage: Question[] = [
      ...Array.from({ length: 5 }, (_, i) => makeMC(`mc-${i}`, 'albums')),
      makeImage('img-1', 'members'),
      makeFB('fb-1', 'albums'),
      makeFB('fb-2', 'members'),
    ]
    const results = Array.from({ length: 20 }, () =>
      selectQuestions(poolWithImage, 7, { albums: 1, members: 1 })
    )
    const anyImage = results.some(r => r.some(q => q.type === 'image'))
    expect(anyImage).toBe(true)
  })
})

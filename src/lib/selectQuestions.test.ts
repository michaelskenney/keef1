import { describe, it, expect } from 'vitest'
import { selectQuestions } from './selectQuestions'
import type { Question } from '../types'

const makeMC = (id: string, category: string): Question => ({
  id,
  type: 'multiple_choice',
  category: category as any,
  question: 'Q',
  options: ['A', 'B', 'C', 'D'],
  answer: id,   // unique per question — prevents dedup collisions
  points: 10,
})

const makeFB = (id: string, category: string): Question => ({
  id,
  type: 'fill_blank',
  category: category as any,
  question: 'Fill in ___',
  answer: id,
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

// Pool with all required guaranteed-slot types plus extra filler
const pool: Question[] = [
  // lyrics (guaranteed slot)
  makeFB('ly1', 'lyrics'),
  makeFB('ly2', 'lyrics'),
  // album images (guaranteed slot)
  makeImage('ai1', 'albums'),
  makeImage('ai2', 'albums'),
  // member images (guaranteed slot)
  makeImage('mi1', 'members'),
  makeImage('mi2', 'members'),
  // filler for remaining slots
  makeMC('a1', 'albums'),
  makeMC('a2', 'albums'),
  makeMC('m1', 'members'),
  makeMC('m2', 'members'),
  makeMC('t1', 'trivia'),
  makeMC('t2', 'trivia'),
  makeMC('t3', 'trivia'),
  makeFB('fb1', 'albums'),
  makeFB('fb2', 'members'),
]

const weights = { albums: 1, members: 1, trivia: 1, lyrics: 1 }

describe('selectQuestions', () => {
  it('returns the requested number of questions', () => {
    const result = selectQuestions(pool, 10, weights)
    expect(result).toHaveLength(10)
  })

  it('returns no duplicate IDs', () => {
    const result = selectQuestions(pool, 10, weights)
    const ids = result.map(q => q.id)
    expect(new Set(ids).size).toBe(10)
  })

  it('always includes exactly 1 lyrics question', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectQuestions(pool, 10, weights)
      const count = result.filter(q => q.category === 'lyrics').length
      expect(count).toBe(1)
    }
  })

  it('always includes exactly 1 album cover image', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectQuestions(pool, 10, weights)
      const count = result.filter(q => q.type === 'image' && q.category === 'albums').length
      expect(count).toBe(1)
    }
  })

  it('always includes exactly 1 band member image', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectQuestions(pool, 10, weights)
      const count = result.filter(q => q.type === 'image' && q.category === 'members').length
      expect(count).toBe(1)
    }
  })

  it('returns all available questions if pool is smaller than requested count', () => {
    const small: Question[] = [
      makeMC('x1', 'albums'),
      makeMC('x2', 'albums'),
      makeFB('xf1', 'albums'),
    ]
    const result = selectQuestions(small, 10, weights)
    expect(result.length).toBeLessThanOrEqual(small.length)
  })

  it('never selects two questions with the same normalized answer in one round', () => {
    const dedupPool: Question[] = [
      makeFB('ly-1', 'lyrics'),
      makeImage('ai-1', 'albums'),
      makeImage('mi-1', 'members'),
      // members MC with duplicate answers
      { id: 'mc-dup-1', type: 'multiple_choice', category: 'members' as any, question: 'Q1', options: ['A','B','C','D'], answer: 'Mick Taylor', points: 10 },
      { id: 'mc-dup-2', type: 'multiple_choice', category: 'members' as any, question: 'Q2', options: ['A','B','C','D'], answer: 'mick taylor', points: 10 },
      { id: 'mc-3', type: 'multiple_choice', category: 'members' as any, question: 'Q3', options: ['A','B','C','D'], answer: 'Keith Richards', points: 10 },
      { id: 'mc-4', type: 'multiple_choice', category: 'members' as any, question: 'Q4', options: ['A','B','C','D'], answer: 'Charlie Watts', points: 10 },
      { id: 'mc-5', type: 'multiple_choice', category: 'members' as any, question: 'Q5', options: ['A','B','C','D'], answer: 'Ronnie Wood', points: 10 },
      { id: 'mc-6', type: 'multiple_choice', category: 'members' as any, question: 'Q6', options: ['A','B','C','D'], answer: 'Bill Wyman', points: 10 },
      // fb-dup shares answer with mc-dup-1 — should not appear if mc-dup-1 was picked
      { id: 'fb-dup', type: 'fill_blank', category: 'members' as any, question: 'Q?', answer: 'Mick Taylor', points: 10 },
      { id: 'fb-2', type: 'fill_blank', category: 'members' as any, question: 'Q?', answer: 'Brian Jones', points: 10 },
    ]
    for (let i = 0; i < 30; i++) {
      const result = selectQuestions(dedupPool, 7, { members: 1, albums: 1, lyrics: 1 })
      const answers = result.map(q => q.answer.toLowerCase().trim())
      expect(new Set(answers).size).toBe(answers.length)
    }
  })
})

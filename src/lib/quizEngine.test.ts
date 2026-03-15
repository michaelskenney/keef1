import { describe, it, expect } from 'vitest'
import { checkAnswer, countCorrectPositions } from './quizEngine'
import type { Question, TimelineQuestion } from '../types'

const mcQ: Question = {
  id: '1', type: 'multiple_choice', category: 'albums',
  question: 'Q', options: ['A', 'B', 'C', 'D'], answer: 'B', points: 10,
}
const ftQ: Question = {
  id: '2', type: 'free_text', category: 'members',
  question: 'Q', answer: 'Bill Wyman', fuzzy: true, points: 10,
}

describe('checkAnswer', () => {
  it('exact match is correct for multiple choice', () => {
    expect(checkAnswer(mcQ, 'B')).toBe(true)
  })

  it('wrong option is incorrect', () => {
    expect(checkAnswer(mcQ, 'A')).toBe(false)
  })

  it('fuzzy match accepts close spelling', () => {
    expect(checkAnswer(ftQ, 'bil wiman')).toBe(true)
  })

  it('fuzzy match rejects wrong answer', () => {
    expect(checkAnswer(ftQ, 'Mick Jagger')).toBe(false)
  })
})

const tlQ: TimelineQuestion = {
  id: 'tl-1', type: 'timeline', category: 'albums',
  question: 'Order these albums',
  albums: [
    { name: 'Sticky Fingers', year: 1971, image: '/img/a.jpg' },
    { name: 'Exile on Main St.', year: 1972, image: '/img/b.jpg' },
    { name: 'Some Girls', year: 1978, image: '/img/c.jpg' },
  ],
  points: 10,
}

describe('checkAnswer — timeline', () => {
  it('correct order returns true', () => {
    const answer = JSON.stringify(['Sticky Fingers', 'Exile on Main St.', 'Some Girls'])
    expect(checkAnswer(tlQ, answer)).toBe(true)
  })
  it('wrong order returns false', () => {
    const answer = JSON.stringify(['Some Girls', 'Sticky Fingers', 'Exile on Main St.'])
    expect(checkAnswer(tlQ, answer)).toBe(false)
  })
})

describe('countCorrectPositions', () => {
  it('returns 3 when all correct', () => {
    expect(countCorrectPositions(tlQ, JSON.stringify(['Sticky Fingers', 'Exile on Main St.', 'Some Girls']))).toBe(3)
  })
  it('returns 1 when only first correct', () => {
    expect(countCorrectPositions(tlQ, JSON.stringify(['Sticky Fingers', 'Some Girls', 'Exile on Main St.']))).toBe(1)
  })
  it('returns 0 when none correct', () => {
    expect(countCorrectPositions(tlQ, JSON.stringify(['Exile on Main St.', 'Some Girls', 'Sticky Fingers']))).toBe(0)
  })
})

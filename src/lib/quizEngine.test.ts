import { describe, it, expect } from 'vitest'
import { checkAnswer } from './quizEngine'
import type { Question } from '../types'

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

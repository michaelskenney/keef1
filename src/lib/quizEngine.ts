import type { Question } from '../types'
import { fuzzyMatch } from './fuzzyMatch'

export function checkAnswer(question: Question, userAnswer: string): boolean {
  const correct = question.answer
  if (question.fuzzy) {
    return fuzzyMatch(userAnswer, correct)
  }
  return userAnswer.trim().toLowerCase() === correct.trim().toLowerCase()
}

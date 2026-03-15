import type { Question, TimelineQuestion } from '../types'
import { fuzzyMatch } from './fuzzyMatch'

export function checkAnswer(question: Question, userAnswer: string): boolean {
  if (question.type === 'timeline') {
    try {
      const correctOrder = question.albums
        .slice()
        .sort((a, b) => a.year - b.year)
        .map((a) => a.name)
      const userOrder: string[] = JSON.parse(userAnswer)
      return correctOrder.every((name, i) => name === userOrder[i])
    } catch {
      return false
    }
  }

  const correct = question.answer
  if (question.fuzzy) {
    return fuzzyMatch(userAnswer, correct)
  }
  return userAnswer.trim().toLowerCase() === correct.trim().toLowerCase()
}

export function countCorrectPositions(question: TimelineQuestion, userAnswer: string): number {
  try {
    const correctOrder = question.albums
      .slice()
      .sort((a, b) => a.year - b.year)
      .map((a) => a.name)
    const userOrder: string[] = JSON.parse(userAnswer)
    return correctOrder.reduce((count, name, i) => count + (name === userOrder[i] ? 1 : 0), 0)
  } catch {
    return 0
  }
}

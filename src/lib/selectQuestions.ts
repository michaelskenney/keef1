import type { Question } from '../types'

function pickUnique(
  pool: Question[],
  n: number,
  weights: Record<string, number>,
  usedIds: Set<string>,
  usedAnswers: Set<string>
): Question[] {
  const weighted = pool.flatMap(q =>
    Array(weights[q.category] ?? 1).fill(q) as Question[]
  )
  const shuffled = [...weighted].sort(() => Math.random() - 0.5)
  const result: Question[] = []
  for (const q of shuffled) {
    const normAnswer = q.answer.toLowerCase().trim()
    if (!usedIds.has(q.id) && !usedAnswers.has(normAnswer)) {
      result.push(q)
      usedIds.add(q.id)
      usedAnswers.add(normAnswer)
    }
    if (result.length >= n) break
  }
  return result
}

export function selectQuestions(
  pool: Question[],
  count: number,
  weights: Record<string, number>
): Question[] {
  const mcPool = pool.filter(q => q.type === 'multiple_choice' || q.type === 'image')
  const fbPool = pool.filter(q => q.type === 'fill_blank')

  const usedIds = new Set<string>()
  const usedAnswers = new Set<string>()
  const mcQuestions = pickUnique(mcPool, count - 1, weights, usedIds, usedAnswers)
  const fbQuestion = pickUnique(fbPool, 1, weights, usedIds, usedAnswers)

  return [...mcQuestions, ...fbQuestion]
}

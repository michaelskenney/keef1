import type { Question } from '../types'

function pickUnique(
  pool: Question[],
  n: number,
  weights: Record<string, number>,
  exclude: Set<string>
): Question[] {
  const weighted = pool.flatMap(q =>
    Array(weights[q.category] ?? 1).fill(q) as Question[]
  )
  const shuffled = [...weighted].sort(() => Math.random() - 0.5)
  const result: Question[] = []
  for (const q of shuffled) {
    if (!exclude.has(q.id)) {
      result.push(q)
      exclude.add(q.id)
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
  const mcPool = pool.filter(q => q.type === 'multiple_choice')
  const fbPool = pool.filter(q => q.type === 'fill_blank')

  const usedIds = new Set<string>()
  const mcQuestions = pickUnique(mcPool, count - 1, weights, usedIds)
  const fbQuestion = pickUnique(fbPool, 1, weights, usedIds)

  return [...mcQuestions, ...fbQuestion]
}

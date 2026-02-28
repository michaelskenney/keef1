import type { Question } from '../types'

export function selectQuestions(
  pool: Question[],
  count: number,
  weights: Record<string, number>
): Question[] {
  // Build a weighted pool by repeating each question according to its category weight
  const weighted = pool.flatMap(q => Array(weights[q.category] ?? 1).fill(q) as Question[])

  const selected: Question[] = []
  const usedIds = new Set<string>()

  const shuffled = [...weighted].sort(() => Math.random() - 0.5)

  for (const q of shuffled) {
    if (!usedIds.has(q.id)) {
      selected.push(q)
      usedIds.add(q.id)
    }
    if (selected.length >= count) break
  }

  return selected
}

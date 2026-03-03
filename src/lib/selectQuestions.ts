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
  const usedIds = new Set<string>()
  const usedAnswers = new Set<string>()

  // Guaranteed slots: 1 lyrics, 1 album cover image, 1 band member image
  const lyricsQ = pickUnique(
    pool.filter(q => q.category === 'lyrics'),
    1, weights, usedIds, usedAnswers
  )
  const albumImageQ = pickUnique(
    pool.filter(q => q.type === 'image' && q.category === 'albums'),
    1, weights, usedIds, usedAnswers
  )
  const memberImageQ = pickUnique(
    pool.filter(q => q.type === 'image' && q.category === 'members'),
    1, weights, usedIds, usedAnswers
  )

  const guaranteed = [...lyricsQ, ...albumImageQ, ...memberImageQ]
  const remaining = count - guaranteed.length
  // Exclude any question qualifying for a guaranteed slot to keep the counts exact
  const restQ = pickUnique(
    pool.filter(q =>
      !usedIds.has(q.id) &&
      q.category !== 'lyrics' &&
      !(q.type === 'image' && q.category === 'albums') &&
      !(q.type === 'image' && q.category === 'members')
    ),
    remaining, weights, usedIds, usedAnswers
  )

  return [...guaranteed, ...restQ]
}

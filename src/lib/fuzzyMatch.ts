import Fuse from 'fuse.js'

export function fuzzyMatch(userAnswer: string, correctAnswer: string): boolean {
  const fuse = new Fuse([correctAnswer], {
    threshold: 0.4,
    includeScore: true,
    isCaseSensitive: false,
  })
  const results = fuse.search(userAnswer.trim())
  return results.length > 0 && (results[0].score ?? 1) < 0.4
}

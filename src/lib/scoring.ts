export function calcScore(
  correct: boolean,
  timeRemaining: number,
  totalTime: number,
  basePoints: number,
  maxBonus: number
): number {
  if (!correct || timeRemaining <= 0) return 0
  const bonus = Math.floor((timeRemaining / totalTime) * maxBonus)
  return basePoints + bonus
}

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

export function calcTimelineScore(
  correctPositions: number,
  totalPositions: number,
  timeRemaining: number,
  totalTime: number,
  basePoints: number,
  maxBonus: number
): number {
  if (correctPositions <= 0 || timeRemaining <= 0) return 0
  const perPosition = Math.floor(basePoints / totalPositions)
  const base = correctPositions * perPosition
  const speedBonus = Math.floor(
    (correctPositions / totalPositions) * (timeRemaining / totalTime) * maxBonus
  )
  return base + speedBonus
}

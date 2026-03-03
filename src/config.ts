export const CONFIG = {
  questionsPerRound: 10,
  secondsPerQuestion: 30,
  basePoints: 10,
  maxSpeedBonus: 5,
  feedbackDurationMs: 1500,
  categoryWeights: {
    albums: 1,
    members: 1,
    lyrics: 1,
    trivia: 1,
  } as Record<string, number>,
}

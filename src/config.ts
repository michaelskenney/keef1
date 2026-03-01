export const CONFIG = {
  questionsPerRound: 7,
  secondsPerQuestion: 30,
  basePoints: 10,
  maxSpeedBonus: 5,
  feedbackDurationMs: 1500,
  categoryWeights: {
    albums: 1,
    members: 1,
    lyrics: 0,
    trivia: 1,
  } as Record<string, number>,
}

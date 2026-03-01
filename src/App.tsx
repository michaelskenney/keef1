import { useState, useEffect } from 'react'
import type { Screen, Question, AnsweredQuestion, LeaderboardEntry } from './types'
import { CONFIG } from './config'
import { selectQuestions } from './lib/selectQuestions'
import { submitScore, fetchLeaderboard } from './lib/leaderboard'
import { HomeScreen } from './components/HomeScreen'
import { QuizScreen } from './components/QuizScreen'
import { EndScreen } from './components/EndScreen'
import { LeaderboardScreen } from './components/LeaderboardScreen'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [nickname, setNickname] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<AnsweredQuestion[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [weekLabel, setWeekLabel] = useState('')
  const [lbLoading, setLbLoading] = useState(false)

  useEffect(() => {
    fetch('/questions.json')
      .then(r => r.json())
      .then(setAllQuestions)
  }, [])

  function startQuiz(name: string) {
    setNickname(name)
    const selected = selectQuestions(allQuestions, CONFIG.questionsPerRound, CONFIG.categoryWeights)
    setQuestions(selected)
    setScreen('quiz')
  }

  function handleQuizComplete(quizResults: AnsweredQuestion[]) {
    setResults(quizResults)
    setScreen('end')
  }

  async function handleSubmitScore() {
    const totalScore = results.reduce((s, r) => s + r.pointsEarned, 0)
    const maxScore = results.length * (CONFIG.basePoints + CONFIG.maxSpeedBonus)
    await submitScore({
      nickname,
      score: totalScore,
      max_score: maxScore,
      questions: results.length,
      correct: results.filter(r => r.correct).length,
    })
    await loadLeaderboard()
  }

  async function loadLeaderboard() {
    setLbLoading(true)
    setScreen('leaderboard')
    const { entries, weekLabel: label } = await fetchLeaderboard()
    setLeaderboard(entries)
    setWeekLabel(label)
    setLbLoading(false)
  }

  function playAgain() {
    setScreen('home')
    setResults([])
  }

  return (
    <>
      {screen === 'home' && (
        <HomeScreen onStart={startQuiz} onLeaderboard={loadLeaderboard} />
      )}
      {screen === 'quiz' && (
        <QuizScreen questions={questions} onComplete={handleQuizComplete} />
      )}
      {screen === 'end' && (
        <EndScreen
          results={results}
          nickname={nickname}
          onSubmit={handleSubmitScore}
          onPlayAgain={playAgain}
        />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen
          entries={leaderboard}
          currentNickname={nickname || null}
          loading={lbLoading}
          weekLabel={weekLabel}
          onPlayAgain={playAgain}
        />
      )}
    </>
  )
}

import { useState, useEffect, useCallback } from 'react'
import type { Question, AnsweredQuestion } from '../types'
import { CONFIG } from '../config'
import { checkAnswer } from '../lib/quizEngine'
import { calcScore } from '../lib/scoring'
import { TimerBar } from './TimerBar'
import { QuestionCard } from './QuestionCard'

interface Props {
  questions: Question[]
  onComplete: (results: AnsweredQuestion[]) => void
}

export function QuizScreen({ questions, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(CONFIG.secondsPerQuestion)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<AnsweredQuestion[]>([])
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number } | null>(null)

  const currentQuestion = questions[index]
  const totalScore = results.reduce((sum, r) => sum + r.pointsEarned, 0)

  const handleAnswer = useCallback((userAnswer: string) => {
    if (answered) return
    setAnswered(true)

    const correct = checkAnswer(currentQuestion, userAnswer)
    const points = calcScore(
      correct,
      timeRemaining,
      CONFIG.secondsPerQuestion,
      CONFIG.basePoints,
      CONFIG.maxSpeedBonus
    )

    const result: AnsweredQuestion = {
      question: currentQuestion,
      userAnswer,
      correct,
      pointsEarned: points,
      timeRemaining,
    }

    setLastResult({ correct, points })

    setTimeout(() => {
      const newResults = [...results, result]
      if (index + 1 >= questions.length) {
        onComplete(newResults)
      } else {
        setResults(newResults)
        setIndex(i => i + 1)
        setTimeRemaining(CONFIG.secondsPerQuestion)
        setAnswered(false)
        setLastResult(null)
      }
    }, CONFIG.feedbackDurationMs)
  }, [answered, currentQuestion, timeRemaining, results, index, questions.length, onComplete])

  // Timer
  useEffect(() => {
    if (answered) return
    if (timeRemaining <= 0) {
      handleAnswer('')
      return
    }
    const id = setTimeout(() => setTimeRemaining(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timeRemaining, answered, handleAnswer])

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {index + 1} / {questions.length}
        </span>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--red)' }}>
          {totalScore} pts
        </span>
      </div>

      <TimerBar timeRemaining={timeRemaining} totalTime={CONFIG.secondsPerQuestion} />

      <QuestionCard key={currentQuestion.id} question={currentQuestion} onAnswer={handleAnswer} disabled={answered} />

      {lastResult && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', zIndex: 10,
        }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 64 }}>{lastResult.correct ? '✓' : '✗'}</div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginTop: 8 }}>
              {lastResult.correct ? `+${lastResult.points} pts` : `Correct: ${currentQuestion.answer}`}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

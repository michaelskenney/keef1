import type { AnsweredQuestion } from '../types'
import { CONFIG } from '../config'

interface Props {
  results: AnsweredQuestion[]
  nickname: string
  onSubmit: () => void
  onPlayAgain: () => void
}

export function EndScreen({ results, nickname, onSubmit, onPlayAgain }: Props) {
  const totalScore = results.reduce((s, r) => s + r.pointsEarned, 0)
  const maxScore = results.length * (CONFIG.basePoints + CONFIG.maxSpeedBonus)
  const correctCount = results.filter(r => r.correct).length

  return (
    <div className="screen">
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900 }}>
        Nice work, {nickname}!
      </h2>

      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: 'var(--red)', lineHeight: 1 }}>
          {totalScore}
        </div>
        <div style={{ color: 'var(--muted)', marginTop: 4 }}>out of {maxScore} pts</div>
        <div style={{ marginTop: 8 }}>{correctCount} / {results.length} correct</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <button className="btn-primary" onClick={onSubmit}>
          Submit to Leaderboard
        </button>
        <button className="btn-secondary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 10, color: 'var(--muted)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
          Breakdown
        </h3>
        {results.map((r, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid var(--mid)',
            fontSize: 14,
          }}>
            <div style={{ flex: 1, marginRight: 12, color: r.correct ? 'var(--light)' : 'var(--muted)' }}>
              {r.question.question.length > 50
                ? r.question.question.slice(0, 50) + '…'
                : r.question.question}
            </div>
            <div style={{ color: r.correct ? 'var(--red)' : 'var(--muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {r.correct ? `+${r.pointsEarned}` : '✗'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

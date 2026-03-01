import type { LeaderboardEntry } from '../types'

interface Props {
  entries: LeaderboardEntry[]
  currentNickname: string | null
  loading: boolean
  onPlayAgain: () => void
  weekLabel: string
}

export function LeaderboardScreen({ entries, currentNickname, loading, onPlayAgain, weekLabel }: Props) {
  return (
    <div className="screen">
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900 }}>Leaderboard</h2>
      {weekLabel && (
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: -4 }}>
          High scores for the week of {weekLabel}
        </p>
      )}

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : (
        <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((entry, i) => {
            const isMe = entry.nickname === currentNickname
            return (
              <li
                key={entry.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', background: 'var(--dark)', borderRadius: 'var(--radius)',
                  border: `2px solid ${isMe ? 'var(--red)' : 'transparent'}`,
                }}
              >
                <span style={{ color: 'var(--muted)', fontWeight: 700, minWidth: 24 }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontWeight: isMe ? 700 : 400 }}>{entry.nickname}</span>
                <span style={{ fontWeight: 700, color: 'var(--red)' }}>{entry.score}</span>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {entry.correct}/{entry.questions}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <button className="btn-primary" onClick={onPlayAgain} style={{ marginTop: 'auto' }}>
        Play Again
      </button>
    </div>
  )
}

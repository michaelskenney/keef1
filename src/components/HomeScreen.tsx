import { useState } from 'react'

interface Props {
  onStart: (nickname: string) => void
  onLeaderboard: () => void
}

export function HomeScreen({ onStart, onLeaderboard }: Props) {
  const [nickname, setNickname] = useState('')

  function handlePlay() {
    const trimmed = nickname.trim()
    if (!trimmed) return
    onStart(trimmed)
  }

  return (
    <div className="screen" style={{ justifyContent: 'center', gap: 32 }}>
      <div>
        <h1 className="app-title">THE<br /><span>ROLLING</span><br />STONES<br />QUIZ</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Your nickname"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePlay()}
          maxLength={30}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
        />
        <button className="btn-primary" onClick={handlePlay}>
          Play
        </button>
        <button className="btn-secondary" onClick={onLeaderboard}>
          Leaderboard
        </button>
      </div>
    </div>
  )
}

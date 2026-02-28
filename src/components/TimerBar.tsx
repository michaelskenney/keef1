interface Props {
  timeRemaining: number
  totalTime: number
}

export function TimerBar({ timeRemaining, totalTime }: Props) {
  const pct = (timeRemaining / totalTime) * 100
  const color = pct > 50 ? 'var(--red)' : pct > 25 ? '#ff8800' : '#ff2200'

  return (
    <div style={{ background: 'var(--mid)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div
        role="progressbar"
        aria-valuenow={timeRemaining}
        aria-valuemin={0}
        aria-valuemax={totalTime}
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          transition: 'width 0.25s linear, background 0.5s ease',
        }}
      />
    </div>
  )
}

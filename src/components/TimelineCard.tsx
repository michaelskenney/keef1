import { useState, useEffect } from 'react'
import type { TimelineAlbum, TimelineQuestion } from '../types'

interface Props {
  question: TimelineQuestion
  onAnswer: (answer: string) => void
  disabled: boolean
}

export function TimelineCard({ question, onAnswer, disabled }: Props) {
  const [items, setItems] = useState<TimelineAlbum[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  useEffect(() => {
    const shuffled = [...question.albums].sort(() => Math.random() - 0.5)
    setItems(shuffled)
  }, [question])

  function handleDragStart(index: number) {
    if (disabled) return
    setDragIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setOverIndex(index)
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    const updated = [...items]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(index, 0, moved)
    setItems(updated)
    setDragIndex(null)
    setOverIndex(null)
  }

  function handleLockIn() {
    const order = items.map(a => a.name)
    onAnswer(JSON.stringify(order))
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const updated = [...items]
    ;[updated[index], updated[target]] = [updated[target], updated[index]]
    setItems(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, lineHeight: 1.4 }}>
        {question.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((album, i) => (
          <div
            key={album.name}
            draggable={!disabled}
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              background: overIndex === i ? 'var(--red)' : 'var(--mid)',
              borderRadius: 8,
              cursor: disabled ? 'default' : 'grab',
              opacity: dragIndex === i ? 0.5 : 1,
              transition: 'background 0.15s',
              touchAction: 'none',
            }}
          >
            <span style={{ color: 'var(--muted)', fontSize: 14, minWidth: 20 }}>{i + 1}.</span>
            <img
              src={album.image}
              alt={album.name}
              style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover' }}
            />
            <span style={{ flex: 1, fontWeight: 600 }}>{album.name}</span>
            {!disabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${album.name} up`}
                  style={{
                    background: 'none', border: 'none', color: 'var(--light)',
                    cursor: i === 0 ? 'default' : 'pointer', fontSize: 16, padding: '0 4px',
                    opacity: i === 0 ? 0.3 : 1,
                  }}
                >&#9650;</button>
                <button
                  onClick={() => moveItem(i, 1)}
                  disabled={i === items.length - 1}
                  aria-label={`Move ${album.name} down`}
                  style={{
                    background: 'none', border: 'none', color: 'var(--light)',
                    cursor: i === items.length - 1 ? 'default' : 'pointer', fontSize: 16, padding: '0 4px',
                    opacity: i === items.length - 1 ? 0.3 : 1,
                  }}
                >&#9660;</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        onClick={handleLockIn}
        disabled={disabled}
      >
        Lock In
      </button>
    </div>
  )
}

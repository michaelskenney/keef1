import { useState } from 'react'
import type { Question } from '../types'

interface Props {
  question: Question
  onAnswer: (answer: string) => void
  disabled: boolean
}

export function QuestionCard({ question, onAnswer, disabled }: Props) {
  const [textInput, setTextInput] = useState('')

  function handleTextSubmit() {
    if (!textInput.trim()) return
    onAnswer(textInput.trim())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {question.type === 'image' && (
        <img
          src={question.image}
          alt="Question"
          style={{ width: '100%', borderRadius: 8, maxHeight: 240, objectFit: 'cover' }}
        />
      )}

      <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, lineHeight: 1.4 }}>
        {question.question}
      </p>

      {(question.type === 'multiple_choice' || question.type === 'image') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {question.options.map(opt => (
            <button
              key={opt}
              className="btn-secondary"
              onClick={() => onAnswer(opt)}
              disabled={disabled}
              style={{ textAlign: 'left', padding: '0 16px' }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {(question.type === 'fill_blank' || question.type === 'free_text') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !disabled && handleTextSubmit()}
            disabled={disabled}
            autoComplete="off"
            autoCorrect="off"
            placeholder="Your answer"
          />
          <button
            className="btn-primary"
            onClick={handleTextSubmit}
            disabled={disabled || !textInput.trim()}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}

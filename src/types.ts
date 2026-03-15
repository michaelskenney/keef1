export type QuestionType = 'multiple_choice' | 'fill_blank' | 'free_text' | 'image' | 'timeline'
export type Category = 'albums' | 'members' | 'lyrics' | 'trivia'

export interface BaseQuestion {
  id: string
  type: QuestionType
  category: Category
  question: string
  answer: string
  points: number
  fuzzy?: boolean
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice'
  options: string[]
}

export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill_blank'
}

export interface FreeTextQuestion extends BaseQuestion {
  type: 'free_text'
  fuzzy: boolean
}

export interface ImageQuestion extends BaseQuestion {
  type: 'image'
  image: string
  options: string[]
}

export interface TimelineAlbum {
  name: string
  year: number
  image: string
}

export interface TimelineQuestion {
  id: string
  type: 'timeline'
  category: Category
  question: string
  albums: TimelineAlbum[]
  points: number
}

export type Question =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | FreeTextQuestion
  | ImageQuestion
  | TimelineQuestion

export interface AnsweredQuestion {
  question: Question
  userAnswer: string
  correct: boolean
  pointsEarned: number
  timeRemaining: number
}

export interface LeaderboardEntry {
  id: string
  nickname: string
  score: number
  max_score: number
  questions: number
  correct: number
  played_at: string
}

export type Screen = 'home' | 'quiz' | 'feedback' | 'end' | 'leaderboard'

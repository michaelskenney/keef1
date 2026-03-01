# Questions Expansion — Design

**Date:** 2026-03-01

## Goal

Expand `public/questions.json` from 75 to 250 questions, add lyrics (fill_blank) and image (multiple_choice) categories, re-enable lyrics in round selection, and prevent duplicate answers within a single 7-question round.

---

## Question Distribution

| Category | Current | Add | Final |
|----------|---------|-----|-------|
| albums   | 25      | 32  | 57    |
| members  | 25      | 31  | 56    |
| lyrics   | 0       | 56  | 56    |
| trivia   | 25      | 31  | 56    |
| image    | 0       | 25  | 25    |
| **Total**| **75**  | **175** | **250** |

---

## New Question Types

### Lyrics (fill_blank)
All 56 lyrics questions are `fill_blank` type. Example schema:
```json
{
  "id": "fb-lyr-001",
  "type": "fill_blank",
  "category": "lyrics",
  "difficulty": "easy",
  "question": "Complete the lyric: 'I can't get no ___'",
  "answer": "satisfaction",
  "points": 10
}
```

### Image (multiple_choice)
All 25 image questions are `multiple_choice` type with an `image` field containing a Wikimedia Commons URL. Subjects: band members, album covers, concert moments. No instrument identification.
```json
{
  "id": "img-mem-001",
  "type": "image",
  "category": "members",
  "difficulty": "easy",
  "question": "Who is pictured here?",
  "image": "https://upload.wikimedia.org/wikipedia/commons/...",
  "options": ["Mick Jagger", "Keith Richards", "Ronnie Wood", "Charlie Watts"],
  "answer": "Keith Richards",
  "points": 10
}
```

---

## Dedup Logic

In `selectQuestions.ts`, a `usedAnswers: Set<string>` accumulates normalized answers (`answer.toLowerCase().trim()`) as questions are picked. Both the MC pool and fill_blank pool check against the same set — a candidate is skipped if its normalized answer is already in `usedAnswers`.

No changes to `questions.json` schema — operates entirely on the existing `answer` field.

---

## Image Rendering

In `QuestionCard.tsx`, add a branch for `question.type === 'image'` that renders the image (from `question.image`) above the question text, followed by the standard 4-option multiple choice buttons. No new components. `image` type and `image: string` field already exist in `types.ts`.

---

## Config

Set `categoryWeights.lyrics = 1` in `src/config.ts` to re-enable lyrics in round selection.

---

## Out of Scope

- Instrument identification in image questions
- Automated fact-checking
- Any changes to existing 75 questions

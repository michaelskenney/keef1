# Rolling Stones Quiz — Questions Generation Design

**Date:** 2026-02-28
**Status:** Approved

---

## Overview

Generate 100 Rolling Stones trivia questions for `public/questions.json` using AI-generated batches reviewed by the curator. Questions are sourced from Wikipedia, iorr.org, and Reddit r/rollingstones.

---

## Distribution

100 questions across 4 categories, 25 each:

| Category | Count | Coverage |
|----------|-------|----------|
| `lyrics` | 25 | Fill-in-the-blank and free text from song lyrics |
| `albums` | 25 | Release dates, track listings, chart positions, recording history |
| `members` | 25 | Band members past and present, roles, instruments, backstory |
| `trivia` | 25 | Tours, controversies, collaborators, cultural moments, arcana |

**Question type distribution per batch of 25:**

| Type | Count |
|------|-------|
| `multiple_choice` | 12 |
| `fill_blank` | 8 |
| `free_text` | 5 |

**Difficulty spread per batch:** ~8 easy / ~12 medium / ~5 hard.

---

## Sources

| Batch | Primary Sources |
|-------|----------------|
| lyrics | Wikipedia (band/albums), iorr.org |
| albums | Wikipedia (band/albums), iorr.org |
| members | Wikipedia (Mick Jagger, Keith Richards, Charlie Watts, Ronnie Wood) |
| trivia | Reddit r/rollingstones, iorr.org, Wikipedia |

**Source URLs:**
- https://en.wikipedia.org/wiki/The_Rolling_Stones
- https://en.wikipedia.org/wiki/Mick_Jagger
- https://en.wikipedia.org/wiki/Keith_Richards
- https://en.wikipedia.org/wiki/Charlie_Watts
- https://en.wikipedia.org/wiki/Ronnie_Wood
- https://www.reddit.com/r/rollingstones/
- https://iorr.org/

---

## Question Schema

```json
{
  "id": "mc-alb-001",
  "type": "multiple_choice | fill_blank | free_text | image",
  "category": "albums | members | lyrics | trivia",
  "difficulty": "easy | medium | hard",
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "answer": "...",
  "fuzzy": true,
  "points": 10,
  "source": "https://..."
}
```

Notes:
- `options` only present for `multiple_choice`
- `fuzzy` only present (and `true`) for `free_text` and `fill_blank`
- `source` enables curator fact-checking during review

**ID convention:** `{type-prefix}-{category-prefix}-{3-digit-number}`
- Type prefixes: `mc` (multiple_choice), `fb` (fill_blank), `ft` (free_text), `img` (image)
- Category prefixes: `alb`, `mem`, `lyr`, `tri`

---

## Review Workflow

1. Fetch relevant sources for the batch category
2. Generate 25 questions as a JSON array
3. Curator reviews — removes, corrects, or requests replacements
4. Apply edits, confirm final batch
5. Proceed to next category
6. After all 4 batches, assemble final `public/questions.json` and commit

---

## Out of Scope

- Image questions (require sourcing photos — future work)
- Questions beyond 100 (future expansion batches)
- Automated fact-checking

# Questions Generation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate 100 Rolling Stones trivia questions across 4 categories and assemble them into `public/questions.json`.

**Architecture:** Four review batches of 25 questions each (lyrics → albums → members → trivia). Each batch is fetched from primary sources, generated, reviewed by the curator, edited, and committed before moving on. Final task assembles all batches into the complete questions file.

**Tech Stack:** WebFetch (source reading), JSON, git.

---

## Task 1: Generate lyrics batch (25 questions)

**Files:**
- Create: `docs/questions/batch-lyrics.json`

**Step 1: Fetch lyrics/song sources**

Fetch these URLs and extract song titles, notable lyrics, and lyric trivia:
- https://en.wikipedia.org/wiki/The_Rolling_Stones
- https://iorr.org/

**Step 2: Generate 25 lyrics questions**

Generate a JSON array of 25 questions following the schema below. Mix:
- 12 `multiple_choice`
- 8 `fill_blank`
- 5 `free_text`

Spread: ~8 easy, ~12 medium, ~5 hard.

Schema:
```json
{
  "id": "fb-lyr-001",
  "type": "fill_blank",
  "category": "lyrics",
  "difficulty": "easy",
  "question": "Complete the lyric: 'I can't get no ___'",
  "answer": "satisfaction",
  "fuzzy": true,
  "points": 10,
  "source": "https://en.wikipedia.org/wiki/..."
}
```

**Step 3: Save to `docs/questions/batch-lyrics.json`**

**Step 4: Curator reviews**

Present the 25 questions clearly. Wait for the curator to respond with:
- Questions to remove
- Corrections to apply
- Replacements needed

**Step 5: Apply edits and confirm**

Make all requested changes. Re-present any modified questions for confirmation.

**Step 6: Commit**

```bash
git add docs/questions/batch-lyrics.json
git commit -m "content: add lyrics question batch (25 questions)"
```

---

## Task 2: Generate albums batch (25 questions)

**Files:**
- Create: `docs/questions/batch-albums.json`

**Step 1: Fetch album sources**

Fetch these URLs and extract album titles, release dates, track listings, chart positions, and recording history:
- https://en.wikipedia.org/wiki/The_Rolling_Stones
- https://iorr.org/

**Step 2: Generate 25 albums questions**

Generate a JSON array of 25 questions. Mix:
- 12 `multiple_choice`
- 8 `fill_blank`
- 5 `free_text`

Spread: ~8 easy, ~12 medium, ~5 hard.

**Step 3: Save to `docs/questions/batch-albums.json`**

**Step 4: Curator reviews**

Present the 25 questions. Wait for curator feedback.

**Step 5: Apply edits and confirm**

**Step 6: Commit**

```bash
git add docs/questions/batch-albums.json
git commit -m "content: add albums question batch (25 questions)"
```

---

## Task 3: Generate members batch (25 questions)

**Files:**
- Create: `docs/questions/batch-members.json`

**Step 1: Fetch member sources**

Fetch these URLs and extract biographical facts, instrument details, joining/departure dates, and personal history:
- https://en.wikipedia.org/wiki/Mick_Jagger
- https://en.wikipedia.org/wiki/Keith_Richards
- https://en.wikipedia.org/wiki/Charlie_Watts
- https://en.wikipedia.org/wiki/Ronnie_Wood

**Step 2: Generate 25 members questions**

Generate a JSON array of 25 questions. Mix:
- 12 `multiple_choice`
- 8 `fill_blank`
- 5 `free_text`

Spread: ~8 easy, ~12 medium, ~5 hard. Cover all four members proportionally; include Brian Jones and Mick Taylor where relevant.

**Step 3: Save to `docs/questions/batch-members.json`**

**Step 4: Curator reviews**

Present the 25 questions. Wait for curator feedback.

**Step 5: Apply edits and confirm**

**Step 6: Commit**

```bash
git add docs/questions/batch-members.json
git commit -m "content: add members question batch (25 questions)"
```

---

## Task 4: Generate trivia batch (25 questions)

**Files:**
- Create: `docs/questions/batch-trivia.json`

**Step 1: Fetch trivia sources**

Fetch these URLs and extract tour facts, controversies, notable collaborations, cultural moments, and arcana:
- https://en.wikipedia.org/wiki/The_Rolling_Stones
- https://www.reddit.com/r/rollingstones/
- https://iorr.org/

**Step 2: Generate 25 trivia questions**

Generate a JSON array of 25 questions. Mix:
- 12 `multiple_choice`
- 8 `fill_blank`
- 5 `free_text`

Spread: ~8 easy, ~12 medium, ~5 hard. Lean into obscure/arcane facts for the hard questions — this is where fans separate themselves.

**Step 3: Save to `docs/questions/batch-trivia.json`**

**Step 4: Curator reviews**

Present the 25 questions. Wait for curator feedback.

**Step 5: Apply edits and confirm**

**Step 6: Commit**

```bash
git add docs/questions/batch-trivia.json
git commit -m "content: add trivia question batch (25 questions)"
```

---

## Task 5: Assemble final questions.json

**Files:**
- Create: `public/questions.json`

**Step 1: Merge all four batch files**

Combine `batch-lyrics.json`, `batch-albums.json`, `batch-members.json`, and `batch-trivia.json` into a single JSON array in `public/questions.json`. Preserve all fields. Ensure no duplicate IDs.

**Step 2: Verify count and distribution**

Confirm:
- Total questions: 100
- Per category: 25 each
- No duplicate IDs

**Step 3: Commit**

```bash
git add public/questions.json
git commit -m "content: assemble final 100-question questions.json"
```

**Step 4: (Optional) Remove batch files**

The batch files in `docs/questions/` can be kept as source-of-truth references or removed — curator's preference.

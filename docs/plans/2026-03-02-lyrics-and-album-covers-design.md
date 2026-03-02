# Design: Lyrics Questions and Album Cover Image Questions

## Context

Two new content types to add to the Rolling Stones quiz:
1. **20 fill-in-the-blank lyrics questions** (category: `lyrics`)
2. **15 album cover image questions** (category: `albums`)

Both use manually provided content — lyrics in a text file, album art saved to a folder. Python scripts convert the raw content into `questions.json` entries.

## Lyrics Questions

### Input format

`scripts/lyrics.txt` — one question per block, blank line between questions:

```
lyric: She said her name was [Billie Jean] and she was fresh
answer: Billie Jean

lyric: I'll never be your [beast of burden]
answer: beast of burden
```

The text in `[brackets]` is the missing word/phrase. The `answer:` line must match exactly.

### Output

- Type: `fill_blank`, category: `lyrics`
- Question text: lyric with `[...]` replaced by `___`
- Answer: text from brackets (matched case-insensitively)
- IDs: `lyrics-01`, `lyrics-02`, ... (continues from any existing lyrics questions)
- Script: `scripts/parse_lyrics.py`

### Example output entry

```json
{
  "id": "lyrics-01",
  "type": "fill_blank",
  "category": "lyrics",
  "question": "She said her name was ___ and she was fresh",
  "answer": "Billie Jean",
  "points": 10
}
```

## Album Cover Image Questions

### Input format

`public/images/albums/` — images saved by the user in kebab-case matching the album title:

- `let-it-bleed.jpg` → "Let It Bleed"
- `exile-on-main-st.jpg` → "Exile on Main St"
- `sticky-fingers.jpg` → "Sticky Fingers"

Filename → album name conversion: kebab-case to title case.

### Output

- Type: `image`, category: `albums`
- Question text: "Which Rolling Stones album is this?"
- Options: 4 album names — the correct one + 3 distractors from a built-in pool of ~25 Rolling Stones albums hardcoded in the script
- Distractors rotate per question index so each image gets a different set
- IDs: `img-album-01`, `img-album-02`, ...
- Script: `scripts/parse_album_covers.py`

### Example output entry

```json
{
  "id": "img-album-01",
  "type": "image",
  "category": "albums",
  "question": "Which Rolling Stones album is this?",
  "image": "/images/albums/let-it-bleed.jpg",
  "options": ["Beggars Banquet", "Exile on Main St", "Let It Bleed", "Sticky Fingers"],
  "answer": "Let It Bleed",
  "points": 10
}
```

## Both Scripts — Shared Behaviour

- Run from repo root: `python3 scripts/parse_lyrics.py` / `python3 scripts/parse_album_covers.py`
- Output written to a review file (`public/images/question-stubs.json` or `scripts/lyrics-stubs.json`) before merging
- Merge step appends stubs to `questions.json` after user review
- ID collision check prevents duplicates on re-runs
- No new frontend dependencies needed

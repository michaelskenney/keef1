# Design: Image Questions — Band Member Identification

## Context

The image question type is fully implemented in code (`QuestionCard.tsx`, `selectQuestions.ts`) but no image questions exist in `questions.json` and there is no `public/images/` directory. This design adds 25 band member identification questions sourced from Wikimedia Commons.

## Decision: Members Only (No Album Covers)

Rolling Stones album covers are copyrighted commercial artwork and are not available on Wikimedia Commons under free licenses. They appear on Wikipedia English only under fair use, which Wikimedia Commons does not permit. All 25 image questions will therefore be band member photos.

## Question Distribution

25 questions across 9 members, all category `members`:

| Member | Photos | Notes |
|---|---|---|
| Mick Jagger | 5 | Lead vocals |
| Keith Richards | 5 | Guitar |
| Ron Wood | 3 | Guitar, joined 1975 |
| Charlie Watts | 3 | Drums |
| Bill Wyman | 2 | Bass, left 1993 |
| Brian Jones | 2 | Founder, early era only |
| Mick Taylor | 2 | Guitar, 1969–74 |
| Darryl Jones | 2 | Touring bassist, 1994– |
| Steve Jordan | 1 | Current drummer |

## Question Format

- **Type:** `image`
- **Category:** `members`
- **Question text:** "Who is this Rolling Stone?" (or role-specific variant e.g. "Which Rolling Stones guitarist is pictured?")
- **Options:** 4 MC choices, all Rolling Stones members — no outside distractors
- **Answer:** The member's full name (matching one of the options exactly)

Example:
```json
{
  "id": "img-mick-jagger-01",
  "type": "image",
  "category": "members",
  "question": "Who is this Rolling Stone?",
  "image": "/images/members/mick-jagger-01.jpg",
  "options": ["Mick Jagger", "Keith Richards", "Ron Wood", "Charlie Watts"],
  "answer": "Mick Jagger",
  "points": 10
}
```

## Image Files

- **Source:** Wikimedia Commons, CC-licensed concert and press photos
- **Directory:** `public/images/members/`
- **Naming:** `<firstname-lastname>-<nn>.jpg` (e.g. `mick-jagger-01.jpg`)
- **Size target:** Resize/crop to max 600px wide to keep bundle small

## Attribution

A sidecar file `public/images/attribution.json` records provenance for each image, required by CC licenses:

```json
{
  "mick-jagger-01.jpg": {
    "original_filename": "Jagger_live_Italy_2003.JPG",
    "author": "Example Author",
    "license": "CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/wiki/File:Jagger_live_Italy_2003.JPG"
  }
}
```

## Implementation Approach

A Python script (`scripts/fetch_images.py`) will:
1. Query the Wikimedia Commons API to find candidate files per member
2. Display candidates with preview URLs for manual selection
3. Download approved images into `public/images/members/`
4. Resize images to max 600px wide (requires Pillow)
5. Generate question JSON stubs and attribution entries

The generated stubs are appended to `public/questions.json` after manual review.

## Dependencies

- Python 3 with `requests` and `Pillow`
- No new frontend dependencies

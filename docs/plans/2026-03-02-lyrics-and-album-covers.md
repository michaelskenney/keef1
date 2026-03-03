# Lyrics and Album Covers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 8 fill-in-the-blank lyrics questions and 15 album cover image questions to `public/questions.json` using two Python parsing scripts.

**Architecture:** Two single-purpose scripts read user-provided content (`scripts/lyrics.txt` and `public/images/albums/`) and generate question stub JSON files for review. A separate merge step appends reviewed stubs to `questions.json`. Both scripts are re-runnable — they detect existing questions and continue numbering from where they left off.

**Tech Stack:** Python 3.9+, stdlib only (no new dependencies).

---

### Task 1: Write `scripts/parse_lyrics.py`

**Files:**
- Create: `scripts/parse_lyrics.py`

**Step 1: Write the script**

Create `scripts/parse_lyrics.py`:

```python
#!/usr/bin/env python3
"""
Parse scripts/lyrics.txt and generate fill_blank question stubs.

Usage: python3 scripts/parse_lyrics.py
Output: scripts/lyrics-stubs.json  (review, then merge into public/questions.json)

lyrics.txt format (one question per blank-line-separated block):
    Lyric: the police in [New York City] they chased a boy
    answer: New York City
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
LYRICS_FILE = REPO_ROOT / "scripts" / "lyrics.txt"
STUBS_FILE = REPO_ROOT / "scripts" / "lyrics-stubs.json"
QUESTIONS_FILE = REPO_ROOT / "public" / "questions.json"


def parse_lyrics_file(path: Path) -> list[dict]:
    """Parse lyrics.txt into list of {lyric, answer} dicts."""
    blocks = []
    current: dict = {}

    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            if current:
                blocks.append(current)
                current = {}
            continue
        if re.match(r"^lyrics?:", line, re.IGNORECASE):
            current["lyric"] = re.sub(r"^lyrics?:\s*", "", line, flags=re.IGNORECASE)
        elif re.match(r"^answer:", line, re.IGNORECASE):
            current["answer"] = re.sub(r"^answer:\s*", "", line, flags=re.IGNORECASE)

    if current:
        blocks.append(current)

    return [b for b in blocks if "lyric" in b and "answer" in b]


def make_question(lyric: str, answer: str, index: int) -> dict:
    """Convert a lyric+answer into a fill_blank question dict."""
    question_text = re.sub(r"\[.*?\]", "___", lyric)
    return {
        "id": f"lyrics-{index:02d}",
        "type": "fill_blank",
        "category": "lyrics",
        "question": question_text,
        "answer": answer,
        "points": 10,
    }


def get_next_index(questions_file: Path) -> int:
    """Find the next available lyrics question index."""
    if not questions_file.exists():
        return 1
    questions = json.loads(questions_file.read_text())
    nums = []
    for q in questions:
        if q.get("category") == "lyrics":
            m = re.search(r"\d+$", q.get("id", ""))
            if m:
                nums.append(int(m.group()))
    return max(nums) + 1 if nums else 1


def main() -> None:
    if not LYRICS_FILE.exists():
        print(f"Not found: {LYRICS_FILE}")
        sys.exit(1)

    parsed = parse_lyrics_file(LYRICS_FILE)
    if not parsed:
        print("No questions found in lyrics.txt — check the format.")
        sys.exit(1)

    start_index = get_next_index(QUESTIONS_FILE)
    stubs = [make_question(item["lyric"], item["answer"], start_index + i)
             for i, item in enumerate(parsed)]

    STUBS_FILE.write_text(json.dumps(stubs, indent=2))
    print(f"✓ {len(stubs)} stubs → {STUBS_FILE}")
    for s in stubs:
        print(f"  {s['id']}: {s['question'][:70]}")


if __name__ == "__main__":
    main()
```

**Step 2: Verify syntax**

```bash
python3 -c "import ast; ast.parse(open('/users/msk/new-project/scripts/parse_lyrics.py').read()); print('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
cd /users/msk/new-project
git add scripts/parse_lyrics.py
git commit -m "feat: add parse_lyrics.py script"
```

---

### Task 2: Run `parse_lyrics.py`, review stubs, merge

**Files:**
- Modify: `public/questions.json`

**Step 1: Run the script**

```bash
cd /users/msk/new-project
python3 scripts/parse_lyrics.py
```

Expected output: 8 stubs listed with their IDs and truncated question text.

**Step 2: Review the stubs**

```bash
python3 -c "
import json
stubs = json.load(open('scripts/lyrics-stubs.json'))
for s in stubs:
    print(s['id'], '|', s['question'])
    print('  answer:', s['answer'])
"
```

Check each stub:
- `[...]` in lyric replaced with `___` in question text
- `answer` matches the bracketed text from lyrics.txt
- IDs are sequential starting from `lyrics-01`
- No duplicate IDs

**Step 3: Merge into questions.json**

```bash
cd /users/msk/new-project
python3 - <<'EOF'
import json
from pathlib import Path

q_path = Path("public/questions.json")
s_path = Path("scripts/lyrics-stubs.json")

questions = json.loads(q_path.read_text())
stubs = json.loads(s_path.read_text())

existing_ids = {q["id"] for q in questions}
for s in stubs:
    assert s["id"] not in existing_ids, f"Duplicate ID: {s['id']}"

questions.extend(stubs)
q_path.write_text(json.dumps(questions, indent=2) + "\n")
print(f"✓ Merged {len(stubs)} lyrics stubs. Total: {len(questions)}")
EOF
```

Expected: `✓ Merged 8 lyrics stubs. Total: 202`

**Step 4: Delete stubs file and commit**

```bash
cd /users/msk/new-project
rm scripts/lyrics-stubs.json
git add public/questions.json
git commit -m "content: add 8 fill-in-the-blank lyrics questions"
```

---

### Task 3: Write `scripts/parse_album_covers.py`

**Files:**
- Create: `scripts/parse_album_covers.py`

**Step 1: Write the script**

Create `scripts/parse_album_covers.py`:

```python
#!/usr/bin/env python3
"""
Parse public/images/albums/ and generate image question stubs for album covers.

Usage: python3 scripts/parse_album_covers.py
Output: scripts/album-stubs.json  (review, then merge into public/questions.json)

Image naming: kebab-case album title, e.g. let-it-bleed.png, sticky-fingers.png
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
ALBUMS_DIR = REPO_ROOT / "public" / "images" / "albums"
STUBS_FILE = REPO_ROOT / "scripts" / "album-stubs.json"
QUESTIONS_FILE = REPO_ROOT / "public" / "questions.json"

# Full distractor pool — all major Rolling Stones studio albums
ALBUM_POOL = [
    "Aftermath",
    "Beggars Banquet",
    "Between the Buttons",
    "Black and Blue",
    "Bridges to Babylon",
    "December's Children",
    "Dirty Work",
    "Emotional Rescue",
    "Exile on Main St",
    "Get Yer Ya-Ya's Out!",
    "Goat's Head Soup",
    "It's Only Rock and Roll",
    "Let It Bleed",
    "Love You Live",
    "Out of Our Heads",
    "Some Girls",
    "Steel Wheels",
    "Sticky Fingers",
    "Tattoo You",
    "Their Satanic Majesties Request",
    "Through the Past, Darkly",
    "Undercover",
    "Voodoo Lounge",
]

# Manual overrides for stems that don't title-case cleanly
STEM_OVERRIDES: dict[str, str] = {
    "goats-head-soup": "Goat's Head Soup",
    "its-only-rock-and-roll": "It's Only Rock and Roll",
    "exile-on-main-st": "Exile on Main St",
    "their-satanic-majesties-request": "Their Satanic Majesties Request",
    "get-yer-ya-yas-out": "Get Yer Ya-Ya's Out!",
    "decembers-children": "December's Children",
}


def stem_to_album_name(stem: str) -> str:
    """Convert a kebab-case filename stem to a Rolling Stones album title."""
    # Strip surrounding quotes (shell may add them for filenames with apostrophes)
    stem = stem.strip("\"'")
    # Normalize: remove apostrophes for lookup key
    key = re.sub(r"[''']", "", stem.lower())
    if key in STEM_OVERRIDES:
        return STEM_OVERRIDES[key]
    return " ".join(word.capitalize() for word in stem.replace("-", " ").split())


def make_stub(album_name: str, filename: str, index: int) -> dict:
    others = [a for a in ALBUM_POOL if a != album_name]
    offset = ((index - 1) * 3) % len(others)
    distractors = (others[offset:] + others[:offset])[:3]
    return {
        "id": f"img-album-{index:02d}",
        "type": "image",
        "category": "albums",
        "question": "Which Rolling Stones album is this?",
        "image": f"/images/albums/{filename}",
        "options": sorted([album_name] + distractors),
        "answer": album_name,
        "points": 10,
    }


def get_next_index(questions_file: Path) -> int:
    if not questions_file.exists():
        return 1
    questions = json.loads(questions_file.read_text())
    nums = []
    for q in questions:
        if re.match(r"img-album-\d+$", q.get("id", "")):
            m = re.search(r"\d+$", q["id"])
            if m:
                nums.append(int(m.group()))
    return max(nums) + 1 if nums else 1


def main() -> None:
    images = sorted(
        p for p in ALBUMS_DIR.iterdir()
        if p.suffix.lower() in (".jpg", ".jpeg", ".png") and not p.name.startswith(".")
    )
    if not images:
        print(f"No images found in {ALBUMS_DIR}")
        sys.exit(1)

    start_index = get_next_index(QUESTIONS_FILE)
    stubs = []
    warnings = []

    for i, img in enumerate(images, start=start_index):
        album_name = stem_to_album_name(img.stem)
        if album_name not in ALBUM_POOL:
            warnings.append(f"  ⚠ '{img.stem}' → '{album_name}' not in ALBUM_POOL — add it to the pool or fix the filename")
        stubs.append(make_stub(album_name, img.name, i))
        print(f"  {img.name} → {album_name}")

    STUBS_FILE.write_text(json.dumps(stubs, indent=2))
    print(f"\n✓ {len(stubs)} stubs → {STUBS_FILE}")
    if warnings:
        print()
        for w in warnings:
            print(w)


if __name__ == "__main__":
    main()
```

**Step 2: Verify syntax**

```bash
python3 -c "import ast; ast.parse(open('/users/msk/new-project/scripts/parse_album_covers.py').read()); print('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
cd /users/msk/new-project
git add scripts/parse_album_covers.py
git commit -m "feat: add parse_album_covers.py script"
```

---

### Task 4: Run `parse_album_covers.py`, review stubs, merge

**Files:**
- Modify: `public/questions.json`

**Step 1: Run the script**

```bash
cd /users/msk/new-project
python3 scripts/parse_album_covers.py
```

Expected: 15 lines mapping each filename to an album name, then `✓ 15 stubs → scripts/album-stubs.json`. Any `⚠` warnings mean a filename didn't map to a known album — investigate and fix before merging.

**Step 2: Review the stubs**

```bash
python3 -c "
import json
stubs = json.load(open('scripts/album-stubs.json'))
for s in stubs:
    print(s['id'], '|', s['answer'])
    print('  options:', s['options'])
    print('  image:', s['image'])
"
```

Check each stub:
- `answer` is the correct album name (not a distorted version of the filename)
- `answer` appears in `options`
- `options` has exactly 4 entries
- `image` path matches the actual filename in `public/images/albums/`

**Step 3: Merge into questions.json**

```bash
cd /users/msk/new-project
python3 - <<'EOF'
import json
from pathlib import Path

q_path = Path("public/questions.json")
s_path = Path("scripts/album-stubs.json")

questions = json.loads(q_path.read_text())
stubs = json.loads(s_path.read_text())

existing_ids = {q["id"] for q in questions}
for s in stubs:
    assert s["id"] not in existing_ids, f"Duplicate ID: {s['id']}"

questions.extend(stubs)
q_path.write_text(json.dumps(questions, indent=2) + "\n")
print(f"✓ Merged {len(stubs)} album stubs. Total: {len(questions)}")
EOF
```

Expected: `✓ Merged 15 album stubs. Total: 217`

**Step 4: Delete stubs file and commit**

```bash
cd /users/msk/new-project
rm scripts/album-stubs.json
git add public/images/albums/ public/questions.json
git commit -m "content: add 15 album cover image questions"
```

---

### Task 5: Run tests and verify

**Step 1: Run the full test suite**

```bash
cd /users/msk/new-project
npm test
```

Expected: `✓ 90 tests passed` — no new tests needed, changes are content-only.

**Step 2: Spot-check in dev server**

```bash
cd /users/msk/new-project
npm run dev
```

Open http://localhost:5173, play a round, and verify:
- Lyrics questions appear as fill-in-the-blank with `___` in the question text
- Album cover questions appear with the image and 4 album name buttons
- Both question types score correctly

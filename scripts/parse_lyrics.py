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

    valid = [b for b in blocks if "lyric" in b and "answer" in b]
    skipped = len(blocks) - len(valid)
    if skipped:
        print(f"Warning: {skipped} block(s) skipped (missing lyric: or answer: field)")
    return valid


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

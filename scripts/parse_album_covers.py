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
    "between-the-buttons": "Between the Buttons",
    "black-and-blue": "Black and Blue",
    "bridges-to-babylon": "Bridges to Babylon",
}


def stem_to_album_name(stem: str) -> str:
    """Convert a kebab-case filename stem to a Rolling Stones album title."""
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
    if not isinstance(questions, list):
        print(f"Error: {questions_file} must be a JSON array at the top level.")
        sys.exit(1)
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

#!/usr/bin/env python3
"""
Generate timeline questions for the Rolling Stones quiz.
Each question asks the player to order 3 albums by release year.

Usage:
    python3 scripts/generate_timelines.py
    Outputs JSON to stdout. Redirect to a file, review, then merge into questions.json.
"""
import json
import itertools
import random

# Studio albums with release years
ALBUMS = [
    ("The Rolling Stones", 1964),
    ("12 X 5", 1964),
    ("The Rolling Stones No. 2", 1965),
    ("Out of Our Heads", 1965),
    ("Aftermath", 1966),
    ("Between the Buttons", 1967),
    ("Their Satanic Majesties Request", 1967),
    ("Beggars Banquet", 1968),
    ("Let It Bleed", 1969),
    ("Sticky Fingers", 1971),
    ("Exile on Main St.", 1972),
    ("Goats Head Soup", 1973),
    ("It's Only Rock 'n Roll", 1974),
    ("Black and Blue", 1976),
    ("Some Girls", 1978),
    ("Emotional Rescue", 1980),
    ("Tattoo You", 1981),
    ("Undercover", 1983),
    ("Dirty Work", 1986),
    ("Steel Wheels", 1989),
    ("Voodoo Lounge", 1994),
    ("Bridges to Babylon", 1997),
    ("A Bigger Bang", 2005),
    ("Blue & Lonesome", 2016),
    ("Hackney Diamonds", 2023),
]


def generate_questions(count: int = 15) -> list[dict]:
    # Only pick trios where all 3 years are distinct (no ties)
    combos = [
        c for c in itertools.combinations(ALBUMS, 3)
        if len(set(y for _, y in c)) == 3
    ]
    random.seed(42)  # Reproducible output
    random.shuffle(combos)
    questions = []
    for i, trio in enumerate(combos[:count], start=1):
        sorted_trio = sorted(trio, key=lambda x: x[1])
        questions.append({
            "id": f"tl-{i:03d}",
            "type": "timeline",
            "category": "albums",
            "question": "Put these albums in order of release (earliest first)",
            "albums": [
                {
                    "name": name,
                    "year": year,
                    "image": f"/images/albums/{name.lower().replace(' ', '-').replace(chr(39), '').replace('.', '')}.jpg"
                }
                for name, year in sorted_trio
            ],
            "points": 10,
        })
    return questions


if __name__ == "__main__":
    qs = generate_questions(15)
    print(json.dumps(qs, indent=2))

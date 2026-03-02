#!/usr/bin/env python3
"""
Fetch Rolling Stones band member photos from Wikimedia Commons.
Downloads images, resizes to max 600px wide, generates question stubs.

Usage:
    pip install requests Pillow
    python3 scripts/fetch_images.py
"""

from __future__ import annotations
import io
import json
import sys
from pathlib import Path

try:
    import requests
    from PIL import Image
except ImportError:
    print("Missing dependencies. Run: pip install requests Pillow")
    sys.exit(1)

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
REPO_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = REPO_ROOT / "public" / "images" / "members"
ATTRIBUTION_FILE = REPO_ROOT / "public" / "images" / "attribution.json"
STUBS_FILE = REPO_ROOT / "public" / "images" / "question-stubs.json"

HEADERS = {"User-Agent": "RollingStonesQuiz/1.0 (educational; contact: quiz@example.com)"}

MEMBERS = [
    {"name": "Mick Jagger",    "slug": "mick-jagger",    "count": 5, "query": "Mick Jagger Rolling Stones concert"},
    {"name": "Keith Richards", "slug": "keith-richards", "count": 5, "query": "Keith Richards Rolling Stones concert"},
    {"name": "Ron Wood",       "slug": "ron-wood",       "count": 3, "query": "Ron Wood Rolling Stones concert"},
    {"name": "Charlie Watts",  "slug": "charlie-watts",  "count": 3, "query": "Charlie Watts Rolling Stones drums"},
    {"name": "Bill Wyman",     "slug": "bill-wyman",     "count": 2, "query": "Bill Wyman Rolling Stones bass"},
    {"name": "Brian Jones",    "slug": "brian-jones",    "count": 2, "query": "Brian Jones Rolling Stones"},
    {"name": "Mick Taylor",    "slug": "mick-taylor",    "count": 2, "query": "Mick Taylor Rolling Stones guitar"},
    {"name": "Darryl Jones",   "slug": "darryl-jones",   "count": 2, "query": "Darryl Jones Rolling Stones bass"},
    {"name": "Steve Jordan",   "slug": "steve-jordan",   "count": 1, "query": "Steve Jordan Rolling Stones drums"},
]


def search_commons(query: str, limit: int = 20) -> list[dict]:
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srnamespace": "6",
        "srlimit": str(limit),
        "format": "json",
    }
    r = requests.get(COMMONS_API, params=params, headers=HEADERS, timeout=15)
    r.raise_for_status()
    return r.json()["query"]["search"]


def get_file_info(title: str) -> dict | None:
    params = {
        "action": "query",
        "titles": title,
        "prop": "imageinfo",
        "iiprop": "url|user|extmetadata",
        "iiurlwidth": "300",
        "format": "json",
    }
    r = requests.get(COMMONS_API, params=params, headers=HEADERS, timeout=15)
    r.raise_for_status()
    pages = r.json()["query"]["pages"]
    page = next(iter(pages.values()))
    if "imageinfo" not in page:
        return None
    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    license_name = meta.get("LicenseShortName", {}).get("value", "")
    # Skip unknown or clearly non-free licenses
    if not license_name or "copyright" in license_name.lower():
        return None
    return {
        "title": title,
        "url": info["url"],
        "thumb": info.get("thumburl", info["url"]),
        "author": meta.get("Artist", {}).get("value", info.get("user", "Unknown"))[:80],
        "license": license_name,
        "license_url": meta.get("LicenseUrl", {}).get("value", ""),
        "source": f"https://commons.wikimedia.org/wiki/{title.replace(' ', '_')}",
    }


def download_and_resize(url: str, dest: Path, max_width: int = 600) -> None:
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    img = Image.open(io.BytesIO(r.content))
    if img.width > max_width:
        ratio = max_width / img.width
        img = img.resize((max_width, int(img.height * ratio)), Image.LANCZOS)
    img = img.convert("RGB")
    img.save(dest, "JPEG", quality=85)


def make_question_stub(member: dict, filename: str, index: int) -> dict:
    others = [m["name"] for m in MEMBERS if m["name"] != member["name"]]
    # Rotate distractor offset so each image gets a different set of wrong answers
    offset = ((index - 1) * 3) % len(others)
    distractors = (others[offset:] + others[:offset])[:3]
    options = sorted([member["name"]] + distractors)
    return {
        "id": f"img-{member['slug']}-{index:02d}",
        "type": "image",
        "category": "members",
        "question": "Who is this Rolling Stone?",
        "image": f"/images/members/{filename}",
        "options": options,
        "answer": member["name"],
        "points": 10,
    }


def process_member(member: dict, start_index: int = 1) -> tuple[list[dict], dict]:
    print(f"\n{'=' * 60}")
    print(f"  {member['name']}  —  need {member['count']} photo(s)")
    print(f"{'=' * 60}")

    try:
        results = search_commons(member["query"])
    except Exception as e:
        print(f"  Search failed: {e}")
        return [], {}

    candidates = []
    print("  Fetching file info for candidates...")
    for r in results[:15]:
        try:
            info = get_file_info(r["title"])
            if info:
                candidates.append(info)
        except Exception:
            continue

    if not candidates:
        print("  No freely-licensed candidates found. Skipping.")
        return [], {}

    print(f"\n  {len(candidates)} candidates:\n")
    for i, c in enumerate(candidates):
        print(f"  [{i + 1:2d}] {c['title']}")
        print(f"       License : {c['license']}")
        print(f"       Author  : {c['author']}")
        print(f"       Preview : {c['thumb']}")
        print()

    raw = input(f"  Pick {member['count']} number(s) separated by spaces (or Enter to skip): ").strip()
    if not raw:
        print("  Skipped.")
        return [], {}

    indices = []
    for x in raw.split():
        if x.isdigit():
            idx = int(x) - 1
            if 0 <= idx < len(candidates):
                indices.append(idx)

    stubs = []
    new_attribution = {}

    for download_num, idx in enumerate(indices, start=start_index):
        c = candidates[idx]
        filename = f"{member['slug']}-{download_num:02d}.jpg"
        dest = OUTPUT_DIR / filename
        print(f"  Downloading → {filename} ...")
        try:
            download_and_resize(c["url"], dest)
            print(f"  ✓ Saved {dest} ({dest.stat().st_size // 1024}KB)")
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            continue

        new_attribution[filename] = {
            "original_filename": c["title"].replace("File:", ""),
            "author": c["author"],
            "license": c["license"],
            "license_url": c["license_url"],
            "source": c["source"],
        }
        stubs.append(make_question_stub(member, filename, download_num))

    return stubs, new_attribution


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    attribution: dict = {}
    if ATTRIBUTION_FILE.exists():
        with open(ATTRIBUTION_FILE) as f:
            attribution = json.load(f)

    all_stubs: list[dict] = []
    if STUBS_FILE.exists():
        with open(STUBS_FILE) as f:
            all_stubs = json.load(f)

    for member in MEMBERS:
        existing_count = sum(1 for s in all_stubs if s["answer"] == member["name"])
        stubs, new_attr = process_member(member, start_index=existing_count + 1)
        all_stubs.extend(stubs)
        attribution.update(new_attr)

    with open(ATTRIBUTION_FILE, "w") as f:
        json.dump(attribution, f, indent=2)
    print(f"\n✓ Attribution saved → {ATTRIBUTION_FILE}")

    with open(STUBS_FILE, "w") as f:
        json.dump(all_stubs, f, indent=2)
    print(f"✓ Question stubs saved → {STUBS_FILE}")
    print(f"\n  Generated {len(all_stubs)} stubs. Review then run Task 4 to merge into questions.json.")


if __name__ == "__main__":
    main()

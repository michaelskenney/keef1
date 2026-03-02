# Image Questions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 25 band member identification image questions sourced from Wikimedia Commons, using the existing image question infrastructure.

**Architecture:** A Python script queries the Wikimedia Commons API, lets the user interactively pick photos for each member, downloads and resizes them, then generates question JSON stubs. The stubs are reviewed and appended to `questions.json`. No frontend code changes needed — image questions are already fully implemented.

**Tech Stack:** Python 3, `requests`, `Pillow`; existing Vite/React frontend unchanged.

---

### Task 1: Scaffold directories and attribution file

**Files:**
- Create: `public/images/members/.gitkeep`
- Create: `public/images/attribution.json`

**Step 1: Create the images directory**

```bash
mkdir -p /users/msk/new-project/public/images/members
touch /users/msk/new-project/public/images/members/.gitkeep
```

**Step 2: Create the attribution scaffold**

Create `public/images/attribution.json`:
```json
{}
```

**Step 3: Commit**

```bash
cd /users/msk/new-project
git add public/images/members/.gitkeep public/images/attribution.json
git commit -m "chore: scaffold public/images directory with attribution file"
```

---

### Task 2: Write `scripts/fetch_images.py`

**Files:**
- Create: `scripts/fetch_images.py`

**Step 1: Create the scripts directory and write the script**

Create `scripts/fetch_images.py`:

```python
#!/usr/bin/env python3
"""
Fetch Rolling Stones band member photos from Wikimedia Commons.
Downloads images, resizes to max 600px wide, generates question stubs.

Usage:
    pip install requests Pillow
    python3 scripts/fetch_images.py
"""

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


def process_member(member: dict) -> tuple[list[dict], dict]:
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

    for download_num, idx in enumerate(indices, start=1):
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

    for member in MEMBERS:
        stubs, new_attr = process_member(member)
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
```

**Step 2: Commit**

```bash
cd /users/msk/new-project
git add scripts/fetch_images.py
git commit -m "feat: add Wikimedia Commons image fetch script"
```

---

### Task 3: Run the script interactively

> **Note:** This task requires user participation. For each band member, the script lists candidate images with preview URLs. Open the preview URLs in a browser to evaluate photos, then enter the numbers of photos you want to download.

**Step 1: Install dependencies**

```bash
pip install requests Pillow
```

Expected: installs without errors.

**Step 2: Run the script**

```bash
cd /users/msk/new-project
python3 scripts/fetch_images.py
```

For each member the script will print numbered candidates with preview URLs and license info. Open the preview URLs in your browser, then type the numbers of the photos you want (space-separated).

Target counts per member:
- Mick Jagger: 5, Keith Richards: 5, Ron Wood: 3, Charlie Watts: 3
- Bill Wyman: 2, Brian Jones: 2, Mick Taylor: 2, Darryl Jones: 2
- Steve Jordan: 1

**Step 3: Verify downloads**

```bash
ls -lh /users/msk/new-project/public/images/members/
```

Expected: ~25 `.jpg` files, each under ~150KB.

```bash
cat /users/msk/new-project/public/images/attribution.json | python3 -m json.tool | head -30
```

Expected: valid JSON with entries for each downloaded file.

---

### Task 4: Review and merge stubs into `questions.json`

**Files:**
- Modify: `public/questions.json`
- Delete: `public/images/question-stubs.json`

**Step 1: Review the stubs**

```bash
cat /users/msk/new-project/public/images/question-stubs.json | python3 -m json.tool
```

Check each stub:
- `image` path matches a file in `public/images/members/`
- `answer` matches exactly one entry in `options`
- `options` has exactly 4 entries, all Rolling Stones member names
- `id` is unique

**Step 2: Merge stubs into questions.json**

```bash
cd /users/msk/new-project
python3 - <<'EOF'
import json
from pathlib import Path

questions_path = Path("public/questions.json")
stubs_path = Path("public/images/question-stubs.json")

questions = json.loads(questions_path.read_text())
stubs = json.loads(stubs_path.read_text())

# Verify no ID collisions
existing_ids = {q["id"] for q in questions}
for stub in stubs:
    assert stub["id"] not in existing_ids, f"Duplicate ID: {stub['id']}"

questions.extend(stubs)
questions_path.write_text(json.dumps(questions, indent=2) + "\n")
print(f"✓ Merged {len(stubs)} stubs. Total questions: {len(questions)}")
EOF
```

Expected output: `✓ Merged 25 stubs. Total questions: 194`

**Step 3: Verify the merged file**

```bash
cd /users/msk/new-project
cat public/questions.json | python3 -c "
import json, sys
q = json.load(sys.stdin)
imgs = [x for x in q if x.get('type') == 'image']
print(f'Total: {len(q)}')
print(f'Image: {len(imgs)}')
members = {}
for x in imgs:
    members[x['answer']] = members.get(x['answer'], 0) + 1
for name, count in sorted(members.items()):
    print(f'  {name}: {count}')
"
```

Expected: 25 image questions distributed across 9 members.

**Step 4: Delete the stubs temp file**

```bash
rm /users/msk/new-project/public/images/question-stubs.json
```

**Step 5: Commit**

```bash
cd /users/msk/new-project
git add public/images/members/ public/images/attribution.json public/questions.json
git rm public/images/question-stubs.json 2>/dev/null || true
git commit -m "content: add 25 band member image questions with Wikimedia Commons photos"
```

---

### Task 5: Run tests and verify

**Step 1: Run the full test suite**

```bash
cd /users/msk/new-project
npm test
```

Expected:
```
✓ 22 test files
✓ 90 tests passed
```

All existing tests should pass without modification — the new questions are content only, no code changed.

**Step 2: Spot-check in the dev server**

```bash
cd /users/msk/new-project
npm run dev
```

Open the app, start a quiz, and verify:
- Image questions appear with the photo visible
- 4 answer buttons are shown
- Selecting an answer works normally

**Step 3: Final commit if any fixes were needed**

If you had to fix anything in questions.json during spot-check:

```bash
cd /users/msk/new-project
git add public/questions.json public/images/attribution.json
git commit -m "fix: correct image question options after spot-check"
```

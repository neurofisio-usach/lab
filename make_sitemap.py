#!/usr/bin/env python3
"""
Generate sitemap.xml for https://neurofisio-usach.cl from the HTML files in this repo.

Usage (from the repo root):
    python make_sitemap.py

Re-run it whenever you add, rename or delete pages, then commit sitemap.xml.
"""
import subprocess
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape

BASE_URL = "https://neurofisio-usach.cl"
REPO = Path(__file__).resolve().parent

# Pages to leave out of the sitemap (paths relative to repo root, e.g. "falan/draft.html").
EXCLUDE = {
    "404.html",
}
SKIP_DIRS = {".git", "node_modules", ".ipynb_checkpoints"}


def last_modified(path: Path) -> str:
    """Date of the last git commit touching the file; falls back to file mtime."""
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", str(path)],
            cwd=REPO, capture_output=True, text=True, check=True,
        ).stdout.strip()
        if out:
            return out
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).date().isoformat()


def page_url(rel: Path) -> str:
    """index.html -> folder URL; everything else -> its own URL."""
    parts = list(rel.parts)
    if parts[-1] == "index.html":
        parts = parts[:-1]
        path = "/".join(quote(p) for p in parts)
        return f"{BASE_URL}/{path}/" if path else f"{BASE_URL}/"
    return f"{BASE_URL}/" + "/".join(quote(p) for p in parts)


def main() -> None:
    pages = []
    for f in REPO.rglob("*.html"):
        rel = f.relative_to(REPO)
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        if rel.as_posix() in EXCLUDE:
            continue
        if rel.name.startswith("google") and len(rel.parts) == 1:  # Search Console verification file
            continue
        pages.append(rel)

    # Warn about names that differ only in upper/lower case (e.g. stats.html vs Stats.html)
    by_lower = defaultdict(list)
    for rel in pages:
        by_lower[rel.as_posix().lower()].append(rel.as_posix())
    for names in by_lower.values():
        if len(names) > 1:
            print(f"WARNING: case-duplicate pages: {', '.join(sorted(names))}")

    # Homepage first, then alphabetical
    pages.sort(key=lambda p: (p.as_posix() != "index.html", p.as_posix().lower()))

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for rel in pages:
        lines += [
            "  <url>",
            f"    <loc>{escape(page_url(rel))}</loc>",
            f"    <lastmod>{last_modified(REPO / rel)}</lastmod>",
            "  </url>",
        ]
    lines.append("</urlset>")

    (REPO / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"sitemap.xml written with {len(pages)} pages")


if __name__ == "__main__":
    main()

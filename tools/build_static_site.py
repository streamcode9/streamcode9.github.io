#!/usr/bin/env python3
"""Convert legacy Jekyll markdown posts into a static site.

The script copies posts from the deprecated `_posts` directory into
`content/posts` without front matter, generates HTML shells that load the
markdown client-side, and creates a `data/posts.json` index used by list pages.
"""
from __future__ import annotations

import ast
import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[1]
POSTS_SRC = ROOT / "_posts"
POSTS_DST = ROOT / "content" / "posts"
DATA_DIR = ROOT / "data"


@dataclass
class Post:
    slug: str
    date: datetime
    categories: List[str]
    tags: List[str]
    title: str
    markdown: str
    url: str
    excerpt: str
    source_name: str

    @property
    def date_str(self) -> str:
        return self.date.strftime("%Y-%m-%d")

    @property
    def output_dir(self) -> Path:
        return ROOT / self.date.strftime("%Y/%m/%d")

    @property
    def html_filename(self) -> str:
        return f"{self.slug}.html"

    @property
    def md_filename(self) -> str:
        return f"{self.source_name}"


_FRONT_MATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or value.lower()


def _parse_front_matter(raw: str) -> (Dict[str, object], str):
    if not raw.startswith("---\n"):
        return {}, raw

    match = _FRONT_MATTER_RE.match(raw)
    if not match:
        # malformed front matter – fall back to raw content
        return {}, raw

    fm_text = match.group(1)
    content = raw[match.end():]
    data: Dict[str, object] = {}
    for line in fm_text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            try:
                data[key] = list(ast.literal_eval(value))
            except Exception:
                inner = value[1:-1].strip()
                if inner:
                    data[key] = [item.strip() for item in inner.split(",") if item.strip()]
                else:
                    data[key] = []
        else:
            data[key] = value
    return data, content.lstrip("\n")


def _slug_to_title(slug: str) -> str:
    cleaned = slug.replace("-", " ")
    return cleaned.replace("  ", " ").strip().title()


def _create_excerpt(markdown: str) -> str:
    # take first non-empty line, strip markdown characters for brevity
    for line in markdown.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        # remove simple markdown syntax
        stripped = re.sub(r"^[#>*`-]+\s*", "", stripped)
        stripped = re.sub(r"\*\*(.*?)\*\*", r"\\1", stripped)
        stripped = re.sub(r"\[(.*?)\]\((.*?)\)", r"\\1", stripped)
        if stripped:
            return stripped[:160]
    return ""


def _load_from_jekyll() -> List[Post]:
    posts: List[Post] = []
    for path in sorted(POSTS_SRC.glob("*.md")):
        stem = path.stem  # YYYY-MM-DD-sample
        if len(stem) < 11 or stem[4] != "-" or stem[7] != "-":
            print(f"Skipping unexpected filename: {path.name}")
            continue
        date_part = stem[:10]
        slug = stem[11:]
        if not slug:
            slug = "post"
        try:
            date = datetime.strptime(date_part, "%Y-%m-%d")
        except ValueError:
            print(f"Invalid date in filename: {path.name}")
            continue

        raw = path.read_text(encoding="utf-8")
        metadata, markdown = _parse_front_matter(raw)
        categories = metadata.get("categories") or []
        if isinstance(categories, str):
            categories = [categories]
        tags = metadata.get("tags") or []
        if isinstance(tags, str):
            tags = [tags]
        title = metadata.get("title") or _slug_to_title(slug)
        excerpt = _create_excerpt(markdown)

        url = f"/{date.strftime('%Y/%m/%d')}/{slug}.html"

        posts.append(
            Post(
                slug=slug,
                date=date,
                categories=list(categories),
                tags=list(tags),
                title=str(title),
                markdown=markdown.rstrip() + "\n",
                url=url,
                excerpt=excerpt,
                source_name=path.name,
            )
        )
    posts.sort(key=lambda p: p.date, reverse=True)
    return posts


def _load_from_static() -> List[Post]:
    json_path = DATA_DIR / "posts.json"
    if not json_path.exists():
        raise SystemExit("No posts.json found")
    posts: List[Post] = []
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    for entry in payload:
        date = datetime.strptime(entry["date"], "%Y-%m-%d")
        url = entry["url"]
        slug = Path(url).stem
        md_name = f"{date.strftime('%Y-%m-%d')}-{slug}.md"
        md_path = POSTS_DST / md_name
        if not md_path.exists():
            raise SystemExit(f"Missing markdown file for {url}")
        markdown = md_path.read_text(encoding="utf-8")
        posts.append(
            Post(
                slug=slug,
                date=date,
                categories=list(entry.get("categories", [])),
                tags=list(entry.get("tags", [])),
                title=entry["title"],
                markdown=markdown,
                url=url,
                excerpt=entry.get("excerpt", ""),
                source_name=md_name,
            )
        )
    return posts


def load_posts() -> List[Post]:
    if POSTS_SRC.exists():
        return _load_from_jekyll()
    return _load_from_static()


def write_markdown(post: Post) -> None:
    POSTS_DST.mkdir(parents=True, exist_ok=True)
    target = POSTS_DST / post.md_filename
    target.write_text(post.markdown, encoding="utf-8")


def write_html_shell(post: Post) -> None:
    output_dir = post.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    html_path = output_dir / post.html_filename
    category_links = [
        f'<li><a href="/pages/categories.html#category-{_slugify(c)}">{c}</a></li>'
        for c in post.categories
    ]
    categories_html = "".join(category_links)
    tags_html = "".join(f"<li>{t}</li>" for t in post.tags)
    html = f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>{post.title} · Streamcode9</title>
  <link rel=\"stylesheet\" href=\"/assets/site.css\" />
</head>
<body data-md-source=\"/content/posts/{post.md_filename}\">
  <header class=\"site-header\">
    <nav>
      <a href=\"/index.html\">Home</a>
      <a href=\"/pages/blog.html\">Blog</a>
      <a href=\"/pages/categories.html\">Categories</a>
    </nav>
  </header>
  <main class=\"post\">
    <h1>{post.title}</h1>
    <p class=\"post-meta\">Published {post.date.strftime('%B %d, %Y')}</p>
    {'<ul class="post-categories">' + categories_html + '</ul>' if categories_html else ''}
    {'<ul class="post-tags">' + tags_html + '</ul>' if tags_html else ''}
    <article id=\"post-body\" aria-live=\"polite\">Loading…</article>
  </main>
  <footer class=\"site-footer\">
    <small>&copy; {datetime.now().year} Streamcode9</small>
  </footer>
  <script src=\"https://cdn.jsdelivr.net/npm/marked/marked.min.js\"></script>
  <script src=\"/assets/js/post.js\" type=\"module\"></script>
</body>
</html>
"""
    html_path.write_text(html, encoding="utf-8")


def write_posts_index(posts: List[Post]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = [
        {
            "title": post.title,
            "date": post.date_str,
            "url": post.url,
            "categories": post.categories,
            "tags": post.tags,
            "excerpt": post.excerpt,
        }
        for post in posts
    ]
    (DATA_DIR / "posts.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    posts = load_posts()
    for post in posts:
        write_markdown(post)
        write_html_shell(post)
    write_posts_index(posts)
    print(f"Generated {len(posts)} posts")


if __name__ == "__main__":
    main()

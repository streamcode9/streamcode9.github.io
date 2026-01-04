#!/usr/bin/env python3
"""Generate Atom feed from blog posts."""

import re
from pathlib import Path
from datetime import datetime
import xml.etree.ElementTree as ET

# Base URL for the site
BASE_URL = "https://streamcode9.github.io"

# List of blog posts from blog.html (in reverse chronological order)
POSTS = [
    ("/2026/01/03/essentials.html", "2026-01-03"),
    ("/2025/08/28/math-countries.html", "2025-08-28"),
    ("/2025/08/25/sushi.html", "2025-08-25"),
    ("/2025/04/05/mltt-72.html", "2025-04-05"),
    ("/2025/04/05/mtg-pauper.html", "2025-04-05"),
    ("/2025/04/05/organizing-knowledge.html", "2025-04-05"),
    ("/2025/04/04/chen.html", "2025-04-04"),
    ("/2025/01/28/hus.html", "2025-01-28"),
    ("/2025/01/06/taijiquan.html", "2025-01-06"),
    ("/2025/01/05/taijiquan-40-levels.html", "2025-01-05"),
    ("/2024/11/05/music-theory.html", "2024-11-05"),
    ("/2024/11/04/zemfira.html", "2024-11-04"),
    ("/2024/07/12/ukulele-2.html", "2024-07-12"),
    ("/2024/07/12/ukulele.html", "2024-07-12"),
    ("/2024/07/11/health.html", "2024-07-11"),
    ("/2024/07/05/bike.html", "2024-07-05"),
    ("/2024/07/04/anime.html", "2024-07-04"),
    ("/2024/07/03/art.html", "2024-07-03"),
    ("/2024/07/02/music.html", "2024-07-02"),
    ("/2024/07/01/origami.html", "2024-07-01"),
    ("/2024/06/30/literature.html", "2024-06-30"),
    ("/2024/01/09/taiji-double-weight.html", "2024-01-09"),
    ("/2024/01/08/epub-fb2.html", "2024-01-08"),
    ("/2024/01/07/Ivan-Pavlov.html", "2024-01-07"),
    ("/2024/01/06/Karl-Marx.html", "2024-01-06"),
    ("/2024/01/05/cinema.html", "2024-01-05"),
    ("/2024/01/04/philosophy.html", "2024-01-04"),
    ("/2024/01/03/countries.html", "2024-01-03"),
    ("/2024/01/02/science.html", "2024-01-02"),
    ("/2024/01/01/games.html", "2024-01-01"),
]


def extract_metadata(html_path):
    """Extract title and description from HTML file."""
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract title
        title_match = re.search(r'<title>(.*?)</title>', content)
        title = title_match.group(1) if title_match else "Untitled"

        # Extract description from meta tag
        desc_match = re.search(r'<meta name="description" content="(.*?)"', content)
        description = desc_match.group(1) if desc_match else ""

        # Extract h1 if available (fallback for title)
        h1_match = re.search(r'<h1>(.*?)</h1>', content)
        h1_title = h1_match.group(1) if h1_match else ""

        return {
            'title': title,
            'description': description,
            'h1': h1_title
        }
    except Exception as e:
        print(f"Error reading {html_path}: {e}")
        return None


def generate_atom_feed():
    """Generate Atom feed XML."""
    # Create root element with namespaces
    feed = ET.Element('feed', xmlns="http://www.w3.org/2005/Atom")

    # Add feed metadata
    ET.SubElement(feed, 'title').text = "Streamcode9 Blog"
    ET.SubElement(feed, 'subtitle').text = "Personal blog covering music, mathematics, games, science, philosophy, and more."

    link_self = ET.SubElement(feed, 'link', href=f"{BASE_URL}/feed.xml", rel="self", type="application/atom+xml")
    link_alternate = ET.SubElement(feed, 'link', href=f"{BASE_URL}/", rel="alternate", type="text/html")

    ET.SubElement(feed, 'id').text = f"{BASE_URL}/"
    ET.SubElement(feed, 'updated').text = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

    author = ET.SubElement(feed, 'author')
    ET.SubElement(author, 'name').text = "Streamcode9"
    ET.SubElement(author, 'uri').text = BASE_URL

    # Add entries for each post
    base_dir = Path(__file__).parent

    for post_url, post_date in POSTS:
        post_path = base_dir / post_url.lstrip('/')

        if not post_path.exists():
            print(f"Warning: {post_path} not found")
            continue

        metadata = extract_metadata(post_path)
        if not metadata:
            continue

        # Create entry
        entry = ET.SubElement(feed, 'entry')

        # Use h1 title if available, otherwise use page title
        entry_title = metadata['h1'] or metadata['title'].split('·')[0].strip()
        ET.SubElement(entry, 'title').text = entry_title

        ET.SubElement(entry, 'link', href=f"{BASE_URL}{post_url}", rel="alternate", type="text/html")
        ET.SubElement(entry, 'id').text = f"{BASE_URL}{post_url}"

        # Convert date to RFC3339 format
        date_obj = datetime.strptime(post_date, '%Y-%m-%d')
        ET.SubElement(entry, 'published').text = date_obj.strftime('%Y-%m-%dT00:00:00Z')
        ET.SubElement(entry, 'updated').text = date_obj.strftime('%Y-%m-%dT00:00:00Z')

        # Add description if available
        if metadata['description']:
            summary = ET.SubElement(entry, 'summary', type="text")
            summary.text = metadata['description']

    # Write to file with pretty formatting
    tree = ET.ElementTree(feed)
    ET.indent(tree, space='  ')
    tree.write('feed.xml', encoding='utf-8', xml_declaration=True)
    print(f"Generated feed.xml with {len(POSTS)} posts")


if __name__ == '__main__':
    generate_atom_feed()

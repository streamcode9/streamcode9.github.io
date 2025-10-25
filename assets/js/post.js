const container = document.getElementById('post-body');
const sourcePath = document.body?.dataset?.mdSource;

function stripFrontMatter(text) {
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end !== -1) {
      return text.slice(end + 4).replace(/^\s+/, '');
    }
  }
  return text;
}

async function renderMarkdown() {
  if (!container || !sourcePath) {
    return;
  }
  try {
    const response = await fetch(new URL(sourcePath, document.baseURI));
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sourcePath}: ${response.status}`);
    }
    const raw = await response.text();
    const markdown = stripFrontMatter(raw);
    container.innerHTML = marked.parse(markdown);
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p>Sorry, we could not load this post right now.</p>';
  }
}

renderMarkdown();

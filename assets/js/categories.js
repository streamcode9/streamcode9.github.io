async function loadPosts() {
  const response = await fetch(new URL('/data/posts.json', document.baseURI));
  if (!response.ok) {
    throw new Error(`Could not load posts: ${response.status}`);
  }
  return response.json();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || value.toLowerCase();
}

function groupByCategory(posts) {
  const map = new Map();
  posts.forEach((post) => {
    if (!Array.isArray(post.categories) || post.categories.length === 0) {
      return;
    }
    post.categories.forEach((category) => {
      const key = category;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(post);
    });
  });
  map.forEach((items, key) => {
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    map.set(key, items);
  });
  return map;
}

function renderCategories(map) {
  const container = document.getElementById('categories');
  if (!container) {
    return;
  }
  container.innerHTML = '';
  const categories = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  categories.forEach(([category, posts]) => {
    const section = document.createElement('section');
    section.id = `category-${slugify(category)}`;
    const heading = document.createElement('h2');
    heading.textContent = category;
    section.appendChild(heading);

    const list = document.createElement('ul');
    posts.forEach((post) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = post.url;
      link.textContent = post.title;
      item.appendChild(link);
      list.appendChild(item);
    });
    section.appendChild(list);
    container.appendChild(section);
  });
}

(async () => {
  const container = document.getElementById('categories');
  if (!container) {
    return;
  }
  container.textContent = 'Loading categories…';
  try {
    const posts = await loadPosts();
    const grouped = groupByCategory(posts);
    renderCategories(grouped);
  } catch (error) {
    console.error(error);
    container.textContent = 'Unable to load categories right now.';
  }
})();

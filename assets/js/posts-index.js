async function loadPosts() {
  const response = await fetch(new URL('/data/posts.json', document.baseURI));
  if (!response.ok) {
    throw new Error(`Could not load posts: ${response.status}`);
  }
  return response.json();
}

function renderPostList(posts) {
  const list = document.getElementById('posts-list');
  if (!list) {
    return;
  }
  list.innerHTML = '';
  posts.forEach((post) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = post.url;
    link.textContent = post.title;
    const meta = document.createElement('span');
    meta.className = 'post-meta';
    meta.textContent = ` · ${post.date}`;
    item.appendChild(link);
    item.appendChild(meta);
    list.appendChild(item);
  });
}

(async () => {
  const status = document.getElementById('posts-status');
  if (!status) {
    return;
  }
  const list = document.getElementById('posts-list');
  if (!list) {
    return;
  }
  status.textContent = 'Loading posts…';
  try {
    const posts = await loadPosts();
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    status.textContent = '';
    renderPostList(posts);
  } catch (error) {
    console.error(error);
    status.textContent = 'Unable to load posts right now.';
  }
})();

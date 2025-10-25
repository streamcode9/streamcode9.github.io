# Streamcode9 Site

This repository now serves a fully static site (no Jekyll build step) for notes,
blog posts, and experiments.

## Project goals
- Share code snippets, blog posts, and musical riffs.
- Serve as personal notes and experiments.

## Content structure
- `index.html` – landing page with featured links.
- `pages/` – static HTML pages such as the blog index, categories, and WASM demo.
- `content/posts/` – Markdown sources loaded client-side.
- `data/posts.json` – metadata used for post and category listings.
- Year/date folders (for example `2024/07/11/`) – HTML shells for each post.

## Local preview
Because the site is pure HTML, CSS, and JavaScript you can open `index.html`
directly in a browser or serve the directory with any static file server (e.g.
`python -m http.server`).

## Deployment
Pushes to `main` are deployed by GitHub Pages without any build step.

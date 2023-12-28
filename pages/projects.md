---
layout: default
title: Projects
---
<h1>Projects</h1>

<ul>
  {% for author in site.projects %}
    <li>
      <h2>{{ author.name }}</h2>
      <h3>{{ author.position }}</h3>
      <p>{{ author.content | markdownify }}</p>
    </li>
  {% endfor %}
</ul>

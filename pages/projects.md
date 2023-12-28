---
layout: default
title: Projects
---
<h1>Projects</h1>

<ul>
  {% for author in site.projects %}
    <li>
      <h2><a href="{{ author.url }}">{{ author.name }}</a></h2>
      <h2>{{ author.name }}</h2>
      <h3>{{ author.position }}</h3>
      <p>{{ author.content | markdownify }}</p>
    </li>
  {% endfor %}
</ul>

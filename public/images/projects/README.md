# Project folder options

Each project is represented by one folder in this directory.

Use `hero.jpg`, `hero.png`, `hero.webp`, or `hero.avif` for the Work page image.

Each project folder now contains a `project.txt` file. Edit it to update the website without changing code:

```text
title: Project title
year: 2023
categories: Commercial, Hospitality
home: yes
website: https://example.com
intro:
Project description paragraph one.

Project description paragraph two.
```

- `categories` can contain one or more Work filter labels, separated by commas.
- Set `home: yes` to show the project in Index Selected Work; use `home: no` otherwise.
- Put `intro` last. Blank lines create paragraphs on the project detail page.
- `website` is optional and appears as a link on the project detail page.

## Image order and loops

Number images in each project folder to control their order:

```text
1.jpg
1-2.jpg
1-3.jpg
2.jpg
3.jpg
```

- Keep `hero.jpg` (or another supported `hero` image) as the fixed first image and Project Card cover. Numbered positions appear after hero in numeric order: `1`, then `2`, then `3`.
- `1-2` and `1-3` are extra frames for position `1`. They loop in the same place as `1` on the project card and detail page.
- Images without a number remain visible after the numbered images, so folders can be renamed gradually.
- The loop advances every `1.6s` and pauses when an image is outside the viewport.

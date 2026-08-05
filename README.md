# Architecture Portfolio Starter

A local, repository-owned Astro starter for migrating an architecture firm's portfolio away from Cargo.

## Start locally

```bash
npm install
npx playwright install chromium
npm run dev
```

Open `http://localhost:4321`.

## Audit a public Cargo site

```bash
npm run audit:cargo -- https://your-public-cargo-url.com
```

The crawler writes `cargo-audit.json`. It inventories same-origin pages, headings, images, stylesheets, and links. Review the output before downloading or transforming assets.

## Add a project

1. Copy `src/content/projects/sample-project.md`.
2. Rename it using the desired URL slug.
3. Replace frontmatter and body text.
4. Add assets under `public/images/projects/<slug>/`.

## Main next task for Codex

Use the supplied Cargo URL, screenshots, `cargo-audit.json`, and exported Cargo custom CSS to:

1. produce a page/component inventory;
2. map all old URLs to new Astro routes;
3. replace the placeholder design tokens with measured values;
4. implement the homepage and one representative project page first;
5. validate responsive behavior at 1440, 1024, 768, and 390 px;
6. document assumptions and missing assets in `MIGRATION.md`.

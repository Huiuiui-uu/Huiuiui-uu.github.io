# First Codex task

Audit this repository and the provided Cargo reference materials. Do not redesign the website yet.

1. Read `AGENTS.md`, `MIGRATION.md`, and `cargo-audit.json` if present.
2. Inventory the current Astro routes, components, content schema, and design tokens.
3. Compare them with the Cargo site and screenshots.
4. Write a concise migration plan into `MIGRATION.md`, including:
   - route map;
   - component map;
   - content-field map;
   - asset gaps;
   - responsive rules;
   - interactions;
   - redirects;
   - uncertainties.
5. Implement only the homepage and one representative project page.
6. Preserve semantic HTML, keyboard access, and reduced-motion behavior.
7. Run `npm run check` and `npm run build` and report any failures.

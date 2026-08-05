# Codex working agreement

## Goal
Rebuild the firm's Cargo portfolio as a fast, accessible, image-led Astro website while preserving the approved visual identity.

## Priorities
1. Preserve content hierarchy, image sequence, spacing, typography, and responsive behavior documented from the Cargo site.
2. Keep project data in `src/content/projects` rather than hard-coding project pages.
3. Prefer semantic HTML and native CSS. Add client-side JavaScript only when an interaction requires it.
4. Maintain strong image performance and avoid layout shift.
5. Do not introduce a CMS, UI framework, component library, analytics vendor, or animation library without an explicit task.

## Code rules
- Use TypeScript and Astro components.
- Keep components small and named by function.
- Keep global design tokens in `src/styles/global.css` until the visual audit justifies splitting them.
- Preserve keyboard navigation and `prefers-reduced-motion` behavior.
- Run `npm run check` and `npm run build` after meaningful changes.
- Never delete original project assets during optimization; write derivatives to a separate location.

## Migration records
- `MIGRATION.md` is the source of truth for page mapping, outstanding assets, redirects, and QA.
- `cargo-audit.json` is generated evidence, not hand-edited content.
- Any inferred visual rule must be marked as an inference until checked against screenshots at desktop and mobile widths.

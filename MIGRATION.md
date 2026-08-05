# JAAX Cargo migration

## Source and scope

- Cargo source: `https://203908-copy.cargo.site/`
- Current phase: English framework and first content pass
- Migrated in this pass: Home, About, Work, News, Contact, content-driven project template, and four representative projects
- Deferred: original project image folders, complete project inventory, detailed credits, additional galleries/video, and production redirects

## Route map

| Cargo | Astro | Status |
| --- | --- | --- |
| `/desktop-1` | `/` | Migrated |
| `/about-1` | `/about` | Migrated |
| `/all-projects` | `/work` | Migrated |
| `/news-2` and `/more-news` | `/news` | Migrated into one page |
| `/contact-information` | `/contact` | Migrated |
| `/americana` | `/projects/americana` | Migrated |
| `/angelo` | `/projects/angelo-house` | Migrated |
| `/aqua` | `/projects/osiria-aqua-resorts` | Migrated |
| Iki Sunset | `/projects/iki-sunset` | First full-image detail prototype |
| Remaining Cargo project slugs | `/projects/<normalized-slug>` | Pending content and assets |

## Component map

| Cargo pattern | Astro implementation |
| --- | --- |
| Persistent JAAX navigation | `SiteHeader.astro` |
| Shared page metadata and shell | `BaseLayout.astro` |
| Work thumbnail and metadata | `ProjectCard.astro` |
| Project overlay/detail content | `src/pages/projects/[slug].astro` |
| Work type controls | Accessible buttons on `/work` |

## Content-field map

| Cargo content | Project collection field |
| --- | --- |
| Project name | `title` |
| Intro line | `subtitle` |
| Year | `year` |
| Place | `location` |
| Tags/type | `typology` |
| Stage | `status` |
| Commissioning organization | `client` |
| Listing summary | `excerpt` |
| Thumbnail/hero | `cover`, `coverAlt` |
| Original page | `sourceUrl` |
| Collaborators | `credits` |
| Project narrative | Markdown body |

## Layout and responsive rules

- Sticky, transparent navigation remains visible as pages move beneath it.
- The active navigation item uses double the base navigation weight, and horizontal section rules extend edge-to-edge across the viewport.
- Level 2 typography uses a shared `400` weight and `0.02em` letter spacing across Home copy, Work filters, About/Team copy, body copy, section labels and project details.
- The Team section uses the shared 12-column Gallery grid and gap: the bio occupies columns 1–6, while each row of portraits spans 7–8, 9–10 and 11–12.
- The Team panel fills the available viewport between the fixed header and page bottom, with its six-card grid stretching between full-viewport top and bottom rules and no center divider; the lower rule is followed by a bottom clear space equal to the site-header height.
- Home uses the Cargo statement as a large, nearly full-height opening frame.
- Home Selected Work uses a 12-column grid: standard cards span six columns and reduced-width cards span five, while preserving the alternating left/right sequence.
- Work is image-led and uses a 12-column desktop grid: paired cards occupy six columns each, reduced-width cards occupy five, and the layout collapses to one mobile column.
- Project detail pages use a fixed 12-column editorial grid with a one-rem gap; the hero occupies columns 3–8 and narrative copy occupies columns 9–12.
- About, News and Contact use rule-based editorial grids consistent with the source site's restrained layout.
- At 800 px and below, multi-column content collapses into a readable single-column sequence.

## Interactions and motion

- Home advances through Landing Film, Home Title, and Selected Work one section per wheel or touch gesture; each incoming section covers the preceding layer.
- About uses the same discrete cover transition: the introduction remains in its approved first-page position while Team advances as a second panel, one wheel or touch gesture at a time.
- About ignores trackpad momentum while its cover animation is running and clears the consumed wheel gesture on arrival, so returning from Team can be followed immediately by a new downward gesture without moving the pointer.
- The About introduction panel now fills its viewport down to the same lower rule used by Team; the full-width rule and center divider stop one live header-height above the viewport bottom.
- Contact now shares the About lower-rule baseline: its office area fills to a header-height footer strip, the two left-column addresses divide that height equally, and their middle rule stops at the center divider instead of crossing the inquiries column.
- The News archive now includes the supplied March 2024 office move and the July, June, May and February 2023 project announcements in chronological order.
- News keeps its About-aligned top and bottom rules fixed while the archive alone scrolls between them; individual entry dividers have been removed.
- The first News entry opens vertically centered. Native wheel/touch scrolling moves the archive upward through that fixed focus point; the nearest centered row fades to solid black while every other row retains the shared Level 2 `400` weight at 30% opacity, and leading/trailing space lets both endpoints center.
- Each News row follows the shared 12-column desktop grid: date spans columns 1–2, title 3–6 and description 7–12. Fixed dividers in the gutters between columns 2/3 and 6/7 mark the three text regions while entries scroll behind them; mobile collapses to one column without the dividers.
- News dates are horizontally centered within their columns 1–2 region while remaining top-aligned with the title and description.
- News descriptions use the full columns 7–12 width and normal word wrapping, without the earlier `35rem` constraint that caused premature line breaks.
- Selected Work keeps native long-page scrolling, but becomes a strict one-way boundary once entered: upward scrolling stops at its top and cannot reveal Home Title or Landing Film again.
- Work type filters update the local project list without a library.
- Every Work project uses the same native cross-document shared-element transition: surrounding gallery content fades for 480 ms, holds for 180 ms, then the selected hero moves and resizes into the detail grid over 900 ms. Browsers without that API use a small native-JavaScript FLIP fallback with the same timing; no animation library is added.
- Every Home Selected Work card now links to the same content-driven detail route and uses the same shared-hero transition as its matching Work card; Back returns to the originating Home or Work gallery and restores that gallery's saved position.
- Home return transitions disable native history scroll restoration until the Selected Work layout is ready, then reapply the saved card coordinate on `pageshow`; this keeps the reverse-moving Hero locked to its actual Index card instead of drifting to an earlier Home scroll position.
- Work clears any cached shared-element name before each navigation, so every project can transition correctly after returning from another detail page.
- Returning to Work follows the same cadence as entry: detail surroundings fade out for 480 ms, the frame holds for 180 ms, then the hero moves into its matching card over 900 ms while the Work interface simultaneously fades in over 420 ms.
- The return route carries the selected project slug and registers the matching Work figure during HTML parsing, before the incoming transition snapshot is captured.
- Back navigation waits one painted frame before capture and uses only the outgoing hero snapshot during movement, preventing the source and destination images from flashing over one another.
- Forward navigation also waits one painted frame after assigning the selected hero and suppresses the incoming hero snapshot during movement, preventing click-time content flashes.
- Work records the selected card's scroll and viewport position before entry, then restores that exact position before the return transition snapshot instead of resetting the page to the top.
- Project detail media is generated from each local project asset folder: `hero` leads the page and every remaining image follows in natural filename order at the same six-column width.
- Every project detail page closes the editorial grid with a full-viewport horizontal rule and a left-aligned `© 2024 JAAX` footer at the same page inset as the rest of the site.
- Desktop project details with only a hero image are locked to one viewport: the editorial grid absorbs the remaining height, the hero fills it vertically, and page scrolling is disabled. Multi-image projects retain native long-page scrolling.
- Navigation underline, image scale, page reveal and project-image reveal preserve the subtle motion character.
- All motion is disabled for `prefers-reduced-motion`.
- Links, filters and navigation remain keyboard accessible.

## Asset gaps

- The user will provide project image folders in a later phase.
- All project imagery currently uses a local neutral placeholder.
- Original image order, aspect ratios, captions, drawings, video and photographer credits remain to be mapped.
- Fonts used by Cargo have not yet been supplied or licensed for local hosting.

## Redirects for launch

- `/desktop-1` → `/`
- `/about-1` → `/about`
- `/all-projects` → `/work`
- `/news-2` and `/more-news` → `/news`
- `/contact-information` → `/contact`
- Each old project slug → its normalized `/projects/<slug>` route

## Uncertainties

- Americana's Cargo page exposes limited project metadata; year and status need confirmation.
- Angelo and Aqua pages contain a repeated Americana paragraph in the Cargo copy; the new pages omit that apparent source error.
- The Cargo News page currently exposes no standalone entries, so the homepage news archive was used.
- Exact desktop/mobile spacing and any scroll-linked Cargo behaviors should be verified once final imagery is available.

# ASK

The **ASK** meta-brand front door — the meta-brand surface itself, and a coded
static **reference implementation of [`design-system-ASK`](https://github.com/apexSolarKiss/design-system-ASK)**.
The front door is a build artifact (proof), not a brochure.

The repo is named `ASK` (no category suffix) deliberately: this is the one
surface that *is* ASK-the-entity — it carries ASK's own Tier 3 (the `ASK` name
+ the `logo-ASK` wordmark). Category-suffix grammar (`asset-pipeline-ASK`,
`design-system-ASK`) names artifacts *inside* the ecology; this is not one of
those. The domain `A-S-K.studio` uses the `A-S-K.` URL workaround; the artifact
identity does not.

> **order from chaos // beauty in systems**

## What it is

The root front door is a single static page — no build step, no framework — within a multi-page static site. It consumes the canonical
ASK design tokens (vendored `colors_and_type.css`, fonts, and the `logo-ASK`
wordmark) — no new colors, type, or scale. It carries
ASK's own **Tier 3** identity (the wordmark + the `ASK` name) and inherits
Tier 1 (foundation) and Tier 2 (ASK design language, incl. the tagline).

**Page chrome is inherited, not local.** Every content page except the homepage
consumes the vendored `surface-shell` **pattern** (`surface-shell.css`) — a
pinned, byte-identical copy of the canonical file in `design-system-ASK`, never
hand-edited here. The shell owns the page container, the header, the wordmark
slot, the structural title and lede, the header rule, and the footer's alignment
and link behavior. `site.css` adds ASK's own payload layout and instance
adaptations around it; it no longer owns a shared page shell of its own.

The 68 p5 sketch runners under `assets/asymptotic/p5/gallery/` are not content
pages and are outside the shell: they are full-viewport canvas embeds loaded in
iframes, with no site chrome by design.

**Two visual rules are inherited too.** `surface-panel.css` (the shared visual
contract for live content panels) and `surface-action.css` (the shared
compact-action contract) are vendored the same way — pinned, byte-identical, never
hand-edited here. The homepage's three tier panels consume the panel rule; every
page's compact controls consume the action rule. Both own presentation — and the
action rule its interaction as well — but neither owns markup or semantics. ASK
keeps its own element semantics, destinations, copy, row and placement decisions.
The panel rule deliberately leaves support-copy foreground local; the action rule
owns its base foreground, with only the bounded `gal-link` on-image paint
adaptation described below.

**The homepage is the explicit exception.** `/index.html` keeps its own centered,
viewport-height composition and does not adopt the shell. It does consume both
visual rules.

Light/dark follows the system preference (`prefers-color-scheme`) — no toggle,
no theme control, no JS for theming; the two diagonal gradients switch with the
OS. The design system's style-guide theme selector is **not** vendored here and
no page loads it.

## Structure — three-tier front door

| Tier | Surface | Links to |
| --- | --- | --- |
| builder | **apex solar kiss** | native `/apex-solar-kiss/` (the object map) + GitHub `@apexSolarKiss` + native `/apex-solar-kiss/design/` (live design-system surfaces + the retained design portfolio / UI/UX / branding boards) |
| artistic practice | **asymptotic system key** | native `/asymptotic-system-key/` (Lightroom stills + YouTube motion as named external media) |
| creative production | **ASKproduKtion** | native `/askproduktion/` (Timberland films = named external-video exception) |

Native repo surfaces (`/apex-solar-kiss/`, `/askproduktion/`, `/asymptotic-system-key/`) are the intended public canonical after the source-of-truth flip. **Notion is retained only as a legacy / staging / named-exception layer** — apex solar kiss keeps a retained **root** Notion exception page whose scope is the **portfolio / assets / comps content** (design portfolio / apexSolarKiss assets · UI/UX comps WIP · logo/branding comps WIP), migration-pending; the builder **object map** is native at `/apex-solar-kiss/` and is not part of that exception. ASKproduKtion's Timberland films remain a named external-video exception on their own root Notion page. Asymptotic system key uses named external media sources (Lightroom stills + YouTube motion) through ASK-native facades. Notion is no longer the general embed/depth layer.

One durable **child sub-surface** (not a fourth tier card): **studioLeoV** at `/studioleov/` — a conceptual / collaborative project under **asymptotic system key** (breadcrumbed and linked from `/asymptotic-system-key/`). It began with ASK sourcing discarded book-printing test paper from Arion Press and setting up an aperture for LeoV's expressive mark-making from early childhood onward; LeoV's drawings carry the live expressive judgment of the realized marks, while ASK's role is the project-level source of intent — substrate selection, body-of-work framing (continuity, collection, presentation, curation), and closure. **The marks are not instructed or specified by ASK; LeoV's drawing span is live expressive judgment inside the authored conditions.** In method terms, a bounded-generativity instance with a high-discretion human middle: ASK authors the aperture and governs the body; LeoV's expression generates the work inside it. Lightroom collections + Instagram are its named external media/source surfaces.

## Files

```
index.html            the homepage (inline logo-ASK wordmark; three tier panels; footer) — the explicit shell exception
site.css              ASK payload layout + shell instance adaptations, on top of the tokens (no new tokens)
surface-shell.css     vendored from design-system-ASK — the surface-shell PATTERN, pinned + byte-identical; every non-home content page consumes it
surface-panel.css     vendored from design-system-ASK — the live-content-panel VISUAL RULE, pinned + byte-identical; the homepage tier panels consume it (presentation only — ASK keeps its own markup, semantics, and support foreground)
surface-action.css    vendored from design-system-ASK — the compact-action VISUAL RULE, pinned + byte-identical; every page's compact controls consume it (the owner owns the base surface, foreground, border, geometry and interaction; ASK keeps the element semantics, destination, copy, row and placement)
colors_and_type.css   vendored from design-system-ASK (canonical tokens)
fonts/                vendored Inter + JetBrains Mono (OFL)
assets/logo-ASK.*     vendored wordmark (svg primary; white + lavender-ASK png pairings)
apex-solar-kiss/      native builder subpage — the object map (practice + two domain applications + the builder machine)
apex-solar-kiss/design/  native design gateway — live design-system surfaces + retained external comp boards
askproduktion/        native creative-production subpage (Track A.1)
asymptotic-system-key/  native artistic-practice subpage (Track A.2; per-category p5.js pages)
asymptotic-system-key/lineage/  public-safe influence lineage (canon as substrate: readymade >> pop >> appropriation >> generative systems)
studioleov/           studioLeoV child sub-surface (conceptual/collaborative project under asymptotic system key)
NOTICE / LICENSE      Apache-2.0; provenance for the vendored foundations
vercel.json           security headers + static config
```

For repo-to-repo citations, the canonical source is the file in this repo; `A-S-K.studio` is the rendered public view.

## Hosting

Static deploy on **Vercel**; canonical domain **A-S-K.studio**. Also valid as
plain static hosting anywhere (e.g. GitHub Pages with a `.nojekyll`).

## Provenance

A reference implementation of the [ASK design family](https://github.com/apexSolarKiss/design-system-ASK):
it vendors the canonical foundations (tokens, fonts, wordmark), **the
`surface-shell` pattern**, and **the `surface-panel` and `surface-action` visual
rules**, then adds its own payload layout and instance adaptations around them.
The shared page chrome is owned upstream, not here.

The homepage tier panels and every page's compact controls inherit their
presentation from the two vendored visual rules. The split is not identical
across the two, and stating it precisely matters more than stating it briefly:

- **Panel.** The owner governs the panel's arrangement and paint and the type
  roles of its title and supporting copy. It deliberately sets **no** supporting
  foreground, so **ASK owns the support-copy foreground** — a value the
  consuming surface is meant to choose.
- **Action.** The owner governs the **base surface, foreground, border,
  geometry and interaction** — it disclaims none of those. **ASK owns the
  element semantics, destination, copy, and the row and placement** around the
  control. One bounded exception exists and is deliberate: the gallery
  `gal-link` carries an **on-image contextual-paint adaptation** — a scrim, a
  brighter translucent border, and a white foreground — layered over that
  canonical base so the control stays legible above a photograph.

That split is the point of those modules. So an inert panel carrying its own
links and a panel that is itself a link can share one look without sharing a
structure, and an anchor that navigates and a button that acts can share one
control without either stopping being what it is.

When this site and `design-system-ASK` disagree on a foundation value, on the
shell, or on a vendored visual rule, the canonical file wins — see `NOTICE`.

Licensed under the Apache License 2.0 // see [LICENSE](LICENSE).

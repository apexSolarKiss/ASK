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

A single static page — no build step, no framework. It consumes the canonical
ASK design tokens (vendored `colors_and_type.css`, fonts, and the `logo-ASK`
wordmark) and adds **layout only** — no new colors, type, or scale. It carries
ASK's own **Tier 3** identity (the wordmark + the `ASK` name) and inherits
Tier 1 (foundation) and Tier 2 (ASK design language, incl. the tagline).

Light/dark follows the system preference (`prefers-color-scheme`) — no toggle,
no JS; the two diagonal gradients switch with the OS.

## Structure — three-tier front door

| Tier | Surface | Links to |
| --- | --- | --- |
| builder | **apex solar kiss** | GitHub `@apexSolarKiss` + Notion (design portfolio · UI/UX comps · branding comps) |
| artistic practice | **asymptotic system key** | Notion (portfolio) |
| creative production | **ASKproduKtion** | Notion (portfolio) |

Public Notion pages stay on Notion as the embed/depth layer; the site links out
to them.

## Files

```
index.html            the page (inline logo-ASK wordmark; three tier cards; footer)
site.css              layout layer on top of the tokens (no new tokens)
colors_and_type.css   vendored from design-system-ASK (canonical tokens)
fonts/                vendored Inter + JetBrains Mono (OFL)
assets/logo-ASK.*     vendored wordmark (svg primary; white + lavender-ASK png pairings)
NOTICE / LICENSE      Apache-2.0; provenance for the vendored foundations
vercel.json           security headers + static config
```

## Hosting

Static deploy on **Vercel**; canonical domain **A-S-K.studio**. Also valid as
plain static hosting anywhere (e.g. GitHub Pages with a `.nojekyll`).

## Provenance

A reference implementation of the [ASK design family](https://github.com/apexSolarKiss/design-system-ASK):
it vendors the canonical foundations (tokens, fonts, wordmark) and adds layout
only. When this site and `design-system-ASK` disagree on a foundation value, the
canonical file wins — see `NOTICE`.

Licensed under the Apache License 2.0 // see [LICENSE](LICENSE).

# ASK site // content architecture

**Status:** the public source-of-truth flip (Notion → ASK site/repo), authorized by ASK 2026-06-27, is complete. This repo is the **public canonical** for the ASK public layer. The content model below is still a proposal.

## Source of truth

- A-S-K.studio / this repo is the public canonical for ASK public content.
- Notion is **retired** as a public source. Every former ASK public Notion surface has been migrated or retired; none is a source of truth, a staging surface or a maintained mirror, and no migration is pending.
- The sole retained ASK public media-hosting exception is ASKproduKtion's Timberland video page, which hosts those films and carries no other part of ASKproduKtion. The sociedade mecânica de futebol page (`/apex-solar-kiss/sociedade/`) separately retains links to that collaborative project's historical external records; these are not maintained ASK mirrors or pending migration work. Former Notion pages that are still reachable are historical and are not maintained. The apex solar kiss **design portfolio** is native at `/apex-solar-kiss/design/`, the **builder landing / object map** at `/apex-solar-kiss/`, and the UI/UX and logo/branding comp boards are retired.
- Strategic/private brand context is maintained operator-side and is mirror-not-lead for this public canonical.

## Content model (proposed; finalized in Phase 2)

```
content/   subbrands/ · projects/ · works/ · galleries/ · links/
assets/    images/ · thumbnails/ · video-posters/
embeds/    p5js/ (self-hosted, archival) · external-live-links/ (YouTube, p5.js editor)
```

## Front-door composition

The root front door (`index.html`) renders the meta-brand identity as a fixed hierarchy — the current-builder-focus band is subordinate to the protected tagline and sits above the three-mode cards, never becoming a fourth mode:

```
meta-brand identity
  >> protected tagline           order from chaos // beauty in systems
  >> current-builder-focus band  systems for creative operations + commercial visual production
  >> three-mode front door       builder · artistic practice · creative production
       builder card              AP-ASK as current flagship + direct project destination
```

The current-builder-focus band is subordinate to the protected tagline and does not become a fourth practice. It presents the current domain and operating problem, not the full general-method explanation. The builder card names AP-ASK and links directly to it. The meta-brand, artistic practice and creative-production practice retain their separate roles. Public deployment follows ASK's current focus ruling; the general governed-domain-architecture and bounded-generativity formulations remain available in the builder page's method section rather than governing the default introduction.

## Builder-page hierarchy

```
practice introduction
current focus                    AP-ASK
supporting systems               method-ASK / control-surface / design-system-ASK
method + grounding               plus production-portfolio link
other active work                urban-observatory
research artifacts               CFW
earlier work                     sociedade mecânica de futebol
existing closing destinations
```

Editorial prominence does not create a new technical hierarchy. AP is the current flagship; the supporting repositories remain independently owned reusable systems, and UO remains other active work. Menus retain the complete sibling inventory. No route, project status, design-system tier or brand assignment changes with this positioning update.

## Authoring posture (Phase-2 decision, TBD)

- Start **static-authored** (hand-written pages) for the easy-static bulk; introduce a generator only if/when volume warrants. Any generator/renderer is **ASK-repo-owned** (control-surface supplies requirements/templates only).

## Live-work posture (p5.js / generative)

- **embed** if the external host is stable, iframe-compatible, and visually acceptable at implementation time.
- **link** if embedding is fragile, mobile-hostile, or visually poor.
- **self-host** when the work needs archival control or the external host is weak.

## Production note

`main` auto-deploys to A-S-K.studio (Vercel). Every change is branch + exact-scoped diff + PR held for ASK. See `AGENTS.md`.

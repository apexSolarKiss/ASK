# ASK site // content architecture

**Status:** target posture for the public source-of-truth flip (Notion → ASK site/repo), authorized by ASK 2026-06-27. This repo is the **intended public canonical** for the ASK public layer. Migration is phased + governed; the detailed migration inventory and sequencing memo is retained operator-side.

## Source of truth

- A-S-K.studio / this repo is the intended public canonical for ASK public content.
- Notion is a **named legacy / staging / exception surface** only — no page stays canonical on Notion by inertia.
- Retained Notion exceptions (initial): apex solar kiss UI/UX comps WIP + logo/branding comps WIP.
- Strategic/private brand context is maintained operator-side and is mirror-not-lead for this public canonical.

## Content model (proposed; finalized in Phase 2)

```
content/   subbrands/ · projects/ · works/ · galleries/ · links/
assets/    images/ · thumbnails/ · video-posters/
embeds/    p5js/ (self-hosted, archival) · external-live-links/ (YouTube, p5.js editor)
```

## Authoring posture (Phase-2 decision, TBD)

- Start **static-authored** (hand-written pages) for the easy-static bulk; introduce a generator only if/when volume warrants. Any generator/renderer is **ASK-repo-owned** (control-surface supplies requirements/templates only).

## Live-work posture (p5.js / generative)

- **embed** if the external host is stable, iframe-compatible, and visually acceptable at implementation time.
- **link** if embedding is fragile, mobile-hostile, or visually poor.
- **self-host** when the work needs archival control or the external host is weak.

## Production note

`main` auto-deploys to A-S-K.studio (Vercel). Every change is branch + exact-scoped diff + PR held for ASK. See `AGENTS.md`.

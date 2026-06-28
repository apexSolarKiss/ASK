# AGENTS.md — ASK

Baseline: `apexSolarKiss/control-surface/AGENTS.md` applies in full. This file adds repo-specific deltas. If this file and the baseline conflict, this file wins for `ASK`.

## Production surface

`ASK` is the live public front door at `A-S-K.studio`.

The Vercel project is git-connected to `main`; pushes to `main` deploy the live site. Never push directly to `main`. Every change must go through a branch, exact-scoped diff, PR, and explicit ASK approval before merge.

## Required reads

Before changing this repo, read:

- `README.md`
- `NOTICE`
- `index.html`
- `site.css`
- vendored design-system foundations: `colors_and_type.css`, fonts, and `logo-ASK` assets
- any file directly touched by the change

When operating from the ASK/control-surface ecology, also read the current ASK grounding note and the relevant inheritable identity files as needed: `brand-architecture.md`, `visual-identity-system.md`, and `voice-style-typography.md`.

## Repo-specific rules

- **No-new-token rule.** This site vendors the `design-system-ASK` foundations and adds layout only. Do not create local design tokens, fork foundation values, or reinterpret the design language here. Re-sync from `design-system-ASK`; do not make the site the upstream source.
- **Tier 3 origin case.** `ASK` is ASK-the-entity. It carries ASK’s own Tier 3 as the origin/reference case; it is not a downstream child-inheritance proof.
- **Production caution.** Treat even docs/CSS/asset changes as production-affecting until verified. Check both light and dark modes for any visual change.
- **Public-surface restraint.** Do not add private-context details, operator-only paths, unpublished strategy, or Notion-replacement claims unless ASK explicitly authorizes the public wording.

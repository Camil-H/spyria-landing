# AGENTS.md

Instructions for anyone changing this repository: coding agents and people. Read it before your first change.

## What this is

The public site of Spyria at `spyria.dev`: Home, Principles, Install and the docs. Spyria itself lives in [github.com/Camil-H/spyria](https://github.com/Camil-H/spyria); its `docs/` folder is the single source of the docs pages, fetched at build time and never copied here.

Stack: Astro (static output), Tailwind v4, Bun for scripts and the lockfile, Cloudflare Workers static assets (`wrangler.jsonc` serves `dist/`). Design rules: [.agents/skills/site-design/SKILL.md](.agents/skills/site-design/SKILL.md).

## Site rules

- Plain-language copy in the reader's terms; no internal names; no superlatives ("revolutionary", "supercharge", "seamless"). Every claim is backed by a decision record or a guide in the product docs.
- No gradient heroes, purple glows, bento grids, logo walls, icon-card triplets, stock illustration.
- **Motion budget:**
  - At most one moving element in any viewport.
  - The spires live in the Home hero band (60vh at most) and never sit behind body text; opacity 0.5 at most where any text overlaps.
  - They pause when off screen (IntersectionObserver) and when the tab is hidden; `prefers-reduced-motion` shows one still frame.
  - No text animates in, no scroll-jacking, no parallax; every word is in the HTML at first paint. Hover and focus transitions take 150 ms at most.
- **JavaScript budget:** the spires island 15 KB gzip at most; the theme toggle is the one inline script; Pagefind only on docs pages; nothing else ships JavaScript.
- Every page reads completely with JavaScript off and at 360 px wide without horizontal scroll.
- **No comments: code explains itself.** Explicit names, small functions. A comment is acceptable only for what the code cannot say (a non-obvious external constraint, such as a vendor bug with its issue link); never to narrate what the code does.
- Optimize for the reader first, minimum code second. Prefer deleting code to adding abstractions.
- Pull requests show screenshots in light and dark.

## Commands

```sh
bun install
bun run dev             # http://localhost:4321
bun run build           # dist/
bun run check           # typecheck, lint, build, check:links, check:budgets, test
```

`bunx biome check --write .` fixes formatting and import order. `PUBLIC_CF_ANALYTICS_TOKEN` at build time adds the Cloudflare Web Analytics beacon.

## Tests

- **Build checks** (`scripts/`, over `dist/`): `check:links` fails on any internal link or `#anchor` that does not resolve; pages still to be built are allow-listed at the top of `scripts/check-links.ts`. `check:budgets` fails on any script beyond the allowed ones, on an inline theme script the `public/_headers` Content-Security-Policy does not allow by hash, and on a Home transfer above 300 KB.
- **Playwright** (`tests/`, Chromium, against `astro preview` of the built site): one user story per test, titled "As <role>, I …"; no JavaScript, 360 px width, theme, axe in light and dark.
- No pixel baselines; the reviewer judges the looks from the pull request screenshots. Never weaken an assertion to make a check pass; if a check must change, say so in the pull request.

## Conventions

- Bun only; `bun.lock` is committed. Dependencies are pinned to exact versions.
- Plain sentences, sentence case for headings and links.
- Commit messages: `type: what changed and why` (`feat`, `fix`, `perf`, `refactor`, `test`, `build`, `docs`, `chore`).

# AGENTS.md

Instructions for anyone changing this repository: coding agents and people. Read it before your first change.

## What this is

The public site of Spyria at `spyria.dev`: Home, Principles, Install and the docs. Spyria itself lives in [github.com/Camil-H/spyria](https://github.com/Camil-H/spyria); its `docs/` folder is the single source of the docs pages, fetched at build time and never copied here.

Stack: Astro (static output), Tailwind v4, Bun for scripts and the lockfile, Cloudflare Workers static assets (`wrangler.jsonc` serves `dist/`). Design rules: [.agents/skills/site-design/SKILL.md](.agents/skills/site-design/SKILL.md).

## Site rules

- Plain-language copy in the reader's terms; no internal names; no superlatives ("revolutionary", "supercharge", "seamless"). Every claim is backed by a decision record or a guide in the product docs.
- No gradient heroes, purple glows, bento grids, logo walls, icon-card triplets, stock illustration.
- **Motion budget:**
  - At most one moving element in any viewport, with one exception: the Home hero's story sequence loops alongside the spires, in CSS only, every 12 s: it builds up in under 5 s, holds every word visible for about 6 s, then fades out and starts over; it never moves text, and `prefers-reduced-motion` shows its final state, still.
  - The spires live in the Home hero stage, full width, behind the hero's example cards only (card surface at least 90% opaque); never directly behind page text.
  - They pause when off screen (IntersectionObserver) and when the tab is hidden; `prefers-reduced-motion` shows one still frame.
  - Outside the hero story, no text animates in; no scroll-jacking, no parallax; every word is in the HTML at first paint. Hover and focus transitions take 150 ms at most.
- **JavaScript budget:** the spires island 15 KB gzip at most; the theme toggle is the one inline script; Pagefind only on docs pages; nothing else ships JavaScript.
- Every page reads completely with JavaScript off and at 360 px wide without horizontal scroll.
- **No comments: code explains itself.** Explicit names, small functions. A comment is acceptable only for what the code cannot say (a non-obvious external constraint, such as a vendor bug with its issue link); never to narrate what the code does.
- Optimize for the reader first, minimum code second. Prefer deleting code to adding abstractions.
- Pull requests show screenshots in light and dark.

## Commands

```sh
bun install
bun run sync            # fetch the product docs at product.ref into .product/
bun run dev             # http://localhost:4321
bun run build           # sync, dist/, then the Pagefind index in dist/pagefind/
bun run check           # typecheck, lint, test:unit, build, check:links, check:budgets, check:search, test
bun run og              # redraw the social card public/og/home.png with Playwright (run by hand, commit the PNG)
```

`bunx biome check --write .` fixes formatting and import order. `PUBLIC_CF_ANALYTICS_TOKEN` at build time adds the Cloudflare Web Analytics beacon.

## Docs from the product repository

- `product.ref` holds the full commit SHA of the product the docs are built from. `scripts/sync-product.ts` (run by `dev`, `build` and `typecheck`) checks out the product's `docs/` (and `install.sh` once it exists) at that commit into `.product/` (gitignored, never edited by hand), with each page's last-changed date in `.product/docs-dates.json`. It skips the fetch when `.product/` already matches the ref.
- The product repository is public: the sync needs no token.
- `src/docs/` turns those files into pages: the sidebar follows `docs/README.md` and the decision table, links between docs become site links and links elsewhere in the product become GitHub links at `product.ref`, Mermaid diagrams become inline SVG at build time, code colours are classes (the Content-Security-Policy allows no inline style). Each page also has a Markdown twin at its path with `.md`.
- A push to the product's `main` that touches `docs/**` dispatches `product-docs-changed`; `.github/workflows/sync.yml` then opens or updates the pull request "docs: sync to <sha>" from `sync/product-docs`. Run it by hand from the Actions tab with a commit SHA to move the docs to any product commit.

## Tests

- **Build checks** (`scripts/`, over `dist/`): `check:links` fails on any internal link or `#anchor` that does not resolve; links to pages not yet published stay hidden behind their switch in `src/site.ts` (`docsPublished`, `principlesPublished`, `installPublished`). `check:links` also follows the links of the Markdown twins. `check:budgets` fails on any script beyond the allowed ones (the spires bundle only on Home and at most 15 KB gzip, the docs search only on docs pages), on an inline theme script the `public/_headers` Content-Security-Policy does not allow by hash, on any inline `style` the policy would block, and on a Home transfer above 300 KB. `check:search` fails on a page without a unique title (60 characters at most), a description (155 at most), its canonical URL, one `h1`, `lang="en"` or a social card; on JSON-LD that does not parse or has no `@type`; on a `sitemap.xml` that is not exactly the published pages with their `lastmod`; on a `robots.txt` with a `Disallow` or without the sitemap; and on an `llms.txt` whose site links do not resolve or that misses a docs page.
- **Unit** (`bun run test:unit`, `*.test.ts` next to the file in `src/`): link rewriting, sidebar parsing, Markdown twins.
- **Playwright** (`tests/`, Chromium, against `wrangler dev` serving the built site, so `public/_headers` and its Content-Security-Policy apply): one user story per test, titled "As <role>, I …"; no JavaScript, 360 px width, theme, axe in light and dark.
- No pixel baselines; the reviewer judges the looks from the pull request screenshots. Never weaken an assertion to make a check pass; if a check must change, say so in the pull request.

## Conventions

- Bun only; `bun.lock` is committed. Dependencies are pinned to exact versions.
- Plain sentences, sentence case for headings and links.
- Commit messages: `type: what changed and why` (`feat`, `fix`, `perf`, `refactor`, `test`, `build`, `docs`, `chore`).

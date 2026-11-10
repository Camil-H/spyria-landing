---

name: site-design
description: "Visual and copy rules for spyria.dev: type faces and named text styles, spacing, radius, colour tokens, motion and JavaScript budgets, content realism, interactive states and the ship checklist. Load before building, styling, reviewing or writing copy for any page, section or component of this site."
---

# Site design

spyria.dev is editorial and type-led, written for engineering leads who would self-host Spyria. It is not a sales page: no single-CTA funnel, no testimonials, no FAQ for objection handling. When a rule here conflicts with a framework default, this file wins. When the human's explicit request conflicts with a rule, the human wins.

## Type

Three faces, each with one job:

- **Display serif** (Newsreader): headings only, regular weight. Never for body text, buttons or navigation.
- **Outfit** (as in the product): text and interface, weights 400 and 500.
- **JetBrains Mono**: commands, code and file names.

No other face, no weight above 500 for Outfit. Italics only where the meaning needs them (a title, a term being defined), never for decoration.

Font sizes land on Tailwind's default scale; no arbitrary values such as `text-[19px]` or `1.4rem`. Every piece of text uses one named style, defined once in `src/styles/global.css`:

| Style       | Face       | Size / line height                        | Use                                  |
| ----------- | ---------- | ----------------------------------------- | ------------------------------------ |
| `display-1` | display    | `text-5xl`, `text-7xl` from `md` / 1      | the page's `h1`                      |
| `heading-2` | display    | `text-4xl` / 40, `text-5xl` / 1 from `md` | section headings                     |
| `heading-3` | display    | `text-2xl` / 32                           | sub-sections                         |
| `lead`      | Outfit 400 | `text-xl` / 28                            | the paragraph under an `h1`          |
| `body`      | Outfit 400 | `text-lg` / 28                            | running text                         |
| `title`     | Outfit 500 | `text-base` / 24                          | navigation, labels that lead a block |
| `caption`   | Outfit 400 | `text-sm` / 20                            | metadata, footer, fine print         |

A new style takes the next name in its group and a scale step; never a loose size and weight on one element. Headings use `text-wrap: balance`, body text `text-wrap: pretty`. Running text stays within `max-w-2xl`.

## Spacing

Only these values: 0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96 px (Tailwind 0, 0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24). Phone gutter 16 px.

## Radius

Tailwind's radius values only. When a shape sits inside another with a gap under 32 px: inner radius = outer radius − gap, applied only when the result is above 2 px; otherwise leave the inner shape square.

## Colour and backgrounds

- Colours come from `src/styles/tokens.css` (the product's tokens: primary `#ffe165` scale, neutrals, greys, spire tones). Use the semantic names (`page`, `raised`, `sunken`, `line`, `ink`, `muted`, `accent`, `highlight`, `focus`), never a raw hex in a component.
- Light and dark follow the system through `light-dark()`; `data-theme` on `<html>` overrides it. Check both for every change.
- Backgrounds are flat: no gradients, glows or blurred blobs. Borders go all the way around a shape or not at all.
- The yellow is a highlighter, used sparingly: links in running text (`highlight-link`), the focus ring, the spires.

## Motion

- At most one moving element in any viewport: the spires, full width in the Home hero stage, behind the hero's example cards only (card surface at least 90% opaque), never directly behind page text.
- One exception: the Home hero's story sequence loops alongside the spires, in CSS only, every 22 s, with `ease-settle`: its messages appear one by one over about 14 s, the agent's question showing its options until Salim answers, hold every word visible for about 6 s, then fade out and start over. It never moves text, and `prefers-reduced-motion` shows its final state, still.
- The spires pause off screen (IntersectionObserver) and when the tab is hidden; `prefers-reduced-motion` shows one still frame.
- Outside the hero story, no text animates in; no scroll reveals, no scroll-jacking, no parallax. Every word is in the HTML at first paint.
- Hover and focus transitions take 150 ms at most and animate only colour, `transform` or `opacity`; never `top`, `left`, `width` or `height`. Use `ease-settle` (`cubic-bezier(0.22, 1, 0.36, 1)`), never a browser default curve.

## JavaScript

- The theme toggle is one inline script in `Page.astro`, applied before paint; its hash is in the CSP of `public/_headers`.
- The spires island 15 KB gzip at most, loaded when visible. Pagefind on docs pages only. Cloudflare's analytics beacon sits outside the budget.
- Nothing else ships JavaScript. Every page reads completely with JavaScript off.

## Content

- Write real sentences in the reader's terms. No placeholder text.
- **Never invent facts.** Numbers, limits, customers, quotes and comparisons come from the product docs or the human. Each claim can point to a decision record or a guide.
- No internal names, no superlatives or filler: "revolutionary", "revolutionize", "supercharge", "seamless", "effortless", "cutting edge", "world class", "harness the power", "transform your workflow", "take it to the next level".
- Sentence case for headings, buttons and links. Calm, specific system text; no exclamation marks.

## States

Every interactive element has hover, active and a visible focus ring (`--color-focus`). No dead links: a link either goes somewhere or is not a link. The navigation marks the current page with `aria-current="page"`.

## Ship checklist

- Skip link to `#main`; semantic HTML (`header`, `nav`, `main`, `article`, `section`, `footer`), one `h1` per page.
- `<title>`, meta description, canonical URL and Open Graph tags on every page (from `Page.astro` props).
- Favicon, a custom 404 with a way back, alt text on every meaningful image (empty `alt` on decorative ones).
- No horizontal scroll at 360 px; light and dark both checked; `bun run check` green.
- Pull request screenshots in light and dark.

## Not used here

From the original skill, deliberately dropped: one typeface without italics, scroll reveals on every section, the word-by-word tagline reveal, a floating blurred navigation bar, gradient hero text, and the conversion structure (single CTA, risk reversal, FAQ, testimonials).

## Credits

Adapted from the `landing-page-design` skill in [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills), MIT licensed: the type scale with named text styles, the spacing scale, the nested radius formula, flat backgrounds, text wrapping, animating only transform and opacity, content realism, interactive states and the ship checklist come from it. That skill in turn adapted parts of [taste-skill](https://github.com/Leonxlnx/taste-skill) by Leon Lin ([@LexnLin](https://x.com/LexnLin)), MIT licensed.

<details>
<summary>taste-skill license</summary>

```
MIT License

Copyright (c) 2026 Leonxlnx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
</details>

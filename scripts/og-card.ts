import { chromium } from '@playwright/test'
import { spiresMarkupOf } from '../src/spires/scene'

const cardPath = new URL('../public/og/home.png', import.meta.url).pathname
const fontsDirectory = new URL('../node_modules/@fontsource/', import.meta.url).pathname
const markSvg = await Bun.file(new URL('../public/favicon.svg', import.meta.url).pathname).text()

async function fontFace(family: string, file: string, weight: number): Promise<string> {
  const bytes = await Bun.file(`${fontsDirectory}${file}`).bytes()
  return `@font-face { font-family: ${family}; font-weight: ${weight}; src: url(data:font/woff2;base64,${Buffer.from(bytes).toBase64()}) format('woff2'); }`
}

const fontFaces = await Promise.all([
  fontFace('Newsreader', 'newsreader/files/newsreader-latin-400-normal.woff2', 400),
  fontFace('Outfit', 'outfit/files/outfit-latin-400-normal.woff2', 400),
  fontFace('Outfit', 'outfit/files/outfit-latin-500-normal.woff2', 500),
])

const cardHtml = `<!doctype html>
<html>
<head>
<style>
${fontFaces.join('\n')}
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; background: #0d0d0f; color: #ebedf3; font-family: Outfit; position: relative; }
.spires { position: absolute; right: 0; top: 0; width: 560px; height: 630px; mask-image: linear-gradient(to right, transparent, black 30%); }
.text-spire-far { color: color-mix(in oklab, #9a9ca2 16%, transparent); }
.text-spire-mid { color: color-mix(in oklab, #ffe165 34%, transparent); }
.text-spire-near { color: color-mix(in oklab, #ffe165 58%, transparent); }
.text-spire-light { color: #ffea92; }
.text-spire-glow { color: color-mix(in oklab, #ffe165 16%, transparent); }
.content { position: absolute; left: 80px; top: 72px; bottom: 72px; width: 700px; display: flex; flex-direction: column; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 16px; font-weight: 500; font-size: 36px; }
.brand svg { width: 48px; height: 48px; }
h1 { font-family: Newsreader; font-weight: 400; font-size: 84px; line-height: 1; letter-spacing: -0.01em; text-wrap: balance; }
.address { font-size: 28px; color: #9a9ca2; }
</style>
</head>
<body>
<svg class="spires" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice">${spiresMarkupOf('card-spires', true)}</svg>
<div class="content">
<div class="brand">${markSvg}Spyria</div>
<h1>Everyone works with agents. Rarely together.</h1>
<p class="address">spyria.dev</p>
</div>
</body>
</html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(cardHtml)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: cardPath })
await browser.close()
console.log(`Social card written to ${cardPath}`)

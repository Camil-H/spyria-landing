import { Glob } from 'bun'
import { builtHtmlPages, distDirectory } from './built-site'

const homeTransferLimitBytes = 300 * 1024
const analyticsBeaconUrl = 'https://static.cloudflareinsights.com/beacon.min.js'
const searchScriptUrl = '/pagefind/pagefind-component-ui.js'
const searchDirectory = 'pagefind/'
const spiresScriptPattern = /^\/_astro\/Spires\.[^"]+\.js$/
const spiresScriptLimitBytes = 15 * 1024

const gzippedBytes = (text: string) => Bun.gzipSync(new TextEncoder().encode(text)).byteLength
const pages = await builtHtmlPages()
const failures: string[] = []
const scriptSourceOf = (attributes = '') => attributes.match(/\ssrc="([^"]+)"/)?.[1] ?? ''

const homeSpiresScripts = [
  ...(pages.find(({ path }) => path === 'index.html')?.html.matchAll(/<script\b([^>]*)>/g) ?? []),
]
  .map(([, attributes]) => scriptSourceOf(attributes))
  .filter((source) => spiresScriptPattern.test(source))
if (homeSpiresScripts.length !== 1)
  failures.push(`index.html: expected the spires script once, found ${homeSpiresScripts.length}`)
const spiresScriptFile = homeSpiresScripts[0]?.slice(1) ?? ''
const spiresScriptBytes = spiresScriptFile ? gzippedBytes(await Bun.file(distDirectory + spiresScriptFile).text()) : 0
if (spiresScriptBytes > spiresScriptLimitBytes)
  failures.push(
    `${spiresScriptFile}: ${kilobytes(spiresScriptBytes)} gzip exceeds ${kilobytes(spiresScriptLimitBytes)}`,
  )

const shippedScriptFiles = await Array.fromAsync(new Glob('**/*.{js,mjs}').scan(distDirectory))
for (const scriptFile of shippedScriptFiles) {
  if (!scriptFile.startsWith(searchDirectory) && scriptFile !== spiresScriptFile)
    failures.push(`dist/${scriptFile}: only the spires on Home and the docs search ship JavaScript files`)
}

const headers = await Bun.file(`${distDirectory}_headers`).text()
for (const { path, html } of pages) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
  const themeScripts = scripts.filter(([, attributes]) => /\sdata-theme-script\b/.test(` ${attributes}`))
  const searchScripts = scripts.filter(([, attributes]) => attributes?.includes(`src="${searchScriptUrl}"`))
  const isHome = path === 'index.html'
  const otherScripts = scripts.filter(
    ([, attributes]) =>
      !/\sdata-theme-script\b/.test(` ${attributes}`) &&
      !attributes?.includes(`src="${analyticsBeaconUrl}"`) &&
      !attributes?.includes(`src="${searchScriptUrl}"`) &&
      !(isHome && spiresScriptPattern.test(scriptSourceOf(attributes))),
  )
  const isDocsPage = /^docs[./]/.test(path)
  if (themeScripts.length !== 1)
    failures.push(`${path}: expected the inline theme script once, found ${themeScripts.length}`)
  if (searchScripts.length !== (isDocsPage ? 1 : 0))
    failures.push(
      `${path}: expected the docs search script ${isDocsPage ? 'once' : 'nowhere'}, found ${searchScripts.length}`,
    )
  for (const [tag] of otherScripts) failures.push(`${path}: unexpected script ${tag.slice(0, 80)}`)
  for (const [inlineStyle] of html.matchAll(/<style\b|\sstyle="[^"]*"/g))
    failures.push(`${path}: ${inlineStyle.trim()} is blocked by the Content-Security-Policy (style-src 'self')`)
  for (const [, , content] of themeScripts) {
    const hash = `'sha256-${new Bun.CryptoHasher('sha256').update(content ?? '').digest('base64')}'`
    if (!headers.includes(hash))
      failures.push(`${path}: the Content-Security-Policy in public/_headers must allow ${hash}`)
  }
}

const homeHtml = await Bun.file(`${distDirectory}index.html`).text()
const stylesheetPaths = [...homeHtml.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(
  (m) => m[1] ?? '',
)
const stylesheets = await Promise.all(stylesheetPaths.map((path) => Bun.file(distDirectory + path.slice(1)).text()))
const fontPaths = stylesheets.flatMap((css) =>
  [...css.matchAll(/@font-face\s*{[^}]*?src:\s*url\(([^)]+)\)/g)].map((m) => (m[1] ?? '').replace(/["']/g, '')),
)
const htmlBytes = gzippedBytes(homeHtml)
const cssBytes = stylesheets.reduce((total, css) => total + gzippedBytes(css), 0)
const fontSizes = await Promise.all(fontPaths.map((path) => Bun.file(distDirectory + path.slice(1)).size))
const fontBytes = fontSizes.reduce((total, size) => total + size, 0)
const homeTransferBytes = htmlBytes + cssBytes + fontBytes + spiresScriptBytes
if (homeTransferBytes > homeTransferLimitBytes) {
  failures.push(`Home transfer ${kilobytes(homeTransferBytes)} exceeds ${kilobytes(homeTransferLimitBytes)}`)
}

if (failures.length > 0) {
  console.error(`Budget failures:\n${failures.join('\n')}`)
  process.exit(1)
}
console.log(
  `Budgets: ${pages.length} pages ship only the inline theme script, the spires on Home (${kilobytes(spiresScriptBytes)} gzip of ${kilobytes(spiresScriptLimitBytes)}) and the docs search on docs pages; Home transfer ${kilobytes(homeTransferBytes)} ` +
    `(HTML ${kilobytes(htmlBytes)}, CSS ${kilobytes(cssBytes)} and JavaScript gzipped, ${fontPaths.length} fonts ${kilobytes(fontBytes)}) ` +
    `of ${kilobytes(homeTransferLimitBytes)}.`,
)

function kilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

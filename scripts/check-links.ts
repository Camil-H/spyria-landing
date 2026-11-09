import { builtHtmlPages, distDirectory } from './built-site'

const pagesBuiltInLaterStages = new Set(['/principles', '/install', '/docs'])

const pages = await builtHtmlPages()
const idsByPage = new Map(pages.map(({ path, html }) => [pagePathOf(path), idsIn(html)]))
const brokenLinks: string[] = []

for (const { path, html } of pages) {
  const sourcePage = pagePathOf(path)
  for (const href of hrefsIn(html)) {
    if (/^[a-z]+:/i.test(href) || href.startsWith('//')) continue
    const target = new URL(href, `https://spyria.dev${sourcePage}`)
    const targetPage = target.pathname.replace(/\/$/, '') || '/'
    const anchor = decodeURIComponent(target.hash.slice(1))
    if (pagesBuiltInLaterStages.has(targetPage) && !idsByPage.has(targetPage)) continue
    const targetIds = idsByPage.get(targetPage)
    const isAsset = !targetIds && (await Bun.file(distDirectory + targetPage.slice(1)).exists())
    if (!targetIds && !isAsset) brokenLinks.push(`${path}: ${href} (no such page)`)
    else if (anchor && !targetIds?.has(anchor)) brokenLinks.push(`${path}: ${href} (no #${anchor} on ${targetPage})`)
  }
}

if (brokenLinks.length > 0) {
  console.error(`Broken internal links:\n${brokenLinks.join('\n')}`)
  process.exit(1)
}
console.log(`Links: ${pages.length} pages checked, no broken internal link or anchor.`)

function pagePathOf(htmlPath: string): string {
  const withoutExtension = htmlPath.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '')
  return `/${withoutExtension}`.replace(/\/$/, '') || '/'
}

function hrefsIn(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)].map((match) => decodeHtml(match[1] ?? ''))
}

function idsIn(html: string): Set<string> {
  return new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => decodeHtml(match[1] ?? '')))
}

function decodeHtml(text: string): string {
  return text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'")
}

import { builtHtmlPages, decodeHtml, distDirectory, pagePathOf } from './built-site'

const siteOrigin = 'https://spyria.dev'
const sitemapUrl = `${siteOrigin}/sitemap.xml`
const notFoundPage = '404.html'
const titleLimit = 60
const descriptionLimit = 155

const pages = await builtHtmlPages()
const failures: string[] = []
const firstMatch = (text: string, pattern: RegExp) => {
  const match = text.match(pattern)?.[1]
  return match === undefined ? undefined : decodeHtml(match)
}
const builtFileExists = async (path: string) =>
  path === '/'
    ? Bun.file(`${distDirectory}index.html`).exists()
    : (await Bun.file(distDirectory + path.slice(1)).exists()) ||
      Bun.file(`${distDirectory}${path.slice(1)}.html`).exists()

const pathsByTitle = new Map<string, string[]>()
for (const { path, html } of pages) {
  const title = firstMatch(html, /<title>([^<]*)<\/title>/)
  const description = firstMatch(html, /<meta name="description" content="([^"]*)"/)
  const socialCard = firstMatch(html, /<meta property="og:image" content="([^"]*)"/)
  if (!title) failures.push(`${path}: no <title>`)
  else {
    if (title.length > titleLimit) failures.push(`${path}: title has ${title.length} characters, over ${titleLimit}`)
    pathsByTitle.set(title, [...(pathsByTitle.get(title) ?? []), path])
  }
  if (!description) failures.push(`${path}: no meta description`)
  else if (description.length > descriptionLimit)
    failures.push(`${path}: description has ${description.length} characters, over ${descriptionLimit}`)
  const canonicalUrl = firstMatch(html, /<link rel="canonical" href="([^"]*)"/)
  const pageUrl = new URL(pagePathOf(path), siteOrigin).href
  if (canonicalUrl !== pageUrl) failures.push(`${path}: canonical URL ${canonicalUrl} is not ${pageUrl}`)
  const headingCount = html.match(/<h1\b/g)?.length ?? 0
  if (headingCount !== 1) failures.push(`${path}: expected one <h1>, found ${headingCount}`)
  if (!/<html lang="en"/.test(html)) failures.push(`${path}: <html> has no lang="en"`)
  if (!socialCard) failures.push(`${path}: no og:image`)
  else if (!socialCard.startsWith(siteOrigin) || !(await builtFileExists(new URL(socialCard).pathname)))
    failures.push(`${path}: og:image ${socialCard} is not a file of the site`)
  for (const [, block = ''] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      if (!JSON.parse(block)['@type']) failures.push(`${path}: JSON-LD block without @type`)
    } catch {
      failures.push(`${path}: JSON-LD block does not parse`)
    }
  }
}
for (const [title, paths] of pathsByTitle)
  if (paths.length > 1) failures.push(`Title "${title}" is used by ${paths.join(', ')}`)

const publishedPageUrls = pages
  .filter(({ path }) => path !== notFoundPage)
  .map(({ path }) => new URL(pagePathOf(path), siteOrigin).href)
const sitemap = await Bun.file(`${distDirectory}sitemap.xml`).text()
const sitemapEntries = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)]
const sitemapUrls = sitemapEntries.map(([, url]) => url ?? '')
for (const url of publishedPageUrls) if (!sitemapUrls.includes(url)) failures.push(`sitemap.xml: ${url} is missing`)
for (const [, url, lastModified] of sitemapEntries) {
  if (!publishedPageUrls.includes(url ?? '')) failures.push(`sitemap.xml: ${url} is not a published page`)
  if (!lastModified || Number.isNaN(Date.parse(lastModified))) failures.push(`sitemap.xml: ${url} has no valid lastmod`)
}

const robots = await Bun.file(`${distDirectory}robots.txt`).text()
if (!robots.includes(`Sitemap: ${sitemapUrl}`)) failures.push(`robots.txt: does not name ${sitemapUrl}`)
if (/^\s*Disallow:/im.test(robots)) failures.push('robots.txt: has a Disallow line')

const llmsFile = Bun.file(`${distDirectory}llms.txt`)
const llmsText = (await llmsFile.exists()) ? await llmsFile.text() : ''
if (!llmsText.startsWith('# Spyria\n')) failures.push('llms.txt: missing, or does not start with "# Spyria"')
const llmsSitePaths = [...llmsText.matchAll(/\]\(https:\/\/spyria\.dev(\/[^)\s]*)\)/g)].map(([, path]) => path ?? '')
for (const path of llmsSitePaths)
  if (!(await builtFileExists(path))) failures.push(`llms.txt: ${siteOrigin}${path} is not in dist/`)
for (const { path } of pages.filter(({ path }) => /^docs[./]/.test(path))) {
  const route = pagePathOf(path)
  if (!llmsSitePaths.includes(route) && !llmsSitePaths.includes(`${route}.md`))
    failures.push(`llms.txt: does not link the docs page ${route}`)
}

if (failures.length > 0) {
  console.error(`Search failures:\n${failures.join('\n')}`)
  process.exit(1)
}
console.log(
  `Search: ${pages.length} pages with unique titles, descriptions, canonicals, one h1 and social cards; ` +
    `sitemap.xml lists the ${publishedPageUrls.length} published pages; robots.txt and llms.txt (${llmsSitePaths.length} site links) are in place.`,
)

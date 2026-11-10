import { getCollection } from 'astro:content'
import type { APIRoute } from 'astro'
import { readDocsDates } from '../docs/product'
import { docsRouteOf, isDocsPageIndexed } from '../docs/routes'
import { lastCommitDateOf } from '../search/last-modified'
import { publishedPages } from '../site'

export const GET: APIRoute = async ({ site }) => {
  const docsDates = readDocsDates()
  const docsEntries = await getCollection('docs', ({ id }) => isDocsPageIndexed(id))
  const entries = [
    ...publishedPages.map(({ path, sourceFiles }) => ({ path, lastModified: lastCommitDateOf(sourceFiles) })),
    ...docsEntries.map(({ id }) => ({
      path: docsRouteOf(id),
      lastModified: docsDates[id] ?? new Date().toISOString(),
    })),
  ]
  const urls = entries
    .map(
      ({ path, lastModified }) => `<url><loc>${new URL(path, site).href}</loc><lastmod>${lastModified}</lastmod></url>`,
    )
    .join('\n')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  return new Response(sitemap, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}

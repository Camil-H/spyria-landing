import { getCollection } from 'astro:content'
import type { APIRoute, GetStaticPaths } from 'astro'
import { readProductRef } from '../docs/product'
import { docsRouteOf } from '../docs/routes'
import { markdownTwin } from '../docs/twins'
import { docsPublished } from '../site'

export const getStaticPaths = (async () => {
  if (!docsPublished) return []
  const entries = await getCollection('docs')
  return entries.map((entry) => ({
    params: { path: docsRouteOf(entry.id).slice(1) },
    props: { docsPath: entry.id, markdown: entry.body ?? '' },
  }))
}) satisfies GetStaticPaths

export const GET: APIRoute = ({ props, site }) => {
  const twin = markdownTwin(props.markdown, {
    fromDocsPath: props.docsPath,
    productRef: readProductRef(),
    siteOrigin: site?.origin ?? '',
  })
  return new Response(twin, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}

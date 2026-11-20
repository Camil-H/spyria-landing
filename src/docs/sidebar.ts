import { getEntry } from 'astro:content'
import { type DocsPage, docsSections, installOverviewRoute } from './routes'

export interface DocsLink {
  label: string
  route: string
}

export interface DocsLinkGroup {
  title: string
  links: DocsLink[]
}

export async function loadDocsLinkGroups(): Promise<DocsLinkGroup[]> {
  const overview = { label: 'Overview', route: installOverviewRoute }
  return (await loadDocsPageLinkGroups()).map((group, position) =>
    position === 0 ? { ...group, links: [overview, ...group.links] } : group,
  )
}

export function loadDocsPageLinkGroups(): Promise<DocsLinkGroup[]> {
  return Promise.all(
    docsSections.map(async ({ title, pages }) => ({ title, links: await Promise.all(pages.map(loadDocsPageLink)) })),
  )
}

async function loadDocsPageLink({ docsPath, route }: DocsPage): Promise<DocsLink> {
  const entry = await getEntry('docs', docsPath)
  return { label: entry?.body?.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? docsPath, route }
}

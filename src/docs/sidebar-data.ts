import { getEntry } from 'astro:content'
import { docsPublished } from '../site'
import { installGuides } from './routes'
import { type DocsSection, parseDocsSidebar } from './sidebar'

export async function loadDocsSidebar(): Promise<DocsSection[]> {
  if (!docsPublished) return [await loadInstallSection()]
  const [docsIndex, decisionsIndex] = await Promise.all([
    getEntry('docs', 'README.md'),
    getEntry('docs', 'decisions/README.md'),
  ])
  return parseDocsSidebar(docsIndex?.body ?? '', decisionsIndex?.body ?? '')
}

async function loadInstallSection(): Promise<DocsSection> {
  const links = await Promise.all(
    installGuides.map(async ({ docsPath }) => {
      const entry = await getEntry('docs', docsPath)
      return { label: entry?.body?.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? docsPath, docsPath }
    }),
  )
  return { title: 'Install', links }
}

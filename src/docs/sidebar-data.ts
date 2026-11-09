import { getEntry } from 'astro:content'
import { parseDocsSidebar } from './sidebar'

export async function loadDocsSidebar() {
  const [docsIndex, decisionsIndex] = await Promise.all([
    getEntry('docs', 'README.md'),
    getEntry('docs', 'decisions/README.md'),
  ])
  return parseDocsSidebar(docsIndex?.body ?? '', decisionsIndex?.body ?? '')
}

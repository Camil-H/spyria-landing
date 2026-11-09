import { posix } from 'node:path'

export interface DocsLink {
  label: string
  docsPath: string
}

export interface DocsSection {
  title: string
  links: DocsLink[]
}

const decisionsIndexPath = 'decisions/README.md'

export function parseDocsSidebar(docsIndexMarkdown: string, decisionsIndexMarkdown: string): DocsSection[] {
  const sections: DocsSection[] = []
  for (const line of docsIndexMarkdown.split('\n')) {
    const sectionTitle = line.match(/^##\s+(.+)$/)?.[1]
    if (sectionTitle) sections.push({ title: plainText(sectionTitle), links: [] })
    const listLink = line.match(/^[-*]\s+\[([^\]]+)\]\(([^)#\s]+)[^)]*\)/)
    const section = sections.at(-1)
    if (!listLink || !section) continue
    const docsPath = posix.normalize(listLink[2] ?? '')
    section.links.push({ label: plainText(listLink[1] ?? ''), docsPath })
    if (docsPath === decisionsIndexPath) section.links.push(...decisionLinks(decisionsIndexMarkdown))
  }
  return sections
}

export function docsReadingOrder(sections: DocsSection[]): DocsLink[] {
  return [{ label: 'Documentation', docsPath: 'README.md' }, ...sections.flatMap(({ links }) => links)]
}

function decisionLinks(decisionsIndexMarkdown: string): DocsLink[] {
  return decisionsIndexMarkdown.split('\n').flatMap((line) => {
    const row = line.match(/^\|\s*\[([^\]]+)\]\(([^)\s]+)\)\s*\|\s*(.+?)\s*\|\s*$/)
    if (!row) return []
    const [, number = '', path = '', title = ''] = row
    return [{ label: `${number} ${plainText(title)}`, docsPath: posix.join('decisions', path) }]
  })
}

function plainText(markdown: string): string {
  return markdown.replace(/`([^`]*)`/g, '$1').trim()
}

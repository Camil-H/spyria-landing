import { type MdastNode, markdownToMdast } from 'satteri'
import { type DocsLinkContext, rewriteDocsHref } from './links'

interface Destination {
  start: number
  end: number
  url: string
}

export function markdownTwin(source: string, context: Required<DocsLinkContext>): string {
  const destinations = linkDestinations(source).sort((first, second) => second.start - first.start)
  return destinations.reduce(
    (text, { start, end, url }) => text.slice(0, start) + rewriteDocsHref(url, context) + text.slice(end),
    source,
  )
}

function linkDestinations(source: string): Destination[] {
  const destinations: Destination[] = []
  const visit = (node: MdastNode) => {
    if ((node.type === 'link' || node.type === 'definition') && node.position) {
      const destination = destinationIn(source, node.position.start.offset ?? 0, node.position.end.offset ?? 0)
      if (destination) destinations.push(destination)
    }
    if ('children' in node) for (const child of node.children as MdastNode[]) visit(child)
  }
  visit(markdownToMdast(source))
  return destinations
}

function destinationIn(source: string, nodeStart: number, nodeEnd: number): Destination | undefined {
  const nodeText = source.slice(nodeStart, nodeEnd)
  const opening = nodeText.match(/\]\(\s*<?|\]:\s*<?/g)
  if (!opening) return undefined
  const lastOpening = opening.at(-1) ?? ''
  const start = nodeStart + nodeText.lastIndexOf(lastOpening) + lastOpening.length
  const url = source.slice(start, nodeEnd).match(/^[^\s)>]+/)?.[0]
  return url ? { start, end: start + url.length, url } : undefined
}

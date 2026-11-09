import { posix } from 'node:path'
import { productFileUrl } from './product'
import { docsRouteOf } from './routes'

export interface DocsLinkContext {
  fromDocsPath: string
  productRef: string
  siteOrigin?: string
}

class DocsLinkError extends Error {}

export function rewriteDocsHref(href: string, { fromDocsPath, productRef, siteOrigin = '' }: DocsLinkContext): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//') || href.startsWith('#')) return href
  const [, linkPath = '', suffix = ''] = href.match(/^([^?#]*)(.*)$/) ?? []
  const repositoryPath = posix.normalize(posix.join('docs', posix.dirname(fromDocsPath), linkPath))
  if (repositoryPath.startsWith('../'))
    throw new DocsLinkError(`${fromDocsPath}: ${href} leaves the product repository`)
  const docsPath = repositoryPath === 'docs' ? '' : repositoryPath.startsWith('docs/') ? repositoryPath.slice(5) : null
  if (docsPath === null) return productFileUrl(repositoryPath, productRef) + suffix
  if (docsPath.endsWith('.md')) return siteOrigin + docsRouteOf(docsPath) + suffix
  if (linkPath.endsWith('/') || docsPath === '' || !posix.extname(docsPath)) {
    return siteOrigin + docsRouteOf(posix.join(docsPath, 'README.md')) + suffix
  }
  return productFileUrl(repositoryPath, productRef) + suffix
}

import { posix } from 'node:path'
import { productFileUrl } from './product'
import { docsRouteOf, isInstallGuide } from './routes'

export interface DocsLinkContext {
  fromDocsPath: string
  productRef: string
  docsPublished: boolean
  siteOrigin?: string
}

class DocsLinkError extends Error {}

export function rewriteDocsHref(href: string, context: DocsLinkContext): string {
  const { fromDocsPath, productRef } = context
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//') || href.startsWith('#')) return href
  const [, linkPath = '', suffix = ''] = href.match(/^([^?#]*)(.*)$/) ?? []
  const repositoryPath = posix.normalize(posix.join('docs', posix.dirname(fromDocsPath), linkPath))
  if (repositoryPath.startsWith('../'))
    throw new DocsLinkError(`${fromDocsPath}: ${href} leaves the product repository`)
  const docsPath = repositoryPath === 'docs' ? '' : repositoryPath.startsWith('docs/') ? repositoryPath.slice(5) : null
  if (docsPath === null) return productFileUrl(repositoryPath, productRef) + suffix
  if (docsPath.endsWith('.md')) return docsPageUrl(docsPath, context) + suffix
  if (linkPath.endsWith('/') || docsPath === '' || !posix.extname(docsPath)) {
    return docsPageUrl(posix.join(docsPath, 'README.md'), context) + suffix
  }
  return productFileUrl(repositoryPath, productRef) + suffix
}

function docsPageUrl(docsPath: string, { productRef, docsPublished, siteOrigin = '' }: DocsLinkContext): string {
  if (docsPublished || isInstallGuide(docsPath)) return siteOrigin + docsRouteOf(docsPath)
  return productFileUrl(posix.join('docs', docsPath), productRef)
}

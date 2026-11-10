import { docsPublished, installPublished } from '../site'

export const installGuides = [
  { docsPath: 'guides/install.md', route: '/docs/install' },
  { docsPath: 'guides/cloud.md', route: '/docs/install/cloud' },
  { docsPath: 'guides/who-can-join.md', route: '/docs/install/who-can-join' },
  { docsPath: 'guides/operations.md', route: '/docs/install/operations' },
  { docsPath: 'guides/troubleshooting.md', route: '/docs/install/troubleshooting' },
  { docsPath: 'guides/self-hosting.md', route: '/docs/install/manual-install' },
  { docsPath: 'features/machines.md', route: '/docs/install/machines' },
  { docsPath: 'features/admin.md', route: '/docs/install/administration' },
]

export function isInstallGuide(docsPath: string): boolean {
  return installGuides.some((guide) => guide.docsPath === docsPath)
}

export function isDocsPageBuilt(docsPath: string): boolean {
  return docsPublished || isInstallGuide(docsPath)
}

export function isDocsPageIndexed(docsPath: string): boolean {
  return isInstallGuide(docsPath) ? installPublished : docsPublished
}

export function docsRouteOf(docsPath: string): string {
  const installGuide = installGuides.find((guide) => guide.docsPath === docsPath)
  if (installGuide) return installGuide.route
  const withoutExtension = docsPath.replace(/\.md$/, '')
  const withoutReadme = withoutExtension.replace(/(^|\/)README$/, '')
  return withoutReadme ? `/docs/${withoutReadme}` : '/docs'
}

export function docsSlugOf(docsPath: string): string | undefined {
  return docsRouteOf(docsPath).slice('/docs/'.length) || undefined
}

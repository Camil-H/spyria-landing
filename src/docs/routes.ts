export const installOverviewRoute = '/docs/install'

export const installGuides = [
  { docsPath: 'guides/install.md', route: '/docs/install/one-machine' },
  { docsPath: 'guides/cloud.md', route: '/docs/install/cloud' },
  { docsPath: 'guides/who-can-join.md', route: '/docs/install/who-can-join' },
  { docsPath: 'guides/operations.md', route: '/docs/install/operations' },
  { docsPath: 'guides/troubleshooting.md', route: '/docs/install/troubleshooting' },
  { docsPath: 'guides/self-hosting.md', route: '/docs/install/manual-install' },
  { docsPath: 'features/machines.md', route: '/docs/install/machines' },
]

class NotAnInstallGuideError extends Error {}

export function isInstallGuide(docsPath: string): boolean {
  return installGuides.some((guide) => guide.docsPath === docsPath)
}

export function docsRouteOf(docsPath: string): string {
  const installGuide = installGuides.find((guide) => guide.docsPath === docsPath)
  if (!installGuide)
    throw new NotAnInstallGuideError(`${docsPath} is not an install guide, so the site has no page for it`)
  return installGuide.route
}

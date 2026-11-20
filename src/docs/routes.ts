export const installOverviewRoute = '/docs/install'

export interface DocsPage {
  docsPath: string
  route: string
}

export interface DocsSection {
  title: string
  pages: DocsPage[]
}

export const docsSections: DocsSection[] = [
  {
    title: 'Install and run',
    pages: [
      { docsPath: 'guides/install.md', route: '/docs/install/one-machine' },
      { docsPath: 'guides/cloud-aws.md', route: '/docs/install/aws' },
      { docsPath: 'guides/cloud-azure.md', route: '/docs/install/azure' },
      { docsPath: 'guides/cloud-gcp.md', route: '/docs/install/google-cloud' },
      { docsPath: 'guides/self-hosting.md', route: '/docs/install/manual-install' },
      { docsPath: 'guides/operations.md', route: '/docs/install/operations' },
      { docsPath: 'guides/security.md', route: '/docs/install/security' },
      { docsPath: 'guides/troubleshooting.md', route: '/docs/install/troubleshooting' },
    ],
  },
  {
    title: 'Using Spyria',
    pages: [
      { docsPath: 'features/chats-and-sharing.md', route: '/docs/chats-and-sharing' },
      { docsPath: 'features/agents.md', route: '/docs/agents' },
      { docsPath: 'features/machines.md', route: '/docs/machines' },
      { docsPath: 'features/dev-mode.md', route: '/docs/dev-mode' },
      { docsPath: 'features/admin.md', route: '/docs/administration' },
      { docsPath: 'guides/who-can-join.md', route: '/docs/who-can-join' },
    ],
  },
]

export const docsPages = docsSections.flatMap((section) => section.pages)

class NotAPublishedDocsPageError extends Error {}

export function isPublishedDocsPage(docsPath: string): boolean {
  return docsPages.some((page) => page.docsPath === docsPath)
}

export function docsRouteOf(docsPath: string): string {
  const docsPage = docsPages.find((page) => page.docsPath === docsPath)
  if (!docsPage)
    throw new NotAPublishedDocsPageError(`${docsPath} is not a published docs page, so the site has no page for it`)
  return docsPage.route
}

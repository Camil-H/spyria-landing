import { getEntry } from 'astro:content'
import { installGuides, installOverviewRoute } from './routes'

export interface InstallLink {
  label: string
  route: string
}

export async function loadInstallLinks(): Promise<InstallLink[]> {
  return [{ label: 'Overview', route: installOverviewRoute }, ...(await loadInstallGuideLinks())]
}

export function loadInstallGuideLinks(): Promise<InstallLink[]> {
  return Promise.all(
    installGuides.map(async ({ docsPath, route }) => {
      const entry = await getEntry('docs', docsPath)
      return { label: entry?.body?.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? docsPath, route }
    }),
  )
}

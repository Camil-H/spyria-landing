export function docsRouteOf(docsPath: string): string {
  const withoutExtension = docsPath.replace(/\.md$/, '')
  const withoutReadme = withoutExtension.replace(/(^|\/)README$/, '')
  return withoutReadme ? `/docs/${withoutReadme}` : '/docs'
}

export function docsSlugOf(docsPath: string): string | undefined {
  return docsRouteOf(docsPath).slice('/docs/'.length) || undefined
}

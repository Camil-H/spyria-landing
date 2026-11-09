export const productRepositoryUrl = 'https://github.com/Camil-H/spyria'
export const productLicenseUrl = `${productRepositoryUrl}/blob/main/LICENSE`

export const docsPublished = false
export const principlesPublished = false
export const installPublished = false

export const navigation = [
  ...(principlesPublished ? [{ label: 'Principles', href: '/principles' }] : []),
  ...(installPublished ? [{ label: 'Install', href: '/install' }] : []),
  ...(docsPublished ? [{ label: 'Docs', href: '/docs' }] : []),
]

export const publishedPages = [{ path: '/', sourceFiles: ['src/pages/index.astro', 'src/components/Transcript.astro'] }]

export const productRepositoryUrl = 'https://github.com/Camil-H/spyria'
export const productLicenseUrl = `${productRepositoryUrl}/blob/main/LICENSE`

export const navigation = [{ label: 'Install', href: '/docs/install' }]

export const publishedPages = [
  { path: '/', sourceFiles: ['src/pages/index.astro', 'src/components/Transcript.astro'] },
  { path: '/docs/install', sourceFiles: ['src/pages/docs/install.astro'] },
]

export const productRepositoryUrl = 'https://github.com/Camil-H/spyria'
export const productLicenseUrl = `${productRepositoryUrl}/blob/main/LICENSE`

export const docsPublished = false

export const navigation = [
  { label: 'Principles', href: '/principles' },
  { label: 'Install', href: '/install' },
  ...(docsPublished ? [{ label: 'Docs', href: '/docs' }] : []),
]

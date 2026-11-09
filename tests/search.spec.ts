import { expect, test } from '@playwright/test'
import { docsPublished, productLicenseUrl, productRepositoryUrl } from '../src/site'

const siteOrigin = 'https://spyria.dev'
const sitePathOf = (url: string) => new URL(url).pathname

test('As a crawler, I fetch /robots.txt and find the sitemap, nothing disallowed, and the content signals', async ({
  request,
}) => {
  const response = await request.get('/robots.txt')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('text/plain')
  const robots = await response.text()
  expect(robots).toContain('User-agent: *')
  expect(robots).toContain('Allow: /')
  expect(robots).not.toMatch(/^\s*Disallow:/im)
  expect(robots).toContain('Content-Signal: search=yes, ai-input=yes, ai-train=yes')
  expect(robots).toContain(`Sitemap: ${siteOrigin}/sitemap.xml`)
})

test('As a crawler, I fetch /sitemap.xml and find every published page with its last-modified date', async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/xml/)
  const entries = [
    ...(await response.text()).matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g),
  ].map(([, url, lastModified]) => ({ url, lastModified }))
  const urls = entries.map(({ url }) => url)
  expect(urls).toContain(`${siteOrigin}/`)
  expect(urls.includes(`${siteOrigin}/docs`)).toBe(docsPublished)
  expect(urls.filter((url) => url?.includes('404'))).toEqual([])
  for (const { url, lastModified } of entries) {
    expect(Date.parse(lastModified ?? ''), `${url} lastmod`).not.toBeNaN()
    expect((await request.get(sitePathOf(url ?? ''))).status(), url).toBe(200)
  }
})

test("As a search engine, I read Home's JSON-LD and get Organization, WebSite and SoftwareApplication, with the licence and repository", async ({
  page,
}) => {
  await page.goto('/')
  const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((text) =>
    JSON.parse(text),
  )
  expect(blocks.map((block) => block['@type'])).toEqual(['Organization', 'WebSite', 'SoftwareApplication'])
  const description = await page.locator('meta[name="description"]').getAttribute('content')
  expect(blocks[2]).toMatchObject({
    name: 'Spyria',
    description,
    applicationCategory: 'DeveloperApplication',
    license: productLicenseUrl,
    sameAs: [productRepositoryUrl],
    offers: { price: '0' },
  })
  expect(blocks[0]).toMatchObject({ name: 'Spyria', url: `${siteOrigin}/` })
  expect((await page.request.get(sitePathOf(blocks[0].logo))).status()).toBe(200)
})

test('As someone sharing a link, Home declares its card title, description and a 1200×630 image that loads', async ({
  page,
}) => {
  await page.goto('/')
  const metaContent = (selector: string) => page.locator(`meta[${selector}]`).getAttribute('content')
  const title = await page.title()
  const description = await metaContent('name="description"')
  expect(await metaContent('name="twitter:card"')).toBe('summary_large_image')
  expect(await metaContent('property="og:title"')).toBe(title)
  expect(await metaContent('name="twitter:title"')).toBe(title)
  expect(await metaContent('property="og:description"')).toBe(description)
  expect(await metaContent('name="twitter:description"')).toBe(description)
  expect(await metaContent('property="og:image:alt"')).toBeTruthy()
  const imageUrl = (await metaContent('property="og:image"')) ?? ''
  expect(imageUrl.startsWith(`${siteOrigin}/`)).toBe(true)
  expect(await metaContent('name="twitter:image"')).toBe(imageUrl)

  const image = await page.request.get(sitePathOf(imageUrl))
  expect(image.status()).toBe(200)
  expect(image.headers()['content-type']).toBe('image/png')
  const pngHeader = Buffer.from(await image.body())
  expect([pngHeader.readUInt32BE(16), pngHeader.readUInt32BE(20)]).toEqual([1200, 630])
})

test('As a coding agent, I fetch /llms.txt and get the summary and links', async ({ request }) => {
  const response = await request.get('/llms.txt')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('text/plain')
  const llmsText = await response.text()
  expect(llmsText.startsWith('# Spyria\n\n> Spyria is a self-hosted workspace')).toBe(true)
  expect(llmsText).toContain('Business Source License 1.1')
  expect(llmsText).not.toMatch(/open source/i)
  expect(llmsText).toContain(`[Home](${siteOrigin}/)`)
  expect(llmsText).toContain(
    docsPublished ? `(${siteOrigin}/docs.md)` : `(${productRepositoryUrl}/blob/main/docs/guides/self-hosting.md)`,
  )
  for (const [, path] of llmsText.matchAll(/\]\(https:\/\/spyria\.dev(\/[^)\s]*)\)/g))
    expect((await request.get(path ?? '')).status(), path).toBe(200)
})

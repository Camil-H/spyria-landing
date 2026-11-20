import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const pages = [
  { name: 'Home', path: '/', heading: 'Everyone works with agents. Rarely together.' },
  { name: 'the install overview', path: '/docs/install', heading: 'Install Spyria' },
  { name: '404', path: '/a-page-that-does-not-exist', heading: 'This page does not exist' },
]

for (const { name, path, heading } of pages) {
  test(`As a visitor on a 360 px phone, I read ${name} without scrolling sideways`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('As a visitor on a missing page, I see the 404 page with a link to Home and none to a docs index', async ({
  page,
}) => {
  const response = await page.goto('/a-page-that-does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/')
  await expect(page.getByRole('link', { name: 'Read the docs' })).toHaveCount(0)
})

test('As a visitor, the product docs outside the published pages are not served on the site and Home links only to the install pages', async ({
  page,
}) => {
  expect((await page.goto('/docs'))?.status()).toBe(404)
  expect((await page.goto('/docs/architecture/overview'))?.status()).toBe(404)
  expect((await page.request.get('/docs/architecture/overview.md')).status()).toBe(404)
  await page.goto('/')
  await expect(page.locator('a[href^="/docs"]:not([href^="/docs/install"])')).toHaveCount(0)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Home has no serious or critical accessibility violation in ${colorScheme}`, async ({ page }) => {
    test.slow()
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await page.goto('/')
    const results = await new AxeBuilder({ page }).exclude('svg[aria-hidden="true"]').analyze()
    const blocking = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')
    expect(blocking.map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`)).toEqual(
      [],
    )
  })
}

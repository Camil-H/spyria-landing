import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const pages = [
  { name: 'Home', path: '/', heading: 'Agents work alone. Your team does not.' },
  { name: '404', path: '/a-page-that-does-not-exist', heading: 'This page does not exist' },
]

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false })

  test('As an engineering lead, I read the Home headings and text without JavaScript', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Agents work alone. Your team does not.')
    await expect(page.getByRole('heading', { level: 2, name: 'Agents are single-player today' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Install on your own server' })).toBeVisible()
    await expect(page.getByText('nobody can step into', { exact: false })).toBeVisible()
    await expect(page.getByText('curl -fsSL https://spyria.dev/install.sh | sh')).toBeVisible()
  })
})

for (const { name, path, heading } of pages) {
  test(`As a visitor on a 360 px phone, I read ${name} without scrolling sideways`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('As a visitor on a missing page, I see the 404 page with links to Home and Docs', async ({ page }) => {
  const response = await page.goto('/a-page-that-does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/')
  await expect(page.getByRole('link', { name: 'Read the docs' })).toHaveAttribute('href', '/docs')
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Home has no serious or critical accessibility violation in ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/')
    const results = await new AxeBuilder({ page }).analyze()
    const blocking = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')
    expect(blocking.map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`)).toEqual(
      [],
    )
  })
}

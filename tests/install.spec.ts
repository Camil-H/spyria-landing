import { readFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { installGuides } from '../src/docs/routes'
import { installPublished } from '../src/site'

const siteOrigin = 'https://spyria.dev'
const installRoutes = installGuides.map(({ route }) => route)
const productRef = readFileSync(new URL('../product.ref', import.meta.url), 'utf8').trim()

test('As an engineering lead, I click "Install on your server" on Home and land on the install guide with the curl command', async ({
  page,
}) => {
  await page.goto('/')
  const installLink = page.getByRole('link', { name: 'Install on your server' })
  if (installPublished) {
    await installLink.click()
    await expect(page).toHaveURL(/\/docs\/install$/)
  } else {
    await expect(installLink).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Install' })).toHaveCount(0)
    await page.goto('/docs/install')
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Install on one machine')
  await expect(page.getByRole('article')).toContainText('curl -fsSL https://spyria.dev/install | sh')
})

test('As an operator, I fetch /install and get the shell script as plain text', async ({ request }) => {
  const response = await request.get('/install')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('text/plain; charset=utf-8')
  expect((await response.text()).startsWith('#!/bin/sh\n')).toBe(true)
})

test('As a reader of the install guide, I move to the cloud guide and then to troubleshooting through the sidebar', async ({
  page,
}) => {
  await page.goto('/docs/install')
  const sidebar = page.getByRole('navigation', { name: 'Docs' })
  await expect(sidebar.getByRole('link', { name: 'Install on one machine' })).toHaveAttribute('aria-current', 'page')
  await sidebar.getByRole('link', { name: 'Install on AWS, Azure or Google Cloud' }).click()
  await expect(page).toHaveURL(/\/docs\/install\/cloud$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Install on AWS, Azure or Google Cloud')
  await sidebar.getByRole('link', { name: 'Troubleshooting' }).click()
  await expect(page).toHaveURL(/\/docs\/install\/troubleshooting$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Troubleshooting')
})

test('As a reader of an install guide, I follow a link to a decision and land on that file on GitHub at the synced commit', async ({
  page,
}) => {
  await page.goto('/docs/install/who-can-join')
  const decisionLink = page.getByRole('article').locator('a[href*="/docs/decisions/0012-per-workspace-sso"]').first()
  await expect(decisionLink).toHaveAttribute(
    'href',
    `https://github.com/Camil-H/spyria/blob/${productRef}/docs/decisions/0012-per-workspace-sso.md`,
  )
})

test('As a reader on a 360 px phone, I read every install page without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  for (const route of installRoutes) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 }), route).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, route).toBeLessThanOrEqual(0)
  }
})

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false })

  test('As a reader, I read every install page without JavaScript', async ({ page }) => {
    for (const route of installRoutes) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 }), route).toBeVisible()
      expect((await page.getByRole('article').textContent())?.trim().length, route).toBeGreaterThan(200)
    }
  })
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Every install page has no serious or critical accessibility violation in ${colorScheme}`, async ({ page }) => {
    test.slow()
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    for (const route of installRoutes) {
      await page.goto(route)
      const results = await new AxeBuilder({ page }).exclude('svg[aria-hidden="true"]').analyze()
      const blocking = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')
      expect(
        blocking.map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`),
        route,
      ).toEqual([])
    }
  })
}

test('As a crawler, I find the install pages and their Markdown twins in sitemap.xml and llms.txt once they are published, and noindex before', async ({
  page,
  request,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  const llmsText = await (await request.get('/llms.txt')).text()
  for (const route of installRoutes) {
    expect(sitemap.includes(`<loc>${siteOrigin}${route}</loc>`), route).toBe(installPublished)
    expect(llmsText.includes(`(${siteOrigin}${route}.md)`), route).toBe(installPublished)
    const twin = await request.get(`${route}.md`)
    expect(twin.status(), `${route}.md`).toBe(200)
    expect(twin.headers()['content-type'], `${route}.md`).toContain('text/markdown')
    await page.goto(route)
    await expect(page.locator('meta[name="robots"][content="noindex"]'), route).toHaveCount(installPublished ? 0 : 1)
  }
})

test('As a visitor, the install pages run within their Content-Security-Policy', async ({ page }) => {
  await page.addInitScript(() => {
    const reported = window as unknown as { cspViolations: string[] }
    reported.cspViolations = []
    document.addEventListener('securitypolicyviolation', (event) => {
      reported.cspViolations.push(`${event.violatedDirective} ${event.blockedURI}`)
    })
  })
  for (const route of installRoutes) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 }), route).toBeVisible()
    await page.waitForTimeout(200)
    expect(await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations), route).toEqual(
      [],
    )
  }
  expect((await page.request.get('/docs/install')).headers()['content-security-policy']).toContain("style-src 'self'")
})

test('As a visitor, no page links to /principles and /principles shows the 404 page', async ({ page }) => {
  for (const route of ['/', ...installRoutes]) {
    await page.goto(route)
    await expect(page.locator('a[href^="/principles"]'), route).toHaveCount(0)
  }
  expect((await page.goto('/principles'))?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page does not exist')
})

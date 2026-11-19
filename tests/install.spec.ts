import { readFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { installGuides, installOverviewRoute } from '../src/docs/routes'

const siteOrigin = 'https://spyria.dev'
const installGuideRoutes = installGuides.map(({ route }) => route)
const installRoutes = [installOverviewRoute, ...installGuideRoutes]
const productRef = readFileSync(new URL('../product.ref', import.meta.url), 'utf8').trim()

test('As a visitor on Home, I follow "Install Spyria", see the three options and open the guide to test locally', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Install Spyria' }).click()
  await expect(page).toHaveURL(/\/docs\/install$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Install Spyria')
  const article = page.getByRole('article')
  for (const option of ['Test locally', 'On a server', 'On a cloud'])
    await expect(article.getByRole('heading', { level: 2, name: option })).toBeVisible()
  await expect(article).toContainText('curl -fsSL https://spyria.dev/install | sh')
  await article
    .locator('section', { has: page.getByRole('heading', { name: 'Test locally' }) })
    .getByRole('link')
    .click()
  await expect(page).toHaveURL(/\/docs\/install\/one-machine$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Install on one machine')
  await expect(page.getByRole('article')).toContainText('curl -fsSL https://spyria.dev/install | sh')
})

test("As a visitor, I open each option's guide from /docs/install and each guide loads", async ({ page }) => {
  const guidesByOption = {
    'Test locally': [{ link: 'One-machine install', heading: 'Install on one machine' }],
    'On a server': [
      { link: 'One-machine install', heading: 'Install on one machine' },
      { link: 'Manual install', heading: 'Manual install' },
    ],
    'On a cloud': [
      { link: 'AWS', heading: 'Install on AWS' },
      { link: 'Azure', heading: 'Install on Azure' },
      { link: 'Google Cloud', heading: 'Install on Google Cloud' },
    ],
  }
  for (const [option, guides] of Object.entries(guidesByOption)) {
    for (const { link, heading } of guides) {
      await page.goto('/docs/install')
      await page
        .getByRole('article')
        .locator('section', { has: page.getByRole('heading', { name: option }) })
        .getByRole('link', { name: link })
        .click()
      await expect(page.getByRole('heading', { level: 1 }), `${option} → ${link}`).toHaveText(heading)
    }
  }
})

test('As a reader, I find Install in the navigation of every page and it marks the install pages as current', async ({
  page,
}) => {
  for (const route of ['/', '/a-page-that-does-not-exist', ...installRoutes]) {
    await page.goto(route)
    const installLink = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Install' })
    await expect(installLink, route).toHaveAttribute('href', '/docs/install')
    if (route.startsWith('/docs/install')) await expect(installLink, route).toHaveAttribute('aria-current', 'page')
    else await expect(installLink, route).not.toHaveAttribute('aria-current')
  }
})

test('As an operator, I fetch /install and get the shell script as plain text', async ({ request }) => {
  const response = await request.get('/install')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('text/plain; charset=utf-8')
  expect((await response.text()).startsWith('#!/bin/sh\n')).toBe(true)
})

test('As a reader of the install guide, I move to the AWS guide and then to troubleshooting through the sidebar', async ({
  page,
}) => {
  await page.goto('/docs/install/one-machine')
  const sidebar = page.getByRole('navigation', { name: 'Docs' })
  await expect(sidebar.getByRole('link', { name: 'Install on one machine' })).toHaveAttribute('aria-current', 'page')
  await sidebar.getByRole('link', { name: 'Install on AWS' }).click()
  await expect(page).toHaveURL(/\/docs\/install\/aws$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Install on AWS')
  await sidebar.getByRole('link', { name: 'Troubleshooting' }).click()
  await expect(page).toHaveURL(/\/docs\/install\/troubleshooting$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Troubleshooting')
})

test('As a reader of the manual install, I find it after the cloud guides and jump to one of its sections from the sidebar', async ({
  page,
}) => {
  await page.goto('/docs/install/manual-install')
  const sidebar = page.getByRole('navigation', { name: 'Docs' })
  const pageRoutes = await sidebar
    .locator('a:not([href^="#"])')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  expect(pageRoutes.indexOf('/docs/install/manual-install')).toBe(pageRoutes.indexOf('/docs/install/google-cloud') + 1)
  const sections = sidebar.getByRole('list', { name: 'On this page' })
  await expect(sections).toHaveCount(1)
  await sections.getByRole('link', { name: 'Upgrading' }).click()
  await expect(page).toHaveURL(/\/docs\/install\/manual-install#upgrading$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Upgrading' })).toBeInViewport()
})

test('As a reader of an install guide, I follow a link to a decision and land on that file on GitHub at the synced commit', async ({
  page,
}) => {
  await page.goto('/docs/install/manual-install')
  const decisionLink = page
    .getByRole('article')
    .locator('a[href*="/docs/decisions/0028-generic-oidc-must-confirm-addresses"]')
    .first()
  await expect(decisionLink).toHaveAttribute(
    'href',
    `https://github.com/Camil-H/spyria/blob/${productRef}/docs/decisions/0028-generic-oidc-must-confirm-addresses.md`,
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

test('As a crawler, I find the install overview and guides in sitemap.xml and llms.txt, none with noindex, and the guides with their Markdown twins', async ({
  page,
  request,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  const llmsText = await (await request.get('/llms.txt')).text()
  expect(llmsText).toContain(`(${siteOrigin}${installOverviewRoute})`)
  for (const route of installRoutes) {
    expect(sitemap, route).toContain(`<loc>${siteOrigin}${route}</loc>`)
    await page.goto(route)
    await expect(page.locator('meta[name="robots"]'), route).toHaveCount(0)
  }
  for (const route of installGuideRoutes) {
    expect(llmsText, route).toContain(`(${siteOrigin}${route}.md)`)
    const twin = await request.get(`${route}.md`)
    expect(twin.status(), `${route}.md`).toBe(200)
    expect(twin.headers()['content-type'], `${route}.md`).toContain('text/markdown')
  }
})

test('As a coding agent, I read an install guide as Markdown with absolute links', async ({ request }) => {
  const markdown = await (await request.get('/docs/install/machines.md')).text()
  expect(markdown).toContain(`](${siteOrigin}/docs/install/one-machine)`)
  expect(markdown).not.toMatch(/\]\(\.\.?\//)
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

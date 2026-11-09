import { readdirSync, readFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'
import { docsPublished } from '../src/site'

test.skip(!docsPublished, 'the docs are unpublished until the digest in docs/site/ lands')

const productDocsDirectory = new URL('../.product/docs/', import.meta.url).pathname
const docsIndex = readFileSync(`${productDocsDirectory}README.md`, 'utf8')
const decisionsIndex = readFileSync(`${productDocsDirectory}decisions/README.md`, 'utf8')
const docsRoutes = readdirSync(productDocsDirectory, { recursive: true, encoding: 'utf8' })
  .filter((path) => path.endsWith('.md'))
  .map((path) => `/docs/${path.replace(/\.md$/, '')}`.replace(/\/?README$/, ''))
  .sort()

function readmeLinkLabels(markdown: string, pattern: RegExp): string[] {
  return [...markdown.matchAll(pattern)].map((match) => (match[1] ?? '').replaceAll('`', ''))
}

async function cspViolationsWhile(page: Page, action: () => Promise<void>): Promise<string[]> {
  const violations: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') violations.push(message.text())
  })
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.error(`CSP violation: ${event.violatedDirective} ${event.blockedURI}`)
    })
  })
  await action()
  return violations
}

test('As a reader of the docs, I see the sidebar in the order of the docs index, follow a link between two guides and land on the linked section', async ({
  page,
}) => {
  await page.goto('/docs/guides/development')
  const sidebar = page.getByRole('navigation', { name: 'Docs' })
  const sidebarLabels = (await sidebar.getByRole('link').allTextContents()).map((label) => label.trim())
  const indexLabels = readmeLinkLabels(docsIndex, /^[-*]\s+\[([^\]]+)\]/gm)
  const decisionLabels = readmeLinkLabels(decisionsIndex, /^\|\s*\[[^\]]+\]\([^)]+\)\s*\|\s*(.+?)\s*\|$/gm)
  expect(sidebarLabels.filter((label) => indexLabels.includes(label))).toEqual(indexLabels)
  expect(sidebarLabels.filter((label) => /^\d{4} /.test(label)).map((label) => label.slice(5))).toEqual(decisionLabels)
  await expect(sidebar.getByRole('link', { name: 'Development' })).toHaveAttribute('aria-current', 'page')

  await page.getByRole('article').locator('a[href="/docs/guides/testing#test-infrastructure"]').click()
  await expect(page).toHaveURL(/\/docs\/guides\/testing#test-infrastructure$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Test infrastructure' })).toBeInViewport()
})

test('As a reader of the docs, I search for "budgets" and open the matching page', async ({ page }) => {
  await page.goto('/docs')
  await page.getByRole('combobox', { name: 'Search the docs' }).fill('budgets')
  await page
    .locator('pagefind-searchbox')
    .getByRole('option', { name: /Budgets are a hard stop at the relay/ })
    .click()
  await expect(page).toHaveURL(/\/docs\/decisions\/0014-hard-stop-budgets$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Budgets are a hard stop at the relay')
})

test('As a reader of a docs page, I follow Edit on GitHub to that file in the product repository', async ({ page }) => {
  await page.goto('/docs/guides/testing')
  await expect(page.getByRole('link', { name: 'Edit on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/Camil-H/spyria/blob/main/docs/guides/testing.md',
  )
  await page.goto('/docs')
  await expect(page.getByRole('link', { name: 'Edit on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/Camil-H/spyria/blob/main/docs/README.md',
  )
})

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false })

  test('As an engineering lead, I read every docs page without JavaScript', async ({ page }) => {
    expect(docsRoutes.length).toBeGreaterThan(30)
    for (const route of docsRoutes) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 }), route).toBeVisible()
      expect((await page.getByRole('article').textContent())?.trim().length, route).toBeGreaterThan(200)
    }
  })

  test('As an engineering lead, I see the architecture diagrams drawn without JavaScript', async ({
    page,
    request,
  }) => {
    const html = await (await request.get('/docs/architecture/overview')).text()
    expect(html.match(/<figure class="diagram"[^>]*><svg\b/g)?.length).toBe(2)
    await page.goto('/docs/architecture/overview')
    await expect(page.locator('figure.diagram svg').first()).toBeVisible()
    await expect(page.locator('figure.diagram svg').first()).toContainText('zero-cache')
  })
})

test('As a visitor on a 360 px phone, I read every docs page without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  for (const route of docsRoutes) {
    await page.goto(route)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, route).toBeLessThanOrEqual(0)
  }
})

test('As a reader of the docs, I use pages with a diagram, code and search without any Content-Security-Policy violation', async ({
  page,
}) => {
  const violations = await cspViolationsWhile(page, async () => {
    await page.goto('/docs/architecture/overview')
    await expect(page.locator('figure.diagram svg').first()).toBeVisible()
    await page.goto('/docs/guides/self-hosting')
    await expect(page.locator('pre.astro-code').first()).toBeVisible()
    await page.getByRole('combobox', { name: 'Search the docs' }).fill('budgets')
    await expect(
      page.locator('pagefind-searchbox').getByRole('option', { name: /Budgets are a hard stop at the relay/ }),
    ).toBeVisible()
  })
  const response = await page.request.get('/docs/guides/self-hosting')
  expect(response.headers()['content-security-policy']).toContain("style-src 'self'")
  expect(violations).toEqual([])
})

test('As a coding agent, I read a docs page as Markdown with absolute links', async ({ request }) => {
  const response = await request.get('/docs/guides/development.md')
  expect(response.headers()['content-type']).toContain('text/markdown')
  const markdown = await response.text()
  expect(markdown).toContain('](https://spyria.dev/docs/guides/testing#test-infrastructure)')
  expect(markdown).not.toMatch(/\]\(\.\.?\//)
})

for (const colorScheme of ['light', 'dark'] as const) {
  for (const path of ['/docs', '/docs/decisions/0014-hard-stop-budgets', '/docs/architecture/overview']) {
    test(`${path} has no serious or critical accessibility violation in ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await page.goto(path)
      const results = await new AxeBuilder({ page }).analyze()
      const blocking = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')
      expect(
        blocking.map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`),
      ).toEqual([])
    })
  }
}

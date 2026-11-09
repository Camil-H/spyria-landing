import { expect, type Page, test } from '@playwright/test'

function pageBackground(page: Page) {
  return page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
}

const lightBackground = 'rgb(247, 248, 251)'
const darkBackground = 'rgb(13, 13, 15)'

test('As a visitor, I switch to dark theme, reload, and the site stays dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  expect(await pageBackground(page)).toBe(lightBackground)
  await page.getByRole('button', { name: 'Switch between light and dark theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await pageBackground(page)).toBe(darkBackground)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await pageBackground(page)).toBe(darkBackground)
})

for (const [colorScheme, background] of [
  ['dark', darkBackground],
  ['light', lightBackground],
] as const) {
  test(`As a visitor with no choice made, the site follows my system in ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/)
    expect(await pageBackground(page)).toBe(background)
  })
}

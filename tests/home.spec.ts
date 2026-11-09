import { expect, type Page, test } from '@playwright/test'

const homeHeading = "Coding agents are single-player. Your team isn't."
const homeSections = [
  { heading: 'Agents are single-player today', text: 'someone pastes a transcript into Slack' },
  {
    heading: 'One workspace for people and agents',
    text: 'Projects, channels, threads and agent chats in one sidebar',
  },
  { heading: 'One chat, two people, one agent', text: "Salim answered the agent's question in Camille's chat" },
  { heading: 'Built on a few firm choices', text: 'Claude Code and Codex sign-ins never reach the server' },
  {
    heading: 'Runs on your servers',
    text: 'You need a machine with Docker, an HTTPS address and an identity provider.',
  },
]
const heroSpires = 'svg[data-spires-animated="hero-spires"]'

function countAnimationFrames(page: Page) {
  return page.addInitScript(() => {
    const counted = window as unknown as { animationFrames: number }
    counted.animationFrames = 0
    const requestFrame = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (callback) =>
      requestFrame((time) => {
        counted.animationFrames += 1
        callback(time)
      })
  })
}

function spiresClock(page: Page) {
  return page.locator(heroSpires).evaluate((spires: SVGSVGElement) => spires.getCurrentTime())
}

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false })

  test('As an engineering lead with JavaScript disabled, I read the whole Home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(homeHeading)
    for (const { heading, text } of homeSections) {
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
      await expect(page.getByText(text)).toBeVisible()
    }
    await expect(page.locator(`${heroSpires} path`).first()).toBeAttached()
    await expect(page.locator(`${heroSpires} animate`)).toHaveCount(0)
  })
})

test('As a visitor who prefers reduced motion, I see the spires as a still image and nothing on the page moves', async ({
  page,
}) => {
  await countAnimationFrames(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  await expect(page.locator(`${heroSpires} path`).first()).toBeVisible()
  await expect(page.locator(`${heroSpires} animate`)).toHaveCount(0)
  expect(await page.evaluate(() => (window as unknown as { animationFrames: number }).animationFrames)).toBe(0)
})

test('As a visitor scrolling past the hero, the spires stop animating once they are off screen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator(`${heroSpires} animate`).first()).toBeAttached()
  const startedAt = await spiresClock(page)
  await page.waitForTimeout(500)
  expect(await spiresClock(page)).toBeGreaterThan(startedAt)

  await page.getByRole('heading', { name: 'Runs on your servers' }).scrollIntoViewIfNeeded()
  await expect
    .poll(() => page.locator(heroSpires).evaluate((spires: SVGSVGElement) => spires.animationsPaused()))
    .toBe(true)
  const stoppedAt = await spiresClock(page)
  await page.waitForTimeout(1000)
  expect(await spiresClock(page)).toBe(stoppedAt)
})

test('As a visitor, Home runs within its Content-Security-Policy', async ({ page }) => {
  await page.addInitScript(() => {
    const reported = window as unknown as { cspViolations: string[] }
    reported.cspViolations = []
    document.addEventListener('securitypolicyviolation', (event) => {
      reported.cspViolations.push(`${event.violatedDirective} ${event.blockedURI}`)
    })
  })
  await page.goto('/')
  await expect(page.locator(`${heroSpires} animate`).first()).toBeAttached()
  await page.waitForTimeout(500)
  expect(await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations)).toEqual([])
})

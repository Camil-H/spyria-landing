import { expect, type Page, test } from '@playwright/test'

const homeHeading = 'Everyone works with agents. Rarely together.'
const homeSections = [
  { heading: 'Working with agents is still a solo act', text: 'someone pastes a transcript into Slack' },
  {
    heading: 'One workspace for people and agents',
    text: 'Each agent chat gets its own runtime container',
  },
  {
    heading: 'A person behind every agent',
    text: 'anything that writes waits for your approval',
  },
  {
    heading: 'Runs on your servers',
    text: 'You need a machine with Docker, an HTTPS address and an identity provider.',
  },
]
const heroSpires = 'svg[data-spires-animated="hero-spires"]'
const everyoneItems = ['Research with sources.', "Your team's tools.", 'Files and charts in the chat.']

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
    const exampleChat = page.getByRole('figure', { name: 'Example: a dev chat in Spyria' })
    await expect(exampleChat).toBeVisible()
    await expect(exampleChat.getByText('Answered by Salim Condo').first()).toBeVisible()
    await expect(exampleChat.getByText('Salim Condo', { exact: true })).toBeVisible()
    await expect(page.locator(`${heroSpires} path`).first()).toBeAttached()
    await expect(page.locator(`${heroSpires} animate`)).toHaveCount(0)
  })

  test('As a visitor with JavaScript disabled, I read the channel thread in the hero and see that an agent chat was started from it', async ({
    page,
  }) => {
    await page.goto('/')
    const channelThread = page.getByRole('figure', { name: 'Example: a channel thread in Spyria' })
    await expect(channelThread.getByText('payments-support', { exact: true })).toBeVisible()
    await expect(channelThread.getByText('Salim Condo', { exact: true })).toBeVisible()
    await expect(channelThread.getByText('Acme says the provider keeps calling our refund webhook')).toBeVisible()
    const threadReplies = channelThread.getByRole('list', { name: 'Thread replies' })
    await expect(threadReplies.getByText('Camille Duciel', { exact: true })).toBeVisible()
    await expect(threadReplies.getByText('On it. Starting an agent from this thread.')).toBeVisible()
    await expect(channelThread.getByText('Start runtime from this message')).toBeVisible()
    await expect(channelThread.getByText('Runtime: Refund retries on 409')).toBeVisible()
  })
})

test('As a visitor, I read the dev chat and see it was started from #payments-support', async ({ page }) => {
  await page.goto('/')
  const exampleChat = page.getByRole('figure', { name: 'Example: a dev chat in Spyria' })
  await expect(exampleChat.getByText('Started from #payments-support')).toBeVisible()
  await expect(exampleChat.getByText("I'm following along for Acme.")).toBeVisible()
})

test('As a non-engineer, I read "Not only for engineers" and its three items', async ({ page }) => {
  await page.goto('/')
  const section = page.getByRole('region', { name: 'Not only for engineers' })
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Not only for engineers')
  await expect(section.getByText("An AI chat doesn't need a repository.")).toBeVisible()
  for (const item of everyoneItems) await expect(section.getByText(item, { exact: true })).toBeVisible()
})

test('As a visitor who prefers reduced motion, the hero story shows its final state at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const runningStoryAnimations = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect instanceof KeyframeEffect &&
            animation.effect.target?.closest('[data-hero-story]') &&
            animation.playState !== 'finished',
        ).length,
  )
  expect(runningStoryAnimations).toBe(0)
  await expect(page.getByText('Runtime: Refund retries on 409')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-story-step="devChat"]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-story-step="pullRequest"]').last()).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-story-shown-until="salimAnswer"]').first()).toHaveCSS('height', '0px')
  await expect(page.getByText('Only stop the retries', { exact: true }).first()).toHaveCSS('opacity', '1')
})

const seekStory = (page: Page, seconds: number) =>
  page.evaluate((milliseconds) => {
    for (const animation of document.getAnimations()) {
      if (animation.effect instanceof KeyframeEffect && animation.effect.target?.closest('[data-hero-story]')) {
        animation.pause()
        animation.currentTime = milliseconds
      }
    }
  }, seconds * 1000)

const storyOpacityAt = async (page: Page, seconds: number, selector: string) => {
  await seekStory(page, seconds)
  return page
    .locator(selector)
    .first()
    .evaluate((element) => getComputedStyle(element).opacity)
}

const questionOptions = '[data-story-shown-until="salimAnswer"]'

test("As a visitor, the hero story shows its messages one by one, Salim's answer replaces the question's options without changing the chat's height, then the story starts over", async ({
  page,
}) => {
  test.slow()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('[data-story-step="pullRequest"]').last()).toHaveCSS('opacity', '1', { timeout: 20_000 })
  expect(await storyOpacityAt(page, 6.9, '[data-story-step="agentReply"]')).toBe('1')
  expect(await storyOpacityAt(page, 6.9, '[data-story-step="salimFollowing"]')).toBe('0')
  expect(await storyOpacityAt(page, 9.6, '[data-story-step="salimFollowing"]')).toBe('1')
  expect(await storyOpacityAt(page, 9.6, '[data-story-step="salimAnswer"]')).toBe('0')
  expect(await storyOpacityAt(page, 11.55, '[data-story-step="salimChoice"]')).toBe('1')
  await expect(page.locator(questionOptions).first()).not.toHaveCSS('height', '0px')
  expect(await storyOpacityAt(page, 11.55, '[data-story-step="salimAnswer"]')).toBe('0')
  const exampleChat = page.getByRole('figure', { name: 'Example: a dev chat in Spyria' })
  const chatHeightWithOptions = (await exampleChat.boundingBox())?.height
  expect(await storyOpacityAt(page, 12.8, '[data-story-step="salimAnswer"]')).toBe('1')
  await expect(page.locator(questionOptions).first()).toHaveCSS('height', '0px')
  expect((await exampleChat.boundingBox())?.height).toBe(chatHeightWithOptions)
  expect(await storyOpacityAt(page, 16, '[data-story-step="salimMessage"]')).toBe('1')
  expect(await storyOpacityAt(page, 16, '[data-story-step="pullRequest"]')).toBe('1')
  expect(await storyOpacityAt(page, 21.9, '[data-story-step="pullRequest"]')).toBe('0')
  const storyIterations = await page.evaluate(() =>
    document
      .getAnimations()
      .filter(
        (animation) =>
          animation.effect instanceof KeyframeEffect && animation.effect.target?.closest('[data-hero-story]'),
      )
      .map((animation) => animation.effect?.getTiming().iterations),
  )
  expect(storyIterations.length).toBeGreaterThan(0)
  expect(storyIterations.every((iterations) => iterations === Number.POSITIVE_INFINITY)).toBe(true)
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
  await expect.poll(() => spiresClock(page)).toBeGreaterThan(startedAt)

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

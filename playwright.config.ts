import { defineConfig, devices } from '@playwright/test'

const port = 4321
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `bunx wrangler dev --port ${port} --ip 127.0.0.1 --show-interactive-dev-session=false`,
    env: { WRANGLER_SEND_METRICS: 'false' },
    url: baseURL,
    reuseExistingServer: false,
  },
})

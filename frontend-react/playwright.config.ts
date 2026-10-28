import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, forbidOnly: !!process.env.CI,
  retries: 0, timeout: 60_000, expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo',
    contextOptions: { reducedMotion: 'reduce' }, actionTimeout: 10_000, navigationTimeout: 30_000,
    trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure'
  },
  projects: [{ name: 'Chromium local', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 960 } } }],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173', url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI, timeout: 60_000
  }
})

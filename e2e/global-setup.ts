import { chromium } from '@playwright/test'

export default async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({ permissions: ['notifications'] })
  const page = await context.newPage()

  await page.goto('http://127.0.0.1:3000/?key=demo-finance-key')
  await page.getByTestId('app-ready').waitFor({ state: 'attached', timeout: 60000 })

  await browser.close()
}

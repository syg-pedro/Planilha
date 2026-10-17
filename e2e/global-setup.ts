import { chromium, expect } from '@playwright/test'

export default async () => {
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ permissions: ['notifications'] })
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:3000/?key=demo-finance-key')
    await expect(page.getByTestId('app-ready')).toBeAttached({ timeout: 60_000 })
    await expect(page.getByRole('heading', { name: 'Planilha', level: 1 })).toBeVisible({ timeout: 30_000 })
  } finally {
    await browser.close()
  }
}

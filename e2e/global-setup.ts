import { chromium } from '@playwright/test'

export default async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({ permissions: ['notifications'] })
  const page = await context.newPage()

  await page.goto('http://127.0.0.1:3000/?key=demo-finance-key')
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await page.getByTestId('app-ready').count()) break
    await page.getByRole('button', { name: 'Recolher', exact: true }).click().catch(() => undefined)
    await page.waitForTimeout(1000)
  }

  if (!await page.getByTestId('app-ready').count()) {
    throw new Error('O app não concluiu a inicialização de teste.')
  }

  await browser.close()
}

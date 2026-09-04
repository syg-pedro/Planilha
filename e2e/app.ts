import { expect, type Page } from '@playwright/test'

export const openApp = async (page: Page) => {
  await page.goto('/?key=demo-finance-key')
  await expect(page.getByTestId('app-ready')).toBeAttached({ timeout: 30000 })
  await expect(page.getByRole('heading', { name: /^(Dashboard|Visão geral)$/, level: 1 })).toBeVisible()
  await expect(page.getByText('Fluxo de caixa')).toBeVisible()
}

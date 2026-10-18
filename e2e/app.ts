import { expect, type Page } from '@playwright/test'

export const openApp = async (page: Page) => {
  await page.goto('/?key=demo-finance-key')
  await expect(page.getByTestId('app-ready')).toBeAttached({ timeout: 30_000 })
  await expect(page).toHaveURL(/\/planilha(?:\?|$)/)
  await expect(page.getByRole('heading', { name: 'Planilha', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Área de trabalho da Planilha' })).toBeVisible()
}

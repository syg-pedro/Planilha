import { expect, type Page } from '@playwright/test'

export const openApp = async (page: Page) => {
  await page.goto('/?key=demo-finance-key')
  // A primeira interação inicia a hidratação do Nuxt em navegadores automatizados.
  await page.getByRole('button', { name: 'Recolher', exact: true }).click()
  await expect(page.getByTestId('app-ready')).toBeAttached({ timeout: 20_000 })
  if (!await page.evaluate(() => window.matchMedia('(max-width: 767px)').matches)) {
    await page.getByRole('button', { name: 'Recolher', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.getByText('Fluxo de caixa')).toBeVisible()
}

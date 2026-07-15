import { expect, test } from '@playwright/test'
import { openApp } from './app'

test.describe('Dívidas e Parcelas no celular', () => {
  test('mantém as ações dentro do card após expandir uma dívida', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'Executado na viewport mobile.')
    await openApp(page)

    await page.getByRole('button', { name: 'Mais', exact: true }).click()
    await page.getByRole('button', { name: 'Dívidas e Parcelas', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Dívidas e Parcelas', level: 1 })).toBeVisible()

    const debtGroup = page.locator('.debt-group').first()
    await expect(debtGroup).toBeVisible()
    await debtGroup.getByRole('button').first().click()

    const actions = debtGroup.getByTestId('debt-installment-actions').first()
    await expect(actions).toBeVisible()
    expect(await actions.getByRole('button').count()).toBeGreaterThan(0)
    expect(await debtGroup.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    const viewport = page.viewportSize()
    for (const action of await actions.getByRole('button').all()) {
      const box = await action.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual((viewport?.width ?? 0) + 1)
    }
  })
})

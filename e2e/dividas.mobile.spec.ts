import { expect, test } from '@playwright/test'
import { openApp } from './app'

test.describe('Dívidas e Parcelas no celular', () => {
  test('abre apenas o mês atual e cadastra valor brasileiro com diálogo acessível', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'Desktop Chrome', 'Fluxo de toque mobile.')
    await openApp(page)
    if (testInfo.project.name === 'Mobile Chrome') await page.setViewportSize({ width: 320, height: 800 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `docs/revisao-2026-09-04/evidencias/corrigido-dashboard-${testInfo.project.name.replaceAll(' ', '-')}.png`, fullPage: true, animations: 'disabled' })
    await page.getByRole('button', { name: 'Lançamentos', exact: true }).click()
    await expect(page.locator('.mcard')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: '+ Novo lançamento', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Editar planilha' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Título', { exact: true })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('button', { name: '+ Novo lançamento', exact: true })).toBeFocused()
    await page.getByRole('button', { name: '+ Novo lançamento', exact: true }).click()
    await dialog.getByPlaceholder('Ex.: Aluguel, Salário...').fill(`Teste revisão ${testInfo.project.name}`)
    await dialog.getByPlaceholder('0,00').fill('1.234,56')
    await dialog.getByRole('button', { name: 'Adicionar', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    const row = page.locator('.mcard-row').filter({ hasText: `Teste revisão ${testInfo.project.name}` })
    await expect(row).toContainText('1.234,56')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Planilha', level: 1 })).toBeVisible()
    await expect(page.locator('.mcard')).toHaveCount(1)
    await page.screenshot({ path: `docs/revisao-2026-09-04/evidencias/corrigido-planilha-${testInfo.project.name.replaceAll(' ', '-')}.png`, fullPage: true, animations: 'disabled' })
  })

  test('mantém as ações dentro do card após expandir uma dívida', async ({ page }, testInfo) => {
    test.skip(!['Mobile Chrome', 'Mobile amplo'].includes(testInfo.project.name), 'Executado nas viewports mobile.')
    await openApp(page)

    await page.getByRole('button', { name: 'Mais', exact: true }).click()
    await page.getByRole('button', { name: 'Dívidas', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Dívidas', level: 1 })).toBeVisible()

    const debtGroup = page.locator('.debt-group').first()
    await expect(debtGroup).toBeVisible()
    await debtGroup.getByRole('button').first().click()

    const actions = debtGroup.getByTestId('debt-installment-actions').first()
    await expect(actions).toBeVisible()
    await expect(actions).toHaveCSS('display', 'grid')
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

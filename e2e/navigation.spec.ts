import { expect, test } from '@playwright/test'
import { openApp } from './app'

const modules = [
  { navigation: 'Dashboard', heading: 'Dashboard' },
  { navigation: 'Relatórios', heading: 'Relatórios' },
  { navigation: 'Planejamento Anual', heading: 'Planejamento Anual' },
  { navigation: 'Planilha', heading: 'Planilha' },
  { navigation: 'Assinaturas', heading: 'Assinaturas' },
  { navigation: 'Cartões e Contas', heading: 'Cartões e Contas' },
  { navigation: 'Lista de Desejos', heading: 'Lista de Desejos' },
  { navigation: 'Dívidas e Parcelas', heading: 'Dívidas e Parcelas' },
  { navigation: /Alertas Inteligentes$/, heading: 'Alertas Inteligentes' },
  { navigation: 'Primeiros passos', heading: 'Primeiros passos' },
  { navigation: 'Ajuda', heading: 'Ajuda' },
  { navigation: 'Novidades', heading: 'Novidades' },
  { navigation: 'Design System', heading: 'Design System' },
  { navigation: 'Configurações', heading: 'Configurações' }
]

test.describe('navegação do Financeiro Familiar', () => {
  test('abre todos os módulos principais no desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'A navegação lateral é validada no desktop.')
    await openApp(page)

    for (const module of modules) {
      await page.getByRole('button', { name: module.navigation, exact: typeof module.navigation === 'string' }).click()
      await expect(page.getByRole('heading', { name: module.heading, level: 1 })).toBeVisible()
      if (module.heading === 'Novidades') {
        await expect(page.getByRole('button', { name: 'Verificar atualizações', exact: true })).toBeVisible()
      }
    }
  })

  test('alterna a planilha entre Matriz e Lista', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'Cobertura do fluxo de planilha no desktop.')
    await openApp(page)
    await page.getByRole('button', { name: 'Planilha', exact: true }).click()

    await expect(page.locator('.matrix-table').first().getByText('Total', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Lista', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Matriz', exact: true })).toBeVisible()
  })

  test('mantém a ordem das colunas ao editar a matriz', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'A matriz é validada no desktop.')
    await openApp(page)
    await page.getByRole('button', { name: 'Planilha', exact: true }).click()

    const expenses = page.locator('.matrix-table').first()
    const titles = expenses.locator('.col-title')
    await expect(titles.first()).toBeVisible()
    const before = await titles.allTextContents()
    await expenses.locator('.col-menu-btn').first().click()
    await page.getByRole('button', { name: 'Mover para direita', exact: false }).click()
    const ordered = [before[1]!, before[0]!, ...before.slice(2)]
    await expect(titles).toHaveText(ordered)

    await titles.nth(0).dragTo(titles.nth(2))
    await expect(titles).toHaveText(before)

    const cell = expenses.locator('tbody tr').first().locator('td').nth(1)
    await cell.click()
    await cell.locator('input').fill('1234')
    await cell.locator('input').press('Enter')
    await expect(titles).toHaveText(before)
  })
})

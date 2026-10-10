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

test.describe('navegação da Planilha', () => {
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

  test('alterna a planilha entre Simples, Completa e Lista sem mudar valores', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'Cobertura do fluxo de planilha no desktop.')
    await openApp(page)
    await page.getByRole('button', { name: 'Planilha', exact: true }).click()

    await page.getByRole('button', { name: 'Simples', exact: true }).click()
    const matrix = page.locator('.annual-table')
    await expect(matrix.locator('tfoot tr')).toHaveCount(3)
    await expect(matrix.locator('thead .annual-day')).toHaveCount(0)
    await expect(matrix.locator('.annual-row-trigger')).toHaveCount(0)
    const values = await matrix.locator('.annual-value').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')))
    await page.getByRole('button', { name: 'Completa', exact: true }).click()
    await expect(matrix.locator('tfoot tr')).toHaveCount(6)
    await expect(matrix.locator('thead .annual-day')).toHaveCount(1)
    expect(await matrix.locator('.annual-value').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')))).toEqual(values)
    await page.getByRole('button', { name: 'Lista', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Simples', exact: true })).toBeVisible()
  })

  test('mantém a ordem das linhas ao consultar e abrir a edição de uma célula', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'A matriz é validada no desktop.')
    await openApp(page)
    await page.getByRole('button', { name: 'Planilha', exact: true }).click()
    await page.getByRole('button', { name: 'Completa', exact: true }).click()

    const matrix = page.locator('.annual-table')
    const titles = matrix.locator('.annual-row-title')
    await expect(titles.first()).toBeVisible()
    const before = await titles.allTextContents()
    const firstRow = matrix.locator('tbody tr').filter({ has: page.locator('.annual-row-title') }).first()
    await firstRow.getByRole('button', { name: /^Ações de / }).click()
    await firstRow.getByRole('button', { name: '↓ Mover para baixo', exact: true }).click()
    const ordered = [before[1]!, before[0]!, ...before.slice(2)]
    await expect(titles).toHaveText(ordered)

    const cell = firstRow.locator('.annual-value').first()
    await cell.click()
    const detail = page.getByRole('region', { name: 'Composição da célula' })
    await expect(detail).toBeVisible()
    const edit = detail.getByRole('button', { name: 'Editar', exact: true })
    if (await edit.count()) await edit.first().click()
    else await detail.getByRole('button', { name: '+ Adicionar lançamento', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await expect(titles).toHaveText(ordered)
  })
})

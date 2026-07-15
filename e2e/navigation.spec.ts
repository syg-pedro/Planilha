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
    }
  })

  test('alterna a planilha entre Matriz e Lista', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'Cobertura do fluxo de planilha no desktop.')
    await openApp(page)
    await page.getByRole('button', { name: 'Planilha', exact: true }).click()

    await page.getByRole('button', { name: 'Lista', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Matriz', exact: true })).toBeVisible()
  })
})

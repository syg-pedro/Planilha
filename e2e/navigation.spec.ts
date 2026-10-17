import { expect, test } from '@playwright/test'
import { openApp } from './app'

const primaryModules = [
  { label: 'Resumo', path: '/resumo' },
  { label: 'Contas e cartões', path: '/contas' },
  { label: 'Relatórios', path: '/relatorios' },
  { label: 'Planilha', path: '/planilha' },
]
const secondaryModules = [
  { label: 'Planejamento anual', path: '/planejamento' },
  { label: 'Dívidas e parcelas', path: '/dividas' },
  { label: 'Assinaturas', path: '/assinaturas' },
  { label: 'Lista de desejos', path: '/desejos' },
  { label: 'Alertas', path: '/alertas' },
]
const shortcutModules = [
  { label: 'Primeiros passos', path: '/primeiros-passos' },
  { label: 'Ajuda', path: '/ajuda' },
  { label: 'Novidades', path: '/novidades' },
]

const expectScreen = async (page: import('@playwright/test').Page, path: string, label: string) => {
  await expect.poll(() => new URL(page.url()).pathname).toBe(path)
  expect(new URL(page.url()).searchParams.get('key')).toBe('demo-finance-key')
  await expect(page.getByRole('heading', { name: label, level: 1 })).toBeVisible()
}

test.describe('navegação da Planilha', () => {
  test('abre a Planilha diretamente e mantém quatro destinos principais', async ({ page }, testInfo) => {
    await openApp(page)
    expect(new URL(page.url()).searchParams.get('key')).toBe('demo-finance-key')
    const navigation = page.getByRole('navigation', { name: 'Principal', exact: true })
    if (testInfo.project.name === 'Desktop Chrome') {
      await expect(navigation.getByRole('link')).toHaveCount(4)
      await expect(navigation.getByRole('link', { name: 'Planilha', exact: true })).toHaveAttribute('aria-current', 'page')
      await expect(navigation.getByRole('link', { name: 'Design System', exact: true })).toHaveCount(0)
    } else {
      await expect(navigation.getByRole('link')).toHaveCount(3)
      await expect(navigation.getByRole('button', { name: 'Mais', exact: true })).toBeVisible()
      await expect(navigation.getByRole('link', { name: 'Planilha', exact: true })).toHaveAttribute('aria-current', 'page')
      await expect(navigation.getByRole('link', { name: 'Lançamentos', exact: true })).toHaveCount(0)
      await expect(navigation.getByRole('link', { name: 'Contas', exact: true })).toBeVisible()
      const navigationBox = await navigation.boundingBox()
      expect(navigationBox).not.toBeNull()
      const destinations = navigation.getByRole('link').or(navigation.getByRole('button', { name: 'Mais', exact: true }))
      const destinationBoxes = await destinations.evaluateAll(elements => elements.map(element => {
        const { x, width } = element.getBoundingClientRect()
        return { x, width }
      }))
      for (const [index, destination] of destinationBoxes.entries()) {
        expect(destination.width).toBeCloseTo(navigationBox!.width / 4, 0)
        expect(destination.x).toBeCloseTo(navigationBox!.x + navigationBox!.width * index / 4, 0)
      }
    }
  })

  test('abre os módulos por links e mantém ferramentas secundárias agrupadas', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'A navegação lateral é validada no desktop.')
    await openApp(page)
    const navigation = page.getByRole('navigation', { name: 'Principal', exact: true })
    for (const module of primaryModules) {
      await navigation.getByRole('link', { name: module.label, exact: true }).click()
      await expectScreen(page, module.path, module.label)
    }
    await navigation.getByRole('button', { name: 'Mais ferramentas', exact: true }).click()
    for (const module of secondaryModules) {
      await navigation.getByRole('link', { name: module.label, exact: true }).click()
      await expectScreen(page, module.path, module.label)
    }
    for (const module of shortcutModules) {
      await page.getByRole('link', { name: 'Configurações', exact: true }).click()
      await expectScreen(page, '/configuracoes', 'Configurações')
      await page.getByRole('button', { name: module.label, exact: true }).click()
      await expectScreen(page, module.path, module.label)
    }
    await page.goto('/design-system?key=demo-finance-key')
    await expect(page.getByRole('heading', { name: 'Design System', level: 1 })).toBeVisible()
  })

  test('abre Mais no celular e volta para a Planilha pelo histórico', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'Desktop Chrome', 'Cobertura da navegação inferior no celular.')
    await openApp(page)
    await page.getByRole('button', { name: 'Mais', exact: true }).click()
    const menu = page.getByRole('dialog', { name: 'Mais', exact: true })
    await expect(menu).toBeVisible()
    await menu.getByRole('link', { name: 'Relatórios', exact: true }).click()
    await expectScreen(page, '/relatorios', 'Relatórios')
    await expect(menu).toBeHidden()
    await page.goBack()
    await expectScreen(page, '/planilha', 'Planilha')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  test('preserva filtros na URL, no histórico e ao recarregar', async ({ page }) => {
    await openApp(page)
    const expectedQuery = { month: '2026-10', range: 'quarter', view: 'matrix', date: 'due_date', q: 'a', kind: 'expense', status: 'pending' }
    const query = new URLSearchParams({ key: 'demo-finance-key', ...expectedQuery })
    await page.goto(`/planilha?${query}`)
    await expect(page.getByRole('searchbox', { name: 'Buscar na planilha', exact: true })).toHaveValue('a')
    const readQuery = () => Object.fromEntries(Object.keys(expectedQuery).map(key => [key, new URL(page.url()).searchParams.get(key)]))
    await expect.poll(readQuery).toEqual(expectedQuery)
    await page.getByRole('navigation', { name: 'Principal', exact: true }).getByRole('link', { name: 'Resumo', exact: true }).click()
    await expectScreen(page, '/resumo', 'Resumo')
    await page.goBack()
    await expectScreen(page, '/planilha', 'Planilha')
    await expect(page.getByRole('searchbox', { name: 'Buscar na planilha', exact: true })).toHaveValue('a')
    await expect.poll(readQuery).toEqual(expectedQuery)
    await page.reload()
    await expect(page.getByRole('searchbox', { name: 'Buscar na planilha', exact: true })).toHaveValue('a')
    await expect.poll(readQuery).toEqual(expectedQuery)
  })

  test('alterna Planilha e Lista mantendo período, filtros e valores financeiros', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'Cobertura do fluxo de planilha no desktop.')
    await openApp(page)
    const matrix = page.locator('.annual-table')
    await expect(matrix.locator('tfoot tr')).toHaveCount(3)
    await expect.poll(() => new URL(page.url()).searchParams.get('view')).toBe('matrix')
    const values = await matrix.locator('.annual-value').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')))
    expect(values.length).toBeGreaterThan(0)
    const totals = await matrix.locator('tfoot th, tfoot td').allTextContents()
    const readPeriod = () => new URL(page.url()).searchParams.get('range')
    const beforePeriod = readPeriod()
    await page.getByRole('tab', { name: 'Lista', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('view')).toBe('list')
    expect(readPeriod()).toBe(beforePeriod)
    await page.getByRole('tab', { name: 'Planilha', exact: true }).click()
    await expect(matrix).toBeVisible()
    await expect(matrix.locator('tfoot tr')).toHaveCount(3)
    expect(await matrix.locator('.annual-value').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')))).toEqual(values)
    await expect(matrix.locator('tfoot th, tfoot td')).toHaveText(totals)
  })

  test('mantém a ordem das linhas ao consultar e abrir a edição de uma célula', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'A matriz é validada no desktop.')
    await openApp(page)
    const matrix = page.locator('.annual-table')
    const titles = matrix.locator('.annual-row-title')
    await expect(titles.first()).toBeVisible()
    const before = await titles.allTextContents()
    expect(before.length).toBeGreaterThan(1)
    const firstRow = matrix.locator('tbody tr').filter({ has: page.locator('.annual-row-title') }).first()
    await firstRow.getByRole('button', { name: /^Ações de / }).click()
    const actions = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: '↓ Mover para baixo', exact: true }) })
    await actions.getByRole('button', { name: '↓ Mover para baixo', exact: true }).click()
    const ordered = [before[1]!, before[0]!, ...before.slice(2)]
    await expect(titles).toHaveText(ordered)

    const cell = matrix.getByRole('button', { name: /(?:, 1 lançamento\(s\),|: sem lançamento$)/ }).first()
    await cell.click()
    await page.locator('.planilha__cell-context').getByRole('button', { name: 'Ver composição', exact: true }).click()
    const detail = page.getByRole('dialog')
    await expect(detail).toBeVisible()
    await detail.getByRole('button', { name: 'Fechar', exact: true }).click()
    await cell.focus()
    await cell.press('F2')
    const editor = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Cancelar', exact: true }) })
    await expect(editor).toBeVisible()
    await editor.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await expect(titles).toHaveText(ordered)
  })
})

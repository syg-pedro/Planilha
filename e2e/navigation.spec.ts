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

  test('preserva filtros na URL, no histórico e ao recarregar', async ({ page }, testInfo) => {
    await openApp(page)
    const expectedQuery = { month: '2026-10', range: 'quarter', view: testInfo.project.name === 'Desktop Chrome' ? 'matrix' : 'list', date: 'due_date', q: 'a', kind: 'expense', status: 'pending' }
    const query = new URLSearchParams({ key: 'demo-finance-key', ...expectedQuery, view: 'matrix' })
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
    const grid = page.locator('.sheet__grid')
    await expect(grid).toBeVisible()
    await expect.poll(() => new URL(page.url()).searchParams.get('view')).toBe('matrix')
    const values = await grid.locator('[data-b]').allTextContents()
    expect(values.length).toBeGreaterThan(0)
    const readPeriod = () => new URL(page.url()).searchParams.get('range')
    const beforePeriod = readPeriod()
    await page.getByRole('tab', { name: 'Lista', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('view')).toBe('list')
    expect(readPeriod()).toBe(beforePeriod)
    await page.getByRole('tab', { name: 'Planilha', exact: true }).click()
    await expect(grid).toBeVisible()
    await expect(grid.locator('[data-b]')).toHaveText(values)
  })

  test('abre a lista de compras de uma fatura de cartão sem perder a seleção', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'A grade é validada no desktop.')
    await openApp(page)
    const card = page.locator('.sheet__table thead th').filter({ hasText: 'cartão' }).first()
    const index = await card.evaluate(th => [...th.parentElement!.children].indexOf(th))
    const cell = page.locator(`.sheet__grid [data-b="D"][data-r="0"][data-c="${index}"]`)
    await cell.click()
    await page.keyboard.press('Enter')
    const list = page.getByRole('dialog')
    await expect(list).toBeVisible()
    await expect(list.getByRole('heading', { name: 'Nova compra em', exact: false })).toBeVisible()
    await list.getByRole('button', { name: 'Fechar', exact: true }).last().click()
    await expect(list).toBeHidden()
    await expect(cell).toHaveClass(/is-cur/)
  })
})

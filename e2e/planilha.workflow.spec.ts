import { randomUUID } from 'node:crypto'
import { expect, test, type Locator, type Page, type Response } from '@playwright/test'
import type { FinanceEntry } from '../shared/types'

const editHeaders = { 'x-edit-key': 'demo-finance-key' }
const batches = new Map<Page, { prefix: string; ids: Set<string>; listener: (response: Response) => void }>()
const isEntryBatch = (response: Response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/entries/batch'

async function expectDate(scope: Locator, label: string, iso: string) {
  const field = scope.getByRole('group', { name: label, exact: true })
  const [year, month, day] = iso.split('-')
  for (const [name, value] of [['ano', year], ['mês', month], ['dia', day]]) {
    if (value) await expect(field.getByRole('spinbutton', { name, exact: true })).toHaveAttribute('aria-valuenow', String(Number(value)))
  }
}

async function fillDate(scope: Locator, label: string, iso: string) {
  const field = scope.getByRole('group', { name: label, exact: true })
  const [year, month, day] = iso.split('-')
  // Enter the day last so moving from a long month to February cannot clamp it.
  for (const [name, value] of [['ano', year], ['mês', month], ['dia', day]]) {
    const segment = field.getByRole('spinbutton', { name, exact: true })
    await segment.focus()
    await segment.pressSequentially(value!)
  }
  await expectDate(scope, label, iso)
}

test.beforeEach(async ({ page }) => {
  const prefix = `E2E workflow ${randomUUID()}`
  const ids = new Set<string>()
  const listener = (response: Response) => {
    if (!isEntryBatch(response) || !response.ok()) return
    const body = response.request().postDataJSON() as { upserts?: Partial<FinanceEntry>[] }
    for (const entry of body.upserts ?? []) {
      if (entry.id && entry.title?.startsWith(prefix)) ids.add(entry.id)
    }
  }
  batches.set(page, { prefix, ids, listener })
  page.on('response', listener)
})

test.afterEach(async ({ page }) => {
  const fixture = batches.get(page)
  if (!fixture) return
  page.off('response', fixture.listener)
  if (fixture.ids.size) {
    const response = await page.request.post('/api/entries/batch', { headers: editHeaders, data: { upserts: [], deletes: [...fixture.ids] } })
    expect(response.ok(), 'Remove somente os lançamentos temporários criados por este teste.').toBe(true)
  }
  batches.delete(page)
})

async function openWorkspace(page: Page, values: Record<string, string> = {}) {
  const query = new URLSearchParams({ key: 'demo-finance-key', ...values })
  await page.goto(`/planilha?${query}`)
  await expect(page.getByTestId('app-ready')).toBeAttached({ timeout: 30_000 })
  await expect(page.getByRole('heading', { name: 'Planilha', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Área de trabalho da Planilha' })).toBeVisible()
}
const createButton = (page: Page) => page.getByRole('button', { name: /^Novo lançamento em / })
const entryDialog = (page: Page) => page.getByRole('dialog', { name: /^(Novo|Editar) lançamento$/ })
async function savedBatch(page: Page, action: () => Promise<unknown>) {
  const response = page.waitForResponse(response => isEntryBatch(response) && response.ok())
  await action()
  return await (await response).json() as { entries: FinanceEntry[] }
}

async function seedSelectionRow(page: Page) {
  const fixture = batches.get(page)!
  const now = new Date().toISOString()
  const records: FinanceEntry[] = [1.01, 2.02, 3.03].map((amount, index) => ({
    id: randomUUID(), householdId: 'household-main', title: fixture.prefix, description: 'Fixture temporária de seleção',
    amount, kind: 'expense', status: 'pending', dueDate: `2026-${String(10 + index).padStart(2, '0')}-21`,
    competenceDate: `2026-${String(10 + index).padStart(2, '0')}-21`, accountId: null, categoryId: null,
    ruleId: null, installmentIndex: null, installmentTotal: null, origin: 'manual', excludeFromCalc: false,
    metadata: null, createdAt: now, updatedAt: now,
  }))
  for (const record of records) fixture.ids.add(record.id)
  const response = await page.request.post('/api/entries/batch', { headers: editHeaders, data: { upserts: records, deletes: [] } })
  expect(response.ok()).toBe(true)
  return fixture.prefix
}

test.describe('fluxos da Planilha após a refatoração', () => {
  test('usa o mês da célula ao criar e Hoje restaura o mês de foco', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'A seleção da célula por destaque é específica do desktop.')
    await openWorkspace(page, { month: '2026-10', range: 'quarter', view: 'matrix' })
    await page.locator('.annual-value[data-month="2026-11"]').first().click()
    await expect(createButton(page)).toHaveAccessibleName('Novo lançamento em novembro de 2026')
    await createButton(page).click()
    await expectDate(entryDialog(page), 'Vencimento', '2026-11')
    await entryDialog(page).getByRole('button', { name: 'Cancelar', exact: true }).click()
    await page.getByRole('button', { name: 'Hoje', exact: true }).click()
    const todayMonth = await page.evaluate(() => {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(new Date())
      return `${parts.find(part => part.type === 'year')!.value}-${parts.find(part => part.type === 'month')!.value}`
    })
    await createButton(page).click()
    await expectDate(entryDialog(page), 'Vencimento', todayMonth)
    await entryDialog(page).getByRole('button', { name: 'Cancelar', exact: true }).click()
  })

  test('valida, cria, edita, paga e desfaz preservando a competência', async ({ page }) => {
    const fixture = batches.get(page)!
    await openWorkspace(page, { month: '2026-10', range: 'month', view: 'list' })
    const pendingSummary = page.getByRole('group', { name: 'Falta pagar', exact: true })
    const pendingAmount = pendingSummary.getByRole('status', { name: 'Valor que falta pagar', exact: true })
    await expect(pendingSummary).toBeVisible()
    await createButton(page).click()
    const dialog = entryDialog(page)
    const description = dialog.getByLabel('Descrição', { exact: true })
    await dialog.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(description).toHaveAttribute('aria-invalid', 'true')
    await expect(description).toBeFocused()
    await expect(dialog.getByText('Informe uma descrição.', { exact: true })).toBeVisible()
    await description.fill(fixture.prefix)
    await dialog.getByLabel('Valor (R$)', { exact: true }).fill('12.34')
    const calendar = page.getByRole('dialog', { name: 'Escolher data: Vencimento', exact: true })
    const dateButton = dialog.getByRole('button', { name: 'Escolher data: Vencimento', exact: true })
    await dateButton.click()
    await expect(calendar).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(calendar).toBeHidden()
    await expect(dialog).toBeVisible()
    await dateButton.click()
    await calendar.getByRole('button', { name: /21 de outubro de 2026$/ }).click()
    await expect(calendar).toBeHidden()
    await expectDate(dialog, 'Vencimento', '2026-10-21')
    await dialog.getByRole('button', { name: 'Mais detalhes', exact: true }).click()
    await fillDate(dialog, 'Competência', '2026-09-20')
    const saved = await savedBatch(page, () => dialog.getByRole('button', { name: 'Salvar', exact: true }).click())
    const created = saved.entries.find(entry => entry.title === fixture.prefix)
    expect(created).toMatchObject({ amount: 12.34, dueDate: '2026-10-21', competenceDate: '2026-09-20', status: 'pending' })
    await expect(dialog).toBeHidden()
    const search = page.getByRole('searchbox', { name: 'Buscar na planilha', exact: true })
    if (!await search.isVisible()) await page.getByRole('button', { name: 'Abrir busca', exact: true }).click()
    await search.fill(fixture.prefix)
    await expect(pendingAmount).toHaveText('R$ 12,34')
    await page.getByRole('tab', { name: 'Planilha', exact: true }).click()
    await expect(pendingAmount).toHaveText('R$ 12,34')
    await page.getByRole('tab', { name: 'Lista', exact: true }).click()
    await page.getByRole('button', { name: `Editar ${fixture.prefix}`, exact: true }).click()
    await expectDate(dialog, 'Competência', '2026-09-20')
    const editedTitle = `${fixture.prefix} editado`
    await dialog.getByLabel('Descrição', { exact: true }).fill(editedTitle)
    await fillDate(dialog, 'Vencimento', '2026-10-25')
    const edited = await savedBatch(page, () => dialog.getByRole('button', { name: 'Salvar', exact: true }).click())
    expect(edited.entries.find(entry => entry.id === created!.id)).toMatchObject({ title: editedTitle, amount: 12.34, dueDate: '2026-10-25', competenceDate: '2026-09-20', status: 'pending' })
    const row = page.locator('.ledger__row').filter({ has: page.getByRole('button', { name: `Editar ${editedTitle}`, exact: true }) })
    const paid = await savedBatch(page, () => row.getByRole('button', { name: `Marcar pago: ${editedTitle}`, exact: true }).click())
    expect(paid.entries.find(entry => entry.id === created!.id)).toMatchObject({ status: 'paid', competenceDate: '2026-09-20' })
    await expect(row.locator('.ledger__amount small')).toHaveText('Pago')
    await expect(pendingAmount).toHaveText('R$ 0,00')
    await expect(pendingSummary).toContainText('Nenhuma despesa pendente.')
    const restored = await savedBatch(page, () => page.locator('.planilha__feedback').getByRole('button', { name: 'Desfazer', exact: true }).click())
    expect(restored.entries.find(entry => entry.id === created!.id)).toMatchObject({ status: 'pending', competenceDate: '2026-09-20' })
    await expect(row.locator('.ledger__amount small')).toHaveText('Pendente')
    await expect(pendingAmount).toHaveText('R$ 12,34')
  })

  test('mantém os dados no editor quando o servidor recusa o salvamento', async ({ page }) => {
    const { prefix } = batches.get(page)!
    await openWorkspace(page, { month: '2026-10', range: 'month', view: 'matrix' })
    await createButton(page).click()
    const dialog = entryDialog(page)
    await dialog.getByLabel('Descrição', { exact: true }).fill(prefix)
    await dialog.getByLabel('Valor (R$)', { exact: true }).fill('12.34')
    await fillDate(dialog, 'Vencimento', '2026-10-21')
    await page.route('**/api/entries/batch**', async route => {
      if (route.request().method() === 'POST') await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ statusCode: 500, message: 'Falha simulada do teste' }) })
      else await route.continue()
    })
    const failed = page.waitForResponse(response => isEntryBatch(response) && response.status() === 500)
    await dialog.getByRole('button', { name: 'Salvar', exact: true }).click()
    await failed
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('alert')).toContainText('Não foi possível salvar')
    await expect(dialog.getByLabel('Descrição', { exact: true })).toHaveValue(prefix)
    await expect(dialog.getByLabel('Valor (R$)', { exact: true })).toHaveValue('12.34')
    await expectDate(dialog, 'Vencimento', '2026-10-21')
    await expect(dialog.getByRole('button', { name: 'Salvar', exact: true })).toBeEnabled()
    await page.unroute('**/api/entries/batch**')
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
  })

  test('preserva a fila offline após erro de sincronização e remove só após confirmação do servidor', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'O comportamento da fila compartilhada não depende da viewport.')
    const fixture = batches.get(page)!
    await openWorkspace(page, { month: '2026-10', range: 'month', view: 'list' })
    await createButton(page).click()
    const dialog = entryDialog(page)
    await dialog.getByLabel('Descrição', { exact: true }).fill(fixture.prefix)
    await dialog.getByLabel('Valor (R$)', { exact: true }).fill('12.34')
    await fillDate(dialog, 'Vencimento', '2026-10-21')
    await context.setOffline(true)
    await dialog.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(page.locator('.planilha__feedback')).toContainText('Pendente de sincronização')
    const readQueue = () => page.evaluate(() => JSON.parse(localStorage.getItem('finance-offline-queue') ?? '[]')) as Promise<{ upserts: Partial<FinanceEntry>[]; deletes: string[] }[]>
    await expect.poll(async () => (await readQueue()).length).toBe(1)
    const queued = await readQueue()
    const localEntry = queued[0]!.upserts.find(entry => entry.title === fixture.prefix)
    expect(localEntry).toMatchObject({ amount: 12.34, status: 'pending', dueDate: '2026-10-21' })
    expect(localEntry?.id).toBeTruthy()
    fixture.ids.add(localEntry!.id!)
    await page.route('**/api/entries/batch**', async route => {
      if (route.request().method() === 'POST') await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ statusCode: 500, message: 'Falha simulada de sincronização' }) })
      else await route.continue()
    })
    const failed = page.waitForResponse(response => isEntryBatch(response) && response.status() === 500)
    await context.setOffline(false)
    await failed
    await expect(page.getByRole('alert').filter({ hasText: 'Há alterações aguardando sincronização' })).toBeVisible()
    expect(await readQueue()).toEqual(queued)
    await page.unroute('**/api/entries/batch**')
    const acknowledged = page.waitForResponse(response => isEntryBatch(response) && response.ok())
    // A new browser online event retries the retained batch through the normal app listener.
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    const saved = await (await acknowledged).json() as { entries: FinanceEntry[] }
    expect(saved.entries.find(entry => entry.id === localEntry!.id)).toMatchObject({ title: fixture.prefix, amount: 12.34, dueDate: '2026-10-21', status: 'pending' })
    await expect.poll(async () => (await readQueue()).length).toBe(0)
    await expect(page.getByRole('button', { name: `Editar ${fixture.prefix}`, exact: true })).toBeVisible()
  })

  test('soma três células com Shift e remove da seleção o que a busca oculta', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'Shift seleciona intervalos no desktop.')
    const prefix = await seedSelectionRow(page)
    await openWorkspace(page, { month: '2026-10', range: 'quarter', view: 'matrix', q: prefix })
    await page.getByRole('button', { name: 'Selecionar células', exact: true }).filter({ visible: true }).click()
    const cells = page.locator('.annual-value')
    await expect(cells).toHaveCount(3)
    await cells.first().click()
    await cells.last().click({ modifiers: ['Shift'] })
    const summary = page.locator('.planilha__selection')
    await expect(summary).toContainText('3 células selecionadas')
    await expect(summary.locator('strong')).toHaveText(/Soma:\s*R\$\s*6,06/)
    await page.getByRole('searchbox', { name: 'Buscar na planilha', exact: true }).fill(`${prefix} nenhum resultado`)
    await expect(cells).toHaveCount(0)
    await expect(summary).toContainText('0 células selecionadas')
    await expect(summary.locator('strong')).toHaveText(/Soma:\s*R\$\s*0,00/)
  })

  test('começa com um mês no celular e mantém conteúdo e editor dentro das larguras suportadas', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'Varre as larguras em um único navegador para evitar repetição.')
    await page.setViewportSize({ width: 360, height: 900 })
    await openWorkspace(page)
    await expect(page.locator('.annual-table .annual-month')).toHaveCount(1)
    await page.getByRole('combobox', { name: 'Período visível', exact: true }).click()
    await page.getByRole('option', { name: '3 meses', exact: true }).click()
    await expect(page.locator('.annual-table .annual-month')).toHaveCount(3)
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await createButton(page).click()
      const dialog = entryDialog(page)
      const description = dialog.getByLabel('Descrição', { exact: true })
      await expect(description).toBeVisible()
      await expect(description).toHaveCSS('height', width <= 767 ? '38px' : '32px')
      await expect(dialog.getByRole('group', { name: 'Vencimento', exact: true })).toHaveCSS('height', width <= 767 ? '38px' : '32px')
      if (width <= 767) await expect(description).toHaveCSS('font-size', '16px')
      const box = await dialog.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
    }
  })
})

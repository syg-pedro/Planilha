import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { parseOnboardingWorkbook } from '../app/features/finance/utils/onboardingWorkbook'
import { parseOnboardingImportPayload } from '../server/utils/onboarding'

const validPayload = () => ({
  version: 1 as const,
  accounts: [{ sourceRow: 4, name: 'Conta principal', type: 'bank' as const, owner: 'Casa', limitTotal: null, closingDay: null, dueDay: null }],
  categories: [{ sourceRow: 4, name: 'Moradia', kind: 'expense' as const, color: '#5b5bf7' }],
  rules: [{ sourceRow: 4, title: 'Aluguel', kind: 'expense' as const, amount: 1200, dueDay: 10, accountName: 'Conta principal', categoryName: 'Moradia' }],
  entries: [{ sourceRow: 4, title: 'Mercado', kind: 'expense' as const, amount: 250, dueDate: '2026-07-20', accountName: 'Conta principal', categoryName: 'Moradia', status: 'pending' as const, installmentIndex: null, installmentTotal: null }],
})

describe('onboarding import validation', () => {
  it('accepts a complete and consistent payload', () => {
    expect(parseOnboardingImportPayload(validPayload())).toMatchObject({
      accounts: [{ name: 'Conta principal' }],
      rules: [{ title: 'Aluguel' }],
    })
  })

  it('rejects a reference that does not exist in the workbook', () => {
    const payload = validPayload()
    payload.entries[0]!.accountName = 'Conta inexistente'
    expect(() => parseOnboardingImportPayload(payload)).toThrow('não existe na aba Contas e cartões')
  })
})

describe('onboarding workbook parser', () => {
  it('reads the supported sheets and converts display labels to domain values', async () => {
    const workbook = new ExcelJS.Workbook()
    const accounts = workbook.addWorksheet('Contas e cartões')
    accounts.addRow(['Nome', 'Tipo', 'Responsável', 'Limite', 'Fechamento', 'Vencimento'])
    accounts.addRow(['Conta principal', 'Conta bancária', 'Casa', '', '', ''])
    const categories = workbook.addWorksheet('Categorias')
    categories.addRow(['Nome', 'Tipo', 'Cor'])
    categories.addRow(['Moradia', 'Despesa', '#5b5bf7'])
    const rules = workbook.addWorksheet('Fixos mensais')
    rules.addRow(['Descrição', 'Tipo', 'Valor', 'Dia de vencimento', 'Conta', 'Categoria'])
    rules.addRow(['Aluguel', 'Despesa', 1200, 10, 'Conta principal', 'Moradia'])
    const entries = workbook.addWorksheet('Lançamentos')
    entries.addRow(['Descrição', 'Tipo', 'Valor', 'Data', 'Conta', 'Categoria', 'Status', 'Parcela atual', 'Total parcelas'])
    entries.addRow(['Mercado', 'Despesa', 250, '20/07/2026', 'Conta principal', 'Moradia', 'Pendente', '', ''])

    const buffer = await workbook.xlsx.writeBuffer() as ArrayBuffer
    const file = {
      name: 'modelo-financeiro-familiar.xlsx',
      size: buffer.byteLength,
      arrayBuffer: async () => buffer,
    } as File

    const result = await parseOnboardingWorkbook(file)
    expect(result.errors).toEqual([])
    expect(result.payload).toMatchObject({
      accounts: [{ type: 'bank' }],
      categories: [{ kind: 'expense' }],
      entries: [{ dueDate: '2026-07-20', status: 'pending' }],
    })
  })
})

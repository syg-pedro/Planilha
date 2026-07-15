import { z } from 'zod'
import { normalizeOnboardingKey } from '../../shared/onboarding'
import type { OnboardingImportPayload } from '../../shared/types'

const name = z.string().trim().min(1).max(100)
const nullableReference = z.string().trim().max(100).nullable()
const sourceRow = z.number().int().min(2).max(1002)

const onboardingImportSchema = z.object({
  version: z.literal(1),
  accounts: z.array(z.object({
    sourceRow,
    name,
    type: z.enum(['bank', 'credit_card', 'benefit', 'external']),
    owner: z.string().trim().max(80),
    limitTotal: z.number().finite().min(0).nullable(),
    closingDay: z.number().int().min(1).max(31).nullable(),
    dueDay: z.number().int().min(1).max(31).nullable(),
  })).max(100),
  categories: z.array(z.object({
    sourceRow,
    name,
    kind: z.enum(['income', 'expense']),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
  })).max(200),
  rules: z.array(z.object({
    sourceRow,
    title: name,
    kind: z.enum(['income', 'expense']),
    amount: z.number().finite().positive(),
    dueDay: z.number().int().min(1).max(31),
    accountName: nullableReference,
    categoryName: nullableReference,
  })).max(500),
  entries: z.array(z.object({
    sourceRow,
    title: name,
    kind: z.enum(['income', 'expense']),
    amount: z.number().finite().positive(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    accountName: nullableReference,
    categoryName: nullableReference,
    status: z.enum(['pending', 'paid', 'review']),
    installmentIndex: z.number().int().min(1).max(999).nullable(),
    installmentTotal: z.number().int().min(1).max(999).nullable(),
  })).max(1000),
})

const duplicateNames = (items: Array<{ name: string; sourceRow: number }>, label: string): string[] => {
  const known = new Map<string, number>()
  const errors: string[] = []
  for (const item of items) {
    const key = normalizeOnboardingKey(item.name)
    const firstRow = known.get(key)
    if (firstRow) {
      errors.push(`${label} duplicada nas linhas ${firstRow} e ${item.sourceRow}.`)
    } else {
      known.set(key, item.sourceRow)
    }
  }
  return errors
}

export const parseOnboardingImportPayload = (body: unknown): OnboardingImportPayload => {
  const parsed = onboardingImportSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    throw new Error(firstIssue?.message || 'O arquivo não está no formato esperado.')
  }

  const payload = parsed.data
  const totalRows = payload.accounts.length + payload.categories.length + payload.rules.length + payload.entries.length
  const errors = [
    ...duplicateNames(payload.accounts, 'Conta'),
    ...duplicateNames(payload.categories, 'Categoria'),
  ]

  if (totalRows === 0) {
    errors.push('Preencha pelo menos uma linha no modelo antes de importar.')
  }

  const accountNames = new Set(payload.accounts.map((item) => normalizeOnboardingKey(item.name)))
  const categoryNames = new Set(payload.categories.map((item) => normalizeOnboardingKey(item.name)))
  for (const item of [...payload.rules, ...payload.entries]) {
    if (item.accountName && !accountNames.has(normalizeOnboardingKey(item.accountName))) {
      errors.push(`Linha ${item.sourceRow}: a conta "${item.accountName}" não existe na aba Contas e cartões.`)
    }
    if (item.categoryName && !categoryNames.has(normalizeOnboardingKey(item.categoryName))) {
      errors.push(`Linha ${item.sourceRow}: a categoria "${item.categoryName}" não existe na aba Categorias.`)
    }
  }

  for (const item of payload.entries) {
    if ((item.installmentIndex === null) !== (item.installmentTotal === null)) {
      errors.push(`Linha ${item.sourceRow}: informe as duas colunas de parcela ou deixe ambas vazias.`)
    }
    if (item.installmentIndex && item.installmentTotal && item.installmentIndex > item.installmentTotal) {
      errors.push(`Linha ${item.sourceRow}: a parcela atual não pode ser maior que o total.`)
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.slice(0, 4).join(' '))
  }

  return payload
}

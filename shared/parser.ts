import { DEFAULT_COLORS, DEFAULT_DASHBOARD_CONFIG, DEFAULT_HOUSEHOLD_ID, MONTH_ALIASES } from './constants'
import { makeId } from './id'
import { buildEntriesFromRules } from './rules'
import type { Account, Category, FinanceEntry, FinanceRule, HouseholdSettings } from './types'

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

const parseAmount = (raw: string): number => {
  const normalized = raw
    .replace(/r\$/gi, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : 0
}

const parseDay = (line: string): number | null => {
  // Prefer explicit vence/vencimento (due date) over standalone "dia" which can also appear in "fecha dia N"
  const match =
    line.match(/(?:vence|vencimento)\s*(?:dia\s*)?(\d{1,2})/i) ??
    line.match(/\bdia\s+(\d{1,2})\b/i)
  if (!match) {
    return null
  }
  const day = Number.parseInt(match[1] ?? '0', 10)
  return day > 0 && day <= 31 ? day : null
}

const parseLimit = (line: string): number | null => {
  const match = line.match(/limite\s+total\s+([\d.,]+)/i)
  return match ? parseAmount(match[1] ?? '0') : null
}

const parseClosingDay = (line: string): number | null => {
  // Handle both "fechamento 11" and "fecha dia 12" patterns
  const match = line.match(/(?:fechamento|fecha|final)\s*(?:dia\s*)?(\d{1,2})/i)
  if (!match) {
    return null
  }
  return Number.parseInt(match[1] ?? '0', 10)
}

const isoDate = (year: number, month: number, day: number): string => {
  const safeDay = Math.max(1, Math.min(day, new Date(Date.UTC(year, month + 1, 0)).getUTCDate()))
  return new Date(Date.UTC(year, month, safeDay)).toISOString().slice(0, 10)
}

interface ParsedSeed {
  settings: HouseholdSettings
  accounts: Account[]
  categories: Category[]
  rules: FinanceRule[]
  entries: FinanceEntry[]
  warnings: string[]
}

interface InstallmentContext {
  accountId: string
  accountName: string
  owner: string
  dueDay: number
  categoryId: string
}

interface InstallmentDraft {
  month: number
  year: number
  amount: number
}

const makeSettings = (): HouseholdSettings => ({
  id: DEFAULT_HOUSEHOLD_ID,
  currency: 'BRL',
  timezone: 'America/Sao_Paulo',
  themeMode: 'light',
  densityMode: 'compact',
  periodMode: 'due_date',
  horizonMonths: 18,
  notificationDays: [3, 1],
  colorTokens: { ...DEFAULT_COLORS },
  dashboardConfig: { ...DEFAULT_DASHBOARD_CONFIG },
  updatedAt: new Date().toISOString()
})

const addAccount = (
  accounts: Account[],
  accountMap: Map<string, string>,
  name: string,
  owner: string,
  type: Account['type'],
  options?: { limitTotal?: number | null; closingDay?: number | null; dueDay?: number | null; active?: boolean }
): string => {
  const existing = accountMap.get(name)
  if (existing) {
    return existing
  }

  const id = makeId('account')
  accounts.push({
    id,
    householdId: DEFAULT_HOUSEHOLD_ID,
    name,
    owner,
    type,
    limitTotal: options?.limitTotal ?? null,
    closingDay: options?.closingDay ?? null,
    dueDay: options?.dueDay ?? null,
    active: options?.active ?? true
  })
  accountMap.set(name, id)
  return id
}

const addCategory = (categories: Category[], map: Map<string, string>, name: string, kind: Category['kind'], color: string): string => {
  const existing = map.get(name)
  if (existing) {
    return existing
  }

  const id = makeId('cat')
  categories.push({
    id,
    householdId: DEFAULT_HOUSEHOLD_ID,
    name,
    kind,
    color
  })
  map.set(name, id)
  return id
}

const addRule = (rules: FinanceRule[], payload: Omit<FinanceRule, 'id' | 'householdId'>): string => {
  const id = makeId('rule')
  rules.push({
    ...payload,
    id,
    householdId: DEFAULT_HOUSEHOLD_ID
  })
  return id
}

const parseInstallmentTokens = (line: string, dueDay: number, nowYear: number): InstallmentDraft[] => {
  const chunks = line
    .split('-')
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  const installments: InstallmentDraft[] = []
  let lastMonth: number | null = null
  let lastYear = nowYear

  for (const chunk of chunks) {
    const onlyValue = chunk.match(/^([\d.,]+)$/)
    if (onlyValue && lastMonth !== null) {
      const nextMonth: number = ((lastMonth ?? 0) + 1) % 12
      if (nextMonth === 0) {
        lastYear += 1
      }
      installments.push({ month: nextMonth, year: lastYear, amount: parseAmount(onlyValue[1] ?? '0') })
      lastMonth = nextMonth
      continue
    }

    // Strip trailing alphabetic words after the last number (e.g. "ago 56,88 assinaturas mensais" → "ago 56,88")
    const cleanedChunk = chunk.replace(/([\d,]+)\s+[a-zA-ZÀ-ú][a-zA-ZÀ-ú\s]*$/, '$1')
    // Year group: 4-digit year OR 2-3 digit year followed by whitespace (so "47,82" is NOT parsed as year 2047)
    const match = cleanedChunk.match(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(\d{4}|\d{2,3}(?=\s))?.*?([\d.,]+)$/i)
    if (!match) {
      continue
    }

    const monthAlias = normalize(match[1] ?? '')
    const monthIndex = MONTH_ALIASES[monthAlias]
    if (typeof monthIndex !== 'number') {
      continue
    }

    let year = lastYear
    if (match[2]) {
      const rawYear = Number.parseInt(match[2] ?? '0', 10)
      year = rawYear < 100 ? 2000 + rawYear : rawYear
    }

    if (!match[2] && lastMonth !== null && monthIndex < lastMonth) {
      year += 1
    }

    const amount = parseAmount(match[3] ?? '0')
    installments.push({ month: monthIndex, year, amount })
    lastMonth = monthIndex
    lastYear = year
  }

  return installments.filter((item) => item.amount > 0 && item.year > 2000 && dueDay >= 1)
}

const pushInstallments = (
  entries: FinanceEntry[],
  context: InstallmentContext,
  installments: InstallmentDraft[],
  title: string,
  description: string
): void => {
  installments.forEach((draft, index) => {
    const dueDate = isoDate(draft.year, draft.month, context.dueDay)
    entries.push({
      id: makeId('entry'),
      householdId: DEFAULT_HOUSEHOLD_ID,
      ruleId: null,
      accountId: context.accountId,
      categoryId: context.categoryId,
      title,
      description,
      amount: draft.amount,
      kind: 'expense',
      dueDate,
      competenceDate: dueDate,
      installmentIndex: index + 1,
      installmentTotal: installments.length,
      status: 'pending',
      origin: 'manual',
      excludeFromCalc: false,
      metadata: { owner: context.owner, source: 'dados.txt' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  })
}

export const parseDadosText = (text: string): ParsedSeed => {
  const nowYear = new Date().getUTCFullYear()
  const settings = makeSettings()
  const categories: Category[] = []
  const accounts: Account[] = []
  const rules: FinanceRule[] = []
  const entries: FinanceEntry[] = []
  const warnings: string[] = []
  const accountMap = new Map<string, string>()
  const categoryMap = new Map<string, string>()

  const catIncome = addCategory(categories, categoryMap, 'Receitas', 'income', '#16a34a')
  const catMoradia = addCategory(categories, categoryMap, 'Moradia', 'expense', '#dc2626')
  const catServicos = addCategory(categories, categoryMap, 'Servicos', 'expense', '#f97316')
  const catEnergia = addCategory(categories, categoryMap, 'Energia', 'expense', '#eab308')
  const catCartoes = addCategory(categories, categoryMap, 'Cartoes', 'expense', '#0ea5e9')
  const catEducacao = addCategory(categories, categoryMap, 'Educacao', 'expense', '#8b5cf6')
  const catParcelaExterna = addCategory(categories, categoryMap, 'Parcela externa', 'expense', '#ef4444')

  const pedroConta = addAccount(accounts, accountMap, 'Conta Pedro', 'Pedro', 'bank')
  const juliConta = addAccount(accounts, accountMap, 'Conta Juli', 'Juli', 'bank')
  const flashConta = addAccount(accounts, accountMap, 'Flash VR', 'Pedro', 'benefit')

  addRule(rules, {
    title: 'Salario Pedro - primeira parcela',
    description: 'Salario mensal Pedro dia 15',
    accountId: pedroConta,
    categoryId: catIncome,
    amount: 1000,
    kind: 'income',
    dueDay: 15,
    frequency: 'monthly',
    startsAt: `${nowYear}-01-01`,
    endsAt: null,
    autoGenerate: true,
    metadata: { source: 'dados.txt' }
  })

  addRule(rules, {
    title: 'Salario Pedro - segunda parcela',
    description: 'Salario mensal Pedro dia 30',
    accountId: pedroConta,
    categoryId: catIncome,
    amount: 1000,
    kind: 'income',
    dueDay: 30,
    frequency: 'monthly',
    startsAt: `${nowYear}-01-01`,
    endsAt: null,
    autoGenerate: true,
    metadata: { source: 'dados.txt' }
  })

  addRule(rules, {
    title: 'Salario Juli',
    description: 'Salario mensal Juli (aprox quinto dia util)',
    accountId: juliConta,
    categoryId: catIncome,
    amount: 1100,
    kind: 'income',
    dueDay: 5,
    frequency: 'monthly',
    startsAt: `${nowYear}-01-01`,
    endsAt: null,
    autoGenerate: true,
    metadata: { source: 'dados.txt' }
  })

  addRule(rules, {
    title: 'Flash VR',
    description: 'Credito vale refeicao',
    accountId: flashConta,
    categoryId: catIncome,
    amount: 800,
    kind: 'income',
    dueDay: 1,
    frequency: 'monthly',
    startsAt: `${nowYear}-01-01`,
    endsAt: null,
    autoGenerate: true,
    metadata: { source: 'dados.txt' }
  })

  addRule(rules, {
    title: 'Internet',
    description: 'Internet mensal',
    accountId: null,
    categoryId: catServicos,
    amount: 99,
    kind: 'expense',
    dueDay: 10,
    frequency: 'monthly',
    startsAt: `${nowYear}-01-01`,
    endsAt: null,
    autoGenerate: true,
    metadata: { source: 'dados.txt' }
  })

  addRule(rules, {
    title: 'Energia',
    description: 'Conta de energia mensal',
    accountId: null,
    categoryId: catEnergia,
    amount: 260,
    kind: 'expense',
    dueDay: 15,
    frequency: 'monthly',
    startsAt: `${nowYear}-01-01`,
    endsAt: null,
    autoGenerate: true,
    metadata: { source: 'dados.txt' }
  })

  addRule(rules, {
    title: 'Aluguel + agua + condominio',
    description: 'Custos fixos de moradia',
    accountId: null,
    categoryId: catMoradia,
    amount: 1700,
    kind: 'expense',
    dueDay: 5,
    frequency: 'monthly',
    startsAt: `${nowYear}-01-01`,
    endsAt: null,
    autoGenerate: true,
    metadata: { source: 'dados.txt' }
  })

  addRule(rules, {
    title: 'Faculdade Juli',
    description: 'Parcela fixa de faculdade',
    accountId: juliConta,
    categoryId: catEducacao,
    amount: 170.73,
    kind: 'expense',
    dueDay: 8,
    frequency: 'monthly',
    startsAt: `${nowYear}-01-01`,
    endsAt: null,
    autoGenerate: true,
    metadata: { source: 'dados.txt' }
  })

  const bikeRuleId = addRule(rules, {
    title: 'Bicicleta - tia',
    description: 'Transferencia dia 10 (10 parcelas)',
    accountId: null,
    categoryId: catParcelaExterna,
    amount: 206,
    kind: 'expense',
    dueDay: 10,
    frequency: 'manual',
    startsAt: `${nowYear}-05-01`,
    endsAt: `${nowYear + 1}-03-31`,
    autoGenerate: false,
    metadata: { installments: 10, source: 'dados.txt' }
  })

  for (let i = 0; i < 10; i += 1) {
    const month = (4 + i) % 12
    const year = nowYear + Math.floor((4 + i) / 12)
    const dueDate = isoDate(year, month, 10)
    entries.push({
      id: makeId('entry'),
      householdId: DEFAULT_HOUSEHOLD_ID,
      ruleId: bikeRuleId,
      accountId: null,
      categoryId: catParcelaExterna,
      title: 'Bicicleta - tia',
      description: 'Parcela combinada',
      amount: 206,
      kind: 'expense',
      dueDate,
      competenceDate: dueDate,
      installmentIndex: i + 1,
      installmentTotal: 10,
      status: 'pending',
      origin: 'manual',
      excludeFromCalc: false,
      metadata: { source: 'dados.txt' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  let installmentContext: any = null

  const setCardContext = (name: string, owner: string, line: string, active = true) => {
    const dueDay = parseDay(line) ?? 5
    const accountId = addAccount(accounts, accountMap, name, owner, 'credit_card', {
      limitTotal: parseLimit(line),
      closingDay: parseClosingDay(line),
      dueDay,
      active
    })
    installmentContext = {
      accountId,
      accountName: name,
      owner,
      dueDay,
      categoryId: catCartoes
    }
  }

  for (const line of lines) {
    const nLine = normalize(line)

    if (nLine.includes('sicredi')) {
      setCardContext('Sicredi Pedro', 'Pedro', line)
      continue
    }
    if (nLine.includes('itau final 8235')) {
      setCardContext('Itau Pedro', 'Pedro', line)
      continue
    }
    if (nLine.includes('nubank limite')) {
      setCardContext('Nubank Pedro', 'Pedro', line)
      continue
    }
    if (nLine.includes('mercado livre')) {
      setCardContext('Mercado Livre Pedro', 'Pedro', line)
      continue
    }
    if (nLine.includes('will pedro')) {
      setCardContext('Will Pedro', 'Pedro', line, false)
      continue
    }
    if (nLine.includes('will (juli)')) {
      setCardContext('Will Juli', 'Juli', line, false)
      continue
    }
    if (nLine.includes('itau juli')) {
      setCardContext('Itau Juli', 'Juli', line)
      continue
    }

    if (!installmentContext) {
      continue
    }

    const hasMonth = /(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i.test(line)
    if (!hasMonth) {
      continue
    }

    const context = installmentContext as InstallmentContext
    const drafts = parseInstallmentTokens(line, context.dueDay, nowYear)
    if (drafts.length === 0) {
      continue
    }

    pushInstallments(
      entries,
      context,
      drafts,
      `${context.accountName} - fatura`,
      'Parcela importada do dados.txt'
    )
  }

  const generated = buildEntriesFromRules(rules, DEFAULT_HOUSEHOLD_ID, settings.horizonMonths)
  entries.push(...generated)

  return {
    settings,
    accounts,
    categories,
    rules,
    entries,
    warnings
  }
}

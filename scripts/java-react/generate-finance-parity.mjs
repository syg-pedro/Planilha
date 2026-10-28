import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../../', import.meta.url))
const nativeDate = Date
const account = (id, type, limitTotal = null) => ({
  id, householdId: 'local-demo', name: `Conta fictícia ${id}`, owner: 'Pessoa fictícia',
  type, limitTotal, closingDay: null, dueDay: null, active: true,
})
const entry = (id, amount, kind, dueDate, options = {}) => ({
  id, householdId: 'local-demo', ruleId: null, accountId: 'bank', categoryId: null,
  title: `Lançamento fictício ${id}`, description: '', amount, kind, dueDate,
  competenceDate: dueDate, installmentIndex: null, installmentTotal: null,
  status: 'pending', origin: 'manual', excludeFromCalc: false, metadata: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', ...options,
})
const cases = [
  {
    name: 'centavos-beneficios-status-e-vencimento-hoje', now: '2026-02-10T12:00:00Z',
    accounts: [account('bank', 'bank'), account('card', 'credit_card', 1000), account('benefit', 'benefit')],
    entries: [
      entry('income', 1000, 'income', '2026-02-10'),
      entry('cent-1', 0.10, 'expense', '2026-02-11'),
      entry('cent-2', 0.20, 'expense', '2026-02-15', { status: 'review' }),
      entry('paid', 20, 'expense', '2026-02-17', { accountId: 'card', status: 'paid' }),
      entry('benefit', 100, 'expense', '2026-02-13', { accountId: 'benefit' }),
      entry('excluded', 50, 'expense', '2026-02-13', { excludeFromCalc: true }),
      entry('today', 5, 'expense', '2026-02-10'),
    ],
  },
  {
    name: 'fevereiro-bissexto-e-competencia', now: '2024-02-20T03:00:00Z',
    accounts: [account('bank', 'bank'), account('card', 'credit_card', 100)],
    entries: [
      entry('leap', 2, 'expense', '2024-02-29', { accountId: 'card', competenceDate: '2024-03-01', status: 'review' }),
      entry('received', 10, 'income', '2024-02-01', { status: 'paid', competenceDate: '2024-01-01' }),
      entry('zero', 0, 'expense', '2024-02-15'),
    ],
  },
  {
    name: 'virada-de-ano-e-parcelas-futuras', now: '2026-12-31T23:00:00Z',
    accounts: [account('bank', 'bank'), account('card', 'credit_card', 500)],
    entries: [
      entry('next-year', 5, 'expense', '2027-01-05', {
        accountId: 'card', competenceDate: '2026-12-15', installmentIndex: 2, installmentTotal: 3,
      }),
      entry('last-day', 10, 'income', '2026-12-31'),
      entry('later', 5, 'expense', '2027-02-05', { installmentIndex: 3, installmentTotal: 3 }),
    ],
  },
]
const server = await createServer({ root, configFile: false, envFile: false, appType: 'custom',
  server: { middlewareMode: true, hmr: false } })
try {
  const finance = await server.ssrLoadModule('/shared/finance.ts')
  for (const fixture of cases) {
    globalThis.Date = class extends nativeDate {
      constructor(...args) { super(...(args.length ? args : [fixture.now])) }
      static now() { return new nativeDate(fixture.now).getTime() }
    }
    const cash = finance.excludeBenefitEntries(fixture.entries, fixture.accounts)
    fixture.expected = {
      kpis: finance.computeKpis(fixture.entries, fixture.accounts),
      paymentCycles: finance.buildExpensePaymentCycles(fixture.entries, fixture.accounts, new Date(), 'America/Sao_Paulo'),
      dueCashflow: finance.buildCashflowSeries(cash, 'due_date'),
      competenceCashflow: finance.buildCashflowSeries(cash, 'competence'),
    }
  }
  const destination = new URL('../../backend-java/src/test/resources/parity/finance-parity.json', import.meta.url)
  await mkdir(new URL('.', destination), { recursive: true })
  await writeFile(destination, `${JSON.stringify(cases, null, 2)}\n`)
  process.stdout.write(`${cases.length} fixtures fictícias geradas pelas funções TypeScript originais.\n`)
} finally {
  globalThis.Date = nativeDate
  await server.close()
}

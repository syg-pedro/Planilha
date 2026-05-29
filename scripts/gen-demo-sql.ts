/**
 * Gera dados fake/demo para a conta teste@teste.com.
 * Execute: npx tsx scripts/gen-demo-sql.ts
 * Output:  scripts/demo-restore.sql
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

// ─── Helpers ────────────────────────────────────────────────────────────────

const uid = (_prefix: string) => randomUUID()

const esc  = (v: string | null | undefined) => v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
const num  = (v: number | null | undefined) => v == null ? 'NULL' : String(v)
const bool = (v: boolean) => v ? 'true' : 'false'
const now  = () => new Date().toISOString()

/** Retorna 'YYYY-MM-DD' para o dia `d` do mês `monthOffset` em relação ao mês atual */
const isoDate = (monthOffset: number, day: number): string => {
  const d = new Date()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + monthOffset)
  const maxDay = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0).getUTCDate()
  d.setUTCDate(Math.min(day, maxDay))
  return d.toISOString().slice(0, 10)
}

// ─── Estrutura de dados ──────────────────────────────────────────────────────

const accounts = [
  { id: uid('acc'), name: 'Conta Corrente',   owner: 'Demo User', type: 'bank',        limitTotal: null, closingDay: null, dueDay: null, active: true  },
  { id: uid('acc'), name: 'Nubank',           owner: 'Demo User', type: 'credit_card', limitTotal: 5000, closingDay: 19,   dueDay: 26,  active: true  },
  { id: uid('acc'), name: 'Itaú Platinum',    owner: 'Demo User', type: 'credit_card', limitTotal: 8000, closingDay: 10,   dueDay: 17,  active: true  },
  { id: uid('acc'), name: 'Vale Refeição',    owner: 'Demo User', type: 'benefit',     limitTotal: null, closingDay: null, dueDay: null, active: true  },
  { id: uid('acc'), name: 'Poupança',         owner: 'Demo User', type: 'bank',        limitTotal: null, closingDay: null, dueDay: null, active: true  },
]
const [corrente, nubank, itau, vr, poupanca] = accounts

const categories = [
  { id: uid('cat'), name: 'Receitas',      kind: 'income',  color: '#16a34a' },
  { id: uid('cat'), name: 'Moradia',       kind: 'expense', color: '#dc2626' },
  { id: uid('cat'), name: 'Alimentação',   kind: 'expense', color: '#f97316' },
  { id: uid('cat'), name: 'Transporte',    kind: 'expense', color: '#eab308' },
  { id: uid('cat'), name: 'Saúde',         kind: 'expense', color: '#06b6d4' },
  { id: uid('cat'), name: 'Lazer',         kind: 'expense', color: '#8b5cf6' },
  { id: uid('cat'), name: 'Serviços',      kind: 'expense', color: '#ec4899' },
  { id: uid('cat'), name: 'Educação',      kind: 'expense', color: '#6366f1' },
  { id: uid('cat'), name: 'Investimentos', kind: 'expense', color: '#14b8a6' },
]
const [catReceitas, catMoradia, catAlimentacao, catTransporte, catSaude, catLazer, catServicos, catEducacao, catInvest] = categories

// ─── Regras recorrentes ──────────────────────────────────────────────────────

const rules = [
  {
    id: uid('rule'), title: 'Salário',          description: 'Salário mensal',
    accountId: corrente!.id, categoryId: catReceitas!.id,
    amount: 6500, kind: 'income',   dueDay: 5,  frequency: 'monthly', autoGenerate: true,
    startsAt: isoDate(-6, 1), endsAt: null,
  },
  {
    id: uid('rule'), title: 'Aluguel',           description: 'Apartamento',
    accountId: corrente!.id, categoryId: catMoradia!.id,
    amount: 1800, kind: 'expense',  dueDay: 10, frequency: 'monthly', autoGenerate: true,
    startsAt: isoDate(-6, 1), endsAt: null,
  },
  {
    id: uid('rule'), title: 'Condomínio',        description: 'Taxa mensal',
    accountId: corrente!.id, categoryId: catMoradia!.id,
    amount: 380, kind: 'expense',   dueDay: 15, frequency: 'monthly', autoGenerate: true,
    startsAt: isoDate(-6, 1), endsAt: null,
  },
  {
    id: uid('rule'), title: 'Internet',          description: 'Plano fibra 500mb',
    accountId: corrente!.id, categoryId: catServicos!.id,
    amount: 99.90, kind: 'expense', dueDay: 20, frequency: 'monthly', autoGenerate: true,
    startsAt: isoDate(-6, 1), endsAt: null,
  },
  {
    id: uid('rule'), title: 'Netflix',           description: 'Plano Premium',
    accountId: nubank!.id, categoryId: catLazer!.id,
    amount: 55.90, kind: 'expense', dueDay: 12, frequency: 'monthly', autoGenerate: true,
    startsAt: isoDate(-6, 1), endsAt: null,
  },
  {
    id: uid('rule'), title: 'Spotify',           description: 'Familiar',
    accountId: nubank!.id, categoryId: catLazer!.id,
    amount: 32.90, kind: 'expense', dueDay: 12, frequency: 'monthly', autoGenerate: true,
    startsAt: isoDate(-6, 1), endsAt: null,
  },
  {
    id: uid('rule'), title: 'Academia',          description: 'Smartfit',
    accountId: nubank!.id, categoryId: catSaude!.id,
    amount: 89.90, kind: 'expense', dueDay: 8,  frequency: 'monthly', autoGenerate: true,
    startsAt: isoDate(-6, 1), endsAt: null,
  },
  {
    id: uid('rule'), title: 'Plano de saúde',    description: 'Bradesco Saúde',
    accountId: corrente!.id, categoryId: catSaude!.id,
    amount: 320, kind: 'expense',   dueDay: 22, frequency: 'monthly', autoGenerate: true,
    startsAt: isoDate(-6, 1), endsAt: null,
  },
  {
    id: uid('rule'), title: 'Transferência poupança', description: 'Reserva mensal',
    accountId: poupanca!.id, categoryId: catInvest!.id,
    amount: 500, kind: 'expense',   dueDay: 6,  frequency: 'monthly', autoGenerate: true,
    startsAt: isoDate(-6, 1), endsAt: null,
  },
]

// ─── Entradas manuais ────────────────────────────────────────────────────────

interface EntryInput {
  title: string
  description?: string
  amount: number
  kind: 'income' | 'expense'
  monthOffset: number
  day: number
  accountId: string | null
  categoryId: string | null
  status: 'paid' | 'pending'
  origin?: 'manual' | 'imported'
  excludeFromCalc?: boolean
  ruleId?: string | null
}

const entry = (e: EntryInput) => ({
  id: uid('entry'),
  ruleId: e.ruleId ?? null,
  accountId: e.accountId,
  categoryId: e.categoryId,
  title: e.title,
  description: e.description ?? '',
  amount: e.amount,
  kind: e.kind,
  dueDate: isoDate(e.monthOffset, e.day),
  competenceDate: isoDate(e.monthOffset, e.day),
  installmentIndex: null as number | null,
  installmentTotal: null as number | null,
  status: e.status,
  origin: e.origin ?? 'manual',
  excludeFromCalc: e.excludeFromCalc ?? false,
  metadata: null,
  createdAt: now(),
  updatedAt: now(),
})

// Lançamentos históricos (meses passados = paid) e futuros (pending)
const manualEntries = [
  // ── Mês -5 ──────────────────────────────────────────────────────────────
  entry({ title: 'Supermercado Extra',    amount: 420,   kind: 'expense', monthOffset: -5, day: 3,  accountId: nubank!.id,    categoryId: catAlimentacao!.id, status: 'paid' }),
  entry({ title: 'Farmácia',             amount: 87.50, kind: 'expense', monthOffset: -5, day: 7,  accountId: nubank!.id,    categoryId: catSaude!.id,       status: 'paid' }),
  entry({ title: 'Gasolina',             amount: 210,   kind: 'expense', monthOffset: -5, day: 9,  accountId: nubank!.id,    categoryId: catTransporte!.id,  status: 'paid' }),
  entry({ title: 'Restaurante Outback',  amount: 185,   kind: 'expense', monthOffset: -5, day: 14, accountId: itau!.id,      categoryId: catLazer!.id,       status: 'paid' }),
  entry({ title: 'Uber',                 amount: 45,    kind: 'expense', monthOffset: -5, day: 16, accountId: nubank!.id,    categoryId: catTransporte!.id,  status: 'paid' }),
  entry({ title: 'Curso online',         amount: 150,   kind: 'expense', monthOffset: -5, day: 20, accountId: nubank!.id,    categoryId: catEducacao!.id,    status: 'paid' }),
  entry({ title: 'Mercado VR',           amount: 800,   kind: 'expense', monthOffset: -5, day: 28, accountId: vr!.id,        categoryId: catAlimentacao!.id, status: 'paid', excludeFromCalc: true }),
  entry({ title: 'Recarga VR',           amount: 800,   kind: 'income',  monthOffset: -5, day: 1,  accountId: vr!.id,        categoryId: catReceitas!.id,    status: 'paid', excludeFromCalc: true }),

  // ── Mês -4 ──────────────────────────────────────────────────────────────
  entry({ title: 'Supermercado Pão de Açúcar', amount: 380, kind: 'expense', monthOffset: -4, day: 5,  accountId: nubank!.id, categoryId: catAlimentacao!.id, status: 'paid' }),
  entry({ title: 'Consulta médica',      amount: 250,   kind: 'expense', monthOffset: -4, day: 8,  accountId: corrente!.id, categoryId: catSaude!.id,       status: 'paid' }),
  entry({ title: 'Gasolina',             amount: 195,   kind: 'expense', monthOffset: -4, day: 11, accountId: nubank!.id,   categoryId: catTransporte!.id,  status: 'paid' }),
  entry({ title: 'Cinema',               amount: 60,    kind: 'expense', monthOffset: -4, day: 13, accountId: nubank!.id,   categoryId: catLazer!.id,       status: 'paid' }),
  entry({ title: 'Presente aniversário', amount: 120,   kind: 'expense', monthOffset: -4, day: 18, accountId: itau!.id,     categoryId: catLazer!.id,       status: 'paid' }),
  entry({ title: 'Livros Amazon',        amount: 89.90, kind: 'expense', monthOffset: -4, day: 22, accountId: nubank!.id,   categoryId: catEducacao!.id,    status: 'paid' }),
  entry({ title: 'Bar com amigos',       amount: 95,    kind: 'expense', monthOffset: -4, day: 25, accountId: nubank!.id,   categoryId: catLazer!.id,       status: 'paid' }),
  entry({ title: 'Mercado VR',           amount: 800,   kind: 'expense', monthOffset: -4, day: 28, accountId: vr!.id,       categoryId: catAlimentacao!.id, status: 'paid', excludeFromCalc: true }),
  entry({ title: 'Recarga VR',           amount: 800,   kind: 'income',  monthOffset: -4, day: 1,  accountId: vr!.id,       categoryId: catReceitas!.id,    status: 'paid', excludeFromCalc: true }),

  // ── Mês -3 ──────────────────────────────────────────────────────────────
  entry({ title: 'Supermercado',         amount: 450,   kind: 'expense', monthOffset: -3, day: 4,  accountId: itau!.id,     categoryId: catAlimentacao!.id, status: 'paid' }),
  entry({ title: 'IPTU parcela',         amount: 310,   kind: 'expense', monthOffset: -3, day: 7,  accountId: corrente!.id, categoryId: catMoradia!.id,     status: 'paid' }),
  entry({ title: 'Gasolina',             amount: 230,   kind: 'expense', monthOffset: -3, day: 10, accountId: nubank!.id,   categoryId: catTransporte!.id,  status: 'paid' }),
  entry({ title: 'Manutenção carro',     amount: 480,   kind: 'expense', monthOffset: -3, day: 15, accountId: itau!.id,     categoryId: catTransporte!.id,  status: 'paid' }),
  entry({ title: 'Delivery iFood',       amount: 75,    kind: 'expense', monthOffset: -3, day: 17, accountId: nubank!.id,   categoryId: catAlimentacao!.id, status: 'paid' }),
  entry({ title: 'Show/Evento',          amount: 180,   kind: 'expense', monthOffset: -3, day: 21, accountId: nubank!.id,   categoryId: catLazer!.id,       status: 'paid' }),
  entry({ title: 'Freelance extra',      amount: 800,   kind: 'income',  monthOffset: -3, day: 25, accountId: corrente!.id, categoryId: catReceitas!.id,    status: 'paid' }),
  entry({ title: 'Mercado VR',           amount: 800,   kind: 'expense', monthOffset: -3, day: 28, accountId: vr!.id,       categoryId: catAlimentacao!.id, status: 'paid', excludeFromCalc: true }),
  entry({ title: 'Recarga VR',           amount: 800,   kind: 'income',  monthOffset: -3, day: 1,  accountId: vr!.id,       categoryId: catReceitas!.id,    status: 'paid', excludeFromCalc: true }),

  // ── Mês -2 ──────────────────────────────────────────────────────────────
  entry({ title: 'Supermercado',         amount: 395,   kind: 'expense', monthOffset: -2, day: 3,  accountId: nubank!.id,   categoryId: catAlimentacao!.id, status: 'paid' }),
  entry({ title: 'Óculos novos',         amount: 650,   kind: 'expense', monthOffset: -2, day: 8,  accountId: itau!.id,     categoryId: catSaude!.id,       status: 'paid' }),
  entry({ title: 'Gasolina',             amount: 220,   kind: 'expense', monthOffset: -2, day: 12, accountId: nubank!.id,   categoryId: catTransporte!.id,  status: 'paid' }),
  entry({ title: 'Restaurante',          amount: 130,   kind: 'expense', monthOffset: -2, day: 16, accountId: nubank!.id,   categoryId: catLazer!.id,       status: 'paid' }),
  entry({ title: 'Delivery iFood',       amount: 85,    kind: 'expense', monthOffset: -2, day: 19, accountId: nubank!.id,   categoryId: catAlimentacao!.id, status: 'paid' }),
  entry({ title: 'Roupas C&A',           amount: 245,   kind: 'expense', monthOffset: -2, day: 23, accountId: itau!.id,     categoryId: catLazer!.id,       status: 'paid' }),
  entry({ title: 'Mercado VR',           amount: 800,   kind: 'expense', monthOffset: -2, day: 28, accountId: vr!.id,       categoryId: catAlimentacao!.id, status: 'paid', excludeFromCalc: true }),
  entry({ title: 'Recarga VR',           amount: 800,   kind: 'income',  monthOffset: -2, day: 1,  accountId: vr!.id,       categoryId: catReceitas!.id,    status: 'paid', excludeFromCalc: true }),

  // ── Mês -1 ──────────────────────────────────────────────────────────────
  entry({ title: 'Supermercado',         amount: 410,   kind: 'expense', monthOffset: -1, day: 4,  accountId: nubank!.id,   categoryId: catAlimentacao!.id, status: 'paid' }),
  entry({ title: 'Gasolina',             amount: 200,   kind: 'expense', monthOffset: -1, day: 9,  accountId: nubank!.id,   categoryId: catTransporte!.id,  status: 'paid' }),
  entry({ title: 'Farmácia',             amount: 65,    kind: 'expense', monthOffset: -1, day: 11, accountId: nubank!.id,   categoryId: catSaude!.id,       status: 'paid' }),
  entry({ title: 'Happy hour',           amount: 110,   kind: 'expense', monthOffset: -1, day: 14, accountId: nubank!.id,   categoryId: catLazer!.id,       status: 'paid' }),
  entry({ title: 'Delivery iFood',       amount: 90,    kind: 'expense', monthOffset: -1, day: 18, accountId: nubank!.id,   categoryId: catAlimentacao!.id, status: 'paid' }),
  entry({ title: 'Streaming Disney+',    amount: 43.90, kind: 'expense', monthOffset: -1, day: 20, accountId: nubank!.id,   categoryId: catLazer!.id,       status: 'paid' }),
  entry({ title: 'Mercado VR',           amount: 800,   kind: 'expense', monthOffset: -1, day: 28, accountId: vr!.id,       categoryId: catAlimentacao!.id, status: 'paid', excludeFromCalc: true }),
  entry({ title: 'Recarga VR',           amount: 800,   kind: 'income',  monthOffset: -1, day: 1,  accountId: vr!.id,       categoryId: catReceitas!.id,    status: 'paid', excludeFromCalc: true }),

  // ── Mês atual (mix pago/pendente) ────────────────────────────────────────
  entry({ title: 'Supermercado',         amount: 380,   kind: 'expense', monthOffset: 0,  day: 3,  accountId: nubank!.id,   categoryId: catAlimentacao!.id, status: 'paid' }),
  entry({ title: 'Gasolina',             amount: 190,   kind: 'expense', monthOffset: 0,  day: 7,  accountId: nubank!.id,   categoryId: catTransporte!.id,  status: 'paid' }),
  entry({ title: 'Restaurante',          amount: 145,   kind: 'expense', monthOffset: 0,  day: 12, accountId: itau!.id,     categoryId: catLazer!.id,       status: 'pending' }),
  entry({ title: 'Delivery iFood',       amount: 70,    kind: 'expense', monthOffset: 0,  day: 15, accountId: nubank!.id,   categoryId: catAlimentacao!.id, status: 'pending' }),
  entry({ title: 'Mercado VR',           amount: 800,   kind: 'expense', monthOffset: 0,  day: 28, accountId: vr!.id,       categoryId: catAlimentacao!.id, status: 'pending', excludeFromCalc: true }),
  entry({ title: 'Recarga VR',           amount: 800,   kind: 'income',  monthOffset: 0,  day: 1,  accountId: vr!.id,       categoryId: catReceitas!.id,    status: 'paid', excludeFromCalc: true }),

  // ── Mês +1 (futuro, tudo pendente) ──────────────────────────────────────
  entry({ title: 'IPTU parcela',         amount: 310,   kind: 'expense', monthOffset: 1,  day: 7,  accountId: corrente!.id, categoryId: catMoradia!.id,     status: 'pending' }),
  entry({ title: 'Viagem planejada',     amount: 1200,  kind: 'expense', monthOffset: 1,  day: 15, accountId: itau!.id,     categoryId: catLazer!.id,       status: 'pending' }),

  // ── Parcelas: Notebook (6x) ──────────────────────────────────────────────
  ...Array.from({ length: 6 }, (_, i) => entry({
    title: 'Notebook Dell',
    description: `Parcela ${i + 1}/6`,
    amount: 499.83,
    kind: 'expense',
    monthOffset: -3 + i,
    day: 17,
    accountId: itau!.id,
    categoryId: catEducacao!.id,
    status: i < 3 ? 'paid' : 'pending',
  })).map((e, i) => ({ ...e, installmentIndex: i + 1, installmentTotal: 6 })),

  // ── Parcelas: TV 65" (4x) ────────────────────────────────────────────────
  ...Array.from({ length: 4 }, (_, i) => entry({
    title: 'TV 65" LG',
    description: `Parcela ${i + 1}/4`,
    amount: 437.50,
    kind: 'expense',
    monthOffset: -1 + i,
    day: 26,
    accountId: nubank!.id,
    categoryId: catLazer!.id,
    status: i === 0 ? 'paid' : 'pending',
  })).map((e, i) => ({ ...e, installmentIndex: i + 1, installmentTotal: 4 })),
]

// ─── Entradas automáticas das regras ─────────────────────────────────────────

const ruleEntries = rules.flatMap(rule => {
  if (!rule.autoGenerate) return []
  const entries = []
  for (let mo = -5; mo <= 12; mo++) {
    const dueDate = isoDate(mo, rule.dueDay)
    const today = new Date().toISOString().slice(0, 10)
    entries.push({
      id: uid('entry'),
      ruleId: rule.id,
      accountId: rule.accountId,
      categoryId: rule.categoryId,
      title: rule.title,
      description: rule.description,
      amount: rule.amount,
      kind: rule.kind,
      dueDate,
      competenceDate: dueDate,
      installmentIndex: null,
      installmentTotal: null,
      status: dueDate < today ? 'paid' : 'pending',
      origin: 'auto',
      excludeFromCalc: false,
      metadata: JSON.stringify({ generatedFromRule: true }),
      createdAt: now(),
      updatedAt: now(),
    })
  }
  return entries
})

// ─── Geração SQL ─────────────────────────────────────────────────────────────

const lines: string[] = []

lines.push('-- =================================================')
lines.push('-- Dados DEMO para teste@teste.com')
lines.push('-- Execute no SQL Editor do Supabase')
lines.push('-- Pré-requisito: fazer login uma vez para criar o household')
lines.push('-- =================================================')
lines.push('')
lines.push(`DO $$`)
lines.push(`DECLARE`)
lines.push(`  v_user_id uuid;`)
lines.push(`  v_hh text;`)
lines.push(`  v_email text := 'teste@teste.com';`)
lines.push(`BEGIN`)
lines.push(`  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;`)
lines.push(`  IF v_user_id IS NULL THEN`)
lines.push(`    RAISE EXCEPTION 'Usuário % não encontrado. Crie a conta no Supabase Auth primeiro.', v_email;`)
lines.push(`  END IF;`)
lines.push(``)
lines.push(`  SELECT household_id INTO v_hh FROM household_members WHERE user_id = v_user_id LIMIT 1;`)
lines.push(`  IF v_hh IS NULL THEN`)
lines.push(`    RAISE EXCEPTION 'Sem household para %. Faça login uma vez para criá-lo.', v_email;`)
lines.push(`  END IF;`)
lines.push(``)
lines.push(`  RAISE NOTICE 'Seeding household: %', v_hh;`)
lines.push(``)
lines.push(`  -- Limpar dados existentes`)
lines.push(`  DELETE FROM entries    WHERE household_id = v_hh;`)
lines.push(`  DELETE FROM rules      WHERE household_id = v_hh;`)
lines.push(`  DELETE FROM accounts   WHERE household_id = v_hh;`)
lines.push(`  DELETE FROM categories WHERE household_id = v_hh;`)
lines.push(``)

lines.push(`  -- Accounts (${accounts.length})`)
for (const a of accounts) {
  lines.push(
    `  INSERT INTO accounts (id, household_id, name, owner, type, limit_total, closing_day, due_day, active) VALUES (` +
    `${esc(a.id)}, v_hh, ${esc(a.name)}, ${esc(a.owner)}, ${esc(a.type)}, ` +
    `${num(a.limitTotal)}, ${num(a.closingDay)}, ${num(a.dueDay)}, ${bool(a.active)});`
  )
}
lines.push(``)

lines.push(`  -- Categories (${categories.length})`)
for (const c of categories) {
  lines.push(
    `  INSERT INTO categories (id, household_id, name, kind, color) VALUES (` +
    `${esc(c.id)}, v_hh, ${esc(c.name)}, ${esc(c.kind)}, ${esc(c.color)});`
  )
}
lines.push(``)

lines.push(`  -- Rules (${rules.length})`)
for (const r of rules) {
  lines.push(
    `  INSERT INTO rules (id, household_id, title, description, account_id, category_id, amount, kind, due_day, frequency, starts_at, ends_at, auto_generate, metadata) VALUES (` +
    `${esc(r.id)}, v_hh, ${esc(r.title)}, ${esc(r.description)}, ` +
    `${esc(r.accountId)}, ${esc(r.categoryId)}, ${num(r.amount)}, ${esc(r.kind)}, ` +
    `${num(r.dueDay)}, ${esc(r.frequency)}, ${esc(r.startsAt)}, NULL, ` +
    `${bool(r.autoGenerate)}, NULL);`
  )
}
lines.push(``)

const allEntries = [...manualEntries, ...ruleEntries]
lines.push(`  -- Entries (${manualEntries.length} manuais + ${ruleEntries.length} automáticas = ${allEntries.length} total)`)
for (const e of allEntries) {
  lines.push(
    `  INSERT INTO entries (id, household_id, rule_id, account_id, category_id, title, description, amount, kind, due_date, competence_date, installment_index, installment_total, status, origin, exclude_from_calc, metadata, created_at, updated_at) VALUES (` +
    `${esc(e.id)}, v_hh, ${esc(e.ruleId)}, ${esc(e.accountId)}, ${esc(e.categoryId)}, ` +
    `${esc(e.title)}, ${esc(e.description)}, ${num(e.amount)}, ${esc(e.kind)}, ` +
    `${esc(e.dueDate)}, ${esc(e.competenceDate)}, ${num(e.installmentIndex)}, ${num(e.installmentTotal)}, ` +
    `${esc(e.status)}, ${esc(e.origin)}, ${bool(e.excludeFromCalc)}, ${esc(e.metadata)}, ` +
    `${esc(e.createdAt)}, ${esc(e.updatedAt)});`
  )
}
lines.push(``)

lines.push(`  RAISE NOTICE 'Seed demo concluído: ${accounts.length} contas, ${categories.length} categorias, ${rules.length} regras, ${allEntries.length} entries';`)
lines.push(`END $$;`)

const sql = lines.join('\n')
const outPath = join(process.cwd(), 'scripts', 'demo-restore.sql')
writeFileSync(outPath, sql, 'utf8')
console.log(`✓ scripts/demo-restore.sql gerado`)
console.log(`  ${accounts.length} contas | ${categories.length} categorias | ${rules.length} regras`)
console.log(`  ${manualEntries.length} entries manuais + ${ruleEntries.length} automáticas = ${allEntries.length} total`)

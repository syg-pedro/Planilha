import { parseDadosText } from '../shared/parser'
import { DEFAULT_DADOS_TEXT } from '../shared/defaultDadosText'
import { buildEntriesFromRules } from '../shared/rules'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

let raw = DEFAULT_DADOS_TEXT
try { raw = readFileSync(join(process.cwd(), 'dados.txt'), 'utf8') } catch { /* use default */ }

const seed = parseDadosText(raw)

// Gera entradas automáticas das regras (assinaturas)
const autoEntries = buildEntriesFromRules(seed.rules, 'PLACEHOLDER_HH', seed.settings.horizonMonths)

const esc = (v: string | null | undefined): string =>
  v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`

const escNum = (v: number | null | undefined): string =>
  v == null ? 'NULL' : String(v)

const escBool = (v: boolean): string => v ? 'true' : 'false'


const lines: string[] = []

lines.push('-- =============================================')
lines.push('-- Seed de dados para uma conta específica.')
lines.push('-- Execute no SQL Editor do Supabase.')
lines.push('-- O household_id é resolvido automaticamente pelo email.')
lines.push('-- =============================================')
lines.push('')
lines.push(`DO $$`)
lines.push(`DECLARE`)
lines.push(`  v_user_id uuid;`)
lines.push(`  v_hh text;`)
lines.push(`  v_email text := 'teste@teste.com';`)
lines.push(`BEGIN`)
lines.push(`  -- Resolve o user_id pelo email`)
lines.push(`  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;`)
lines.push(`  IF v_user_id IS NULL THEN`)
lines.push(`    RAISE EXCEPTION 'Usuário % não encontrado em auth.users. Crie a conta primeiro.', v_email;`)
lines.push(`  END IF;`)
lines.push(``)
lines.push(`  -- Resolve o household_id do usuário`)
lines.push(`  SELECT household_id INTO v_hh FROM household_members WHERE user_id = v_user_id LIMIT 1;`)
lines.push(`  IF v_hh IS NULL THEN`)
lines.push(`    RAISE EXCEPTION 'Nenhum household encontrado para %. Faça login uma vez para criá-lo.', v_email;`)
lines.push(`  END IF;`)
lines.push(``)
lines.push(`  RAISE NOTICE 'Usando household_id: %', v_hh;`)
lines.push(``)
lines.push(`  -- 1. Limpar dados existentes (ordem FK)`)
lines.push(`  DELETE FROM entries    WHERE household_id = v_hh;`)
lines.push(`  DELETE FROM rules      WHERE household_id = v_hh;`)
lines.push(`  DELETE FROM accounts   WHERE household_id = v_hh;`)
lines.push(`  DELETE FROM categories WHERE household_id = v_hh;`)
lines.push(``)

// Accounts
lines.push(`  -- 2. Accounts`)
for (const a of seed.accounts) {
  lines.push(
    `  INSERT INTO accounts (id, household_id, name, owner, type, limit_total, closing_day, due_day, active) VALUES (` +
    `${esc(a.id)}, v_hh, ${esc(a.name)}, ${esc(a.owner)}, ${esc(a.type)}, ` +
    `${escNum(a.limitTotal)}, ${escNum(a.closingDay)}, ${escNum(a.dueDay)}, ${escBool(a.active)});`
  )
}
lines.push(``)

// Categories
lines.push(`  -- 3. Categories`)
for (const c of seed.categories) {
  lines.push(
    `  INSERT INTO categories (id, household_id, name, kind, color) VALUES (` +
    `${esc(c.id)}, v_hh, ${esc(c.name)}, ${esc(c.kind)}, ${esc(c.color)});`
  )
}
lines.push(``)

// Rules
lines.push(`  -- 4. Rules`)
for (const r of seed.rules) {
  lines.push(
    `  INSERT INTO rules (id, household_id, title, description, account_id, category_id, amount, kind, due_day, frequency, starts_at, ends_at, auto_generate, metadata) VALUES (` +
    `${esc(r.id)}, v_hh, ${esc(r.title)}, ${esc(r.description)}, ` +
    `${esc(r.accountId)}, ${esc(r.categoryId)}, ${escNum(r.amount)}, ${esc(r.kind)}, ` +
    `${escNum(r.dueDay)}, ${esc(r.frequency)}, ${esc(r.startsAt)}, ${esc(r.endsAt)}, ` +
    `${escBool(r.autoGenerate)}, NULL);`
  )
}
lines.push(``)

lines.push(`  -- 5. Entries (${seed.entries.length} manuais + ${autoEntries.length} automáticas das regras)`)
for (const e of seed.entries) {
  lines.push(
    `  INSERT INTO entries (id, household_id, rule_id, account_id, category_id, title, description, amount, kind, due_date, competence_date, installment_index, installment_total, status, origin, exclude_from_calc, metadata, created_at, updated_at) VALUES (` +
    `${esc(e.id)}, v_hh, ${esc(e.ruleId)}, ${esc(e.accountId)}, ${esc(e.categoryId)}, ` +
    `${esc(e.title)}, ${esc(e.description)}, ${escNum(e.amount)}, ${esc(e.kind)}, ` +
    `${esc(e.dueDate)}, ${esc(e.competenceDate)}, ${escNum(e.installmentIndex)}, ${escNum(e.installmentTotal)}, ` +
    `${esc(e.status)}, ${esc(e.origin)}, ${escBool(e.excludeFromCalc)}, NULL, ${esc(e.createdAt)}, ${esc(e.updatedAt)});`
  )
}
lines.push(``)

// Auto-generated entries from rules
lines.push(`  -- 6. Entries automáticas geradas das rules`)
for (const e of autoEntries) {
  lines.push(
    `  INSERT INTO entries (id, household_id, rule_id, account_id, category_id, title, description, amount, kind, due_date, competence_date, installment_index, installment_total, status, origin, exclude_from_calc, metadata, created_at, updated_at) VALUES (` +
    `${esc(e.id)}, v_hh, ${esc(e.ruleId)}, ${esc(e.accountId)}, ${esc(e.categoryId)}, ` +
    `${esc(e.title)}, ${esc(e.description)}, ${escNum(e.amount)}, ${esc(e.kind)}, ` +
    `${esc(e.dueDate)}, ${esc(e.competenceDate)}, ${escNum(e.installmentIndex)}, ${escNum(e.installmentTotal)}, ` +
    `${esc(e.status)}, ${esc(e.origin)}, ${escBool(e.excludeFromCalc)}, NULL, ${esc(e.createdAt)}, ${esc(e.updatedAt)});`
  )
}
lines.push(``)

lines.push(`  RAISE NOTICE 'Seed concluído: ${seed.accounts.length} contas, ${seed.categories.length} categorias, ${seed.rules.length} regras, % entries', ${seed.entries.length + autoEntries.length};`)
lines.push(`END $$;`)

const sql = lines.join('\n')
writeFileSync(join(process.cwd(), 'scripts', 'restore.sql'), sql, 'utf8')
console.log(`Gerado: ${seed.accounts.length} contas, ${seed.categories.length} categorias, ${seed.rules.length} regras, ${seed.entries.length} entries manuais + ${autoEntries.length} automáticas`)

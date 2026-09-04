import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { beforeAll, afterAll, expect, it } from 'vitest'

const db = new PGlite()
beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role; create function get_user_household_id() returns text language sql as $$ select 'a'::text $$;")
  await db.exec(`create table household_members(user_id uuid primary key, household_id text, role text); create table household_invitations(id text primary key, household_id text, email text, token text unique, role text, expires_at timestamptz, accepted_at timestamptz);`)
  for (const file of ['0001_init.sql', '0004_entry_exclude_from_calc.sql', '0005_wish_items.sql', '20260904142503_secure_finance_batches.sql']) {
    await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'))
  }
  await db.exec("insert into household_settings(id,color_tokens,dashboard_config) values ('a','{}','{}'),('b','{}','{}');")
}, 30000)
afterAll(() => db.close())
const save = (family: string, table: string, rows: object[], deletes: string[] = []) => db.query('select save_finance_batch($1,$2,$3::jsonb,$4::text[])', [family, table, JSON.stringify(rows), deletes])

it.each(['accounts', 'rules', 'entries', 'wish_items'])('rejects foreign delete/upsert for %s and rolls back the entire batch', async (table) => {
  const base = table === 'accounts' || table === 'wish_items' ? { name: 'Original' } : { title: 'Original', amount: 100, kind: 'expense', due_date: '2026-09-04', starts_at: '2026-09-01' }
  await save('a', table, [{ ...base, id: `${table}-a` }])
  await save('b', table, [{ ...base, id: `${table}-b` }])
  await expect(save('a', table, [], [`${table}-b`])).rejects.toThrow('Foreign record')
  await expect(save('a', table, [{ ...base, id: `${table}-b` }], [`${table}-a`])).rejects.toThrow('Foreign record')
  const remaining = await db.query(`select id from ${table} order by id`)
  expect(remaining.rows).toHaveLength(2)
})
it('preserves rule linkage and metadata on a partial update, validates references', async () => {
  await save('a', 'entries', [{ id: 'linked', title: 'Linked', amount: 10, kind: 'expense', due_date: '2026-09-04', rule_id: 'rules-a', origin: 'auto', metadata: { keep: true } }])
  await save('a', 'entries', [{ id: 'linked', status: 'paid' }])
  const { rows } = await db.query('select rule_id, origin, metadata, status from entries where id = $1', ['linked'])
  expect(rows[0]).toEqual({ rule_id: 'rules-a', origin: 'auto', metadata: { keep: true }, status: 'paid' })
  await expect(save('a', 'entries', [{ id: 'linked', account_id: 'accounts-b' }])).rejects.toThrow('Foreign reference')
})
it('is not executable by public clients', async () => {
  const { rows } = await db.query("select has_function_privilege('anon','save_finance_batch(text,text,jsonb,text[])','execute') as anon, has_function_privilege('authenticated','save_finance_batch(text,text,jsonb,text[])','execute') as authenticated")
  expect(rows[0]).toEqual({ anon: false, authenticated: false })
  const privileges = await db.query("select has_table_privilege('authenticated','household_invitations','insert') as allowed")
  expect(privileges.rows[0]).toEqual({ allowed: false })
})
it('accepts an invitation exactly once and compares normalized emails', async () => {
  await db.exec("insert into household_invitations(id,household_id,email,token,role,expires_at) values ('invite','b','Person@Example.com','token','member',now() + interval '1 day')")
  const user = '00000000-0000-4000-8000-000000000001'
  await expect(db.query('select accept_household_invitation($1,$2,$3)', [user, 'other@example.com', 'token'])).rejects.toThrow('e-mail')
  await db.query('select accept_household_invitation($1,$2,$3)', [user, 'person@example.com', 'token'])
  await expect(db.query('select accept_household_invitation($1,$2,$3)', [user, 'person@example.com', 'token'])).rejects.toThrow('expirado')
  const { rows } = await db.query('select household_id from household_members where user_id = $1', [user])
  expect(rows[0]).toEqual({ household_id: 'b' })
})

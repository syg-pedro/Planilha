import { createError } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { makeId } from '../../shared/id'

export type FinanceTable = 'entries' | 'rules' | 'accounts' | 'wish_items'

export const saveFinanceBatch = async (
  client: SupabaseClient, householdId: string, table: FinanceTable,
  upserts: object[], deletes: string[],
) => {
  const payload = upserts.map(patch => Object.fromEntries(
    Object.entries({ ...patch, id: (patch as { id?: string }).id ?? makeId(table) })
      .filter(([key, value]) => value !== undefined && !['householdId', 'createdAt', 'updatedAt'].includes(key))
      .map(([key, value]) => [key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), value]),
  ))
  const { error } = await client.rpc('save_finance_batch', {
    p_household_id: householdId, p_table: table, p_upserts: payload, p_deletes: deletes,
  })
  if (error) throw createError({
    statusCode: error.code === '42501' ? 403 : error.code?.startsWith('22') || error.code?.startsWith('23') ? 400 : 503,
    statusMessage: error.code === '42501' ? 'Registro não pertence a esta família' : 'Não foi possível salvar o lote com segurança',
  })
}

/** Keyset pagination also works when the Data API caps pages below 1000. */
export const readHouseholdRows = async (client: SupabaseClient, table: string, householdId: string) => {
  const rows: Record<string, any>[] = []
  let after: string | undefined
  for (;;) {
    let query = client.from(table).select('*').eq('household_id', householdId).order('id').limit(500)
    if (after) query = query.gt('id', after)
    const { data, error } = await query
    if (error) throw error
    if (!data?.length) return rows
    rows.push(...data)
    after = data[data.length - 1]!.id
  }
}

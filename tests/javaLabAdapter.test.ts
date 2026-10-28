import { describe, expect, it } from 'vitest'
import { combineJavaLabBatches, createJavaLabAdapter, prepareJavaLabBatch } from '../shared/javaLabAdapter'
import type { JavaLabRequest } from '../shared/javaLabAdapter'

describe('adaptação dos contratos Nitro para Java local', () => {
  it('mescla alteração parcial e elimina identidade e timestamps do corpo editável', () => {
    const atual = { id: 'account-server', householdId: 'family-local', name: 'Cartão fictício', owner: 'Pessoa',
      type: 'credit_card', limitTotal: 200, closingDay: 28, dueDay: 5, active: false, createdAt: 'server-date' }
    const batch = prepareJavaLabBatch('accounts', {
      upserts: [{ id: 'account-server', name: 'Novo nome', householdId: 'foreign', updatedAt: 'client-date' }], deletes: []
    }, [atual])
    expect(batch).toEqual({ upserts: [{ id: 'account-server', data: {
      name: 'Novo nome', owner: 'Pessoa', type: 'credit_card', limitTotal: 200, closingDay: 28, dueDay: 5, active: false
    } }], deletes: [] })
    expect(atual.name).toBe('Cartão fictício')
  })

  it('converte IDs de criação locais em identidade gerada pelo servidor sem sobrescrever contexto alheio', () => {
    const batch = prepareJavaLabBatch('entries', { upserts: [{ id: 'client-created', householdId: 'foreign',
      title: 'Despesa fictícia', amount: 0.10, kind: 'expense', dueDate: '2026-10-28' }], deletes: ['unknown'] }, [])
    expect(batch.upserts[0]?.id).toBeNull()
    expect(batch.upserts[0]?.data).toMatchObject({ title: 'Despesa fictícia', amount: 0.10,
      dueDate: '2026-10-28', competenceDate: '2026-10-28', status: 'pending', origin: 'manual' })
    expect(batch.upserts[0]?.data).not.toHaveProperty('householdId')
    expect(batch.upserts[0]?.data).not.toHaveProperty('id')
    expect(batch.deletes).toEqual([])
  })

  it('consolida criação e edição offline para não duplicar registros com novo ID no servidor', () => {
    const combined = combineJavaLabBatches([
      { upserts: [{ id: 'client-a', title: 'Primeiro', amount: 10 }, { id: 'client-b', title: 'Excluir' }], deletes: [] },
      { upserts: [{ id: 'client-a', amount: 20 }], deletes: ['client-b'] }
    ])
    expect(combined).toEqual({ upserts: [{ id: 'client-a', title: 'Primeiro', amount: 20 }], deletes: ['client-b'] })
    const result = prepareJavaLabBatch('entries', combined, [])
    expect(result.upserts).toHaveLength(1)
    expect(result.upserts[0]?.id).toBeNull()
    expect(result.deletes).toEqual([])
  })

  it('lê a coleção antes de enviar uma única operação de batch transacional', async () => {
    const calls: { path: string; options: Parameters<JavaLabRequest>[1] }[] = []
    const request: JavaLabRequest = async <T>(path: string, options = {}): Promise<T> => {
      calls.push({ path, options })
      return (path === '/api/wishlist' ? { items: [{ id: 'wish-server', name: 'Fictício', status: 'saving', price: 0 }] }
        : { items: [{ id: 'wish-server', name: 'Atualizado' }] }) as T
    }
    const adapter = createJavaLabAdapter(request)
    const response = await adapter('/api/wishlist/batch', { method: 'POST', body: {
      upserts: [{ id: 'wish-server', name: 'Atualizado' }], deletes: []
    } })
    expect(calls.map(call => call.path)).toEqual(['/api/wishlist', '/api/legacy/wishlist/batch'])
    expect(calls[1]?.options?.body).toMatchObject({ upserts: [{ id: 'wish-server', data: { name: 'Atualizado', status: 'saving', price: 0 } }] })
    expect(response).toEqual({ items: [{ id: 'wish-server', name: 'Atualizado' }] })
  })

  it('recusa endereço externo e restauração de seed antes de qualquer requisição', async () => {
    let calls = 0
    const request: JavaLabRequest = async <T>(): Promise<T> => { calls++; return {} as T }
    const adapter = createJavaLabAdapter(request)
    for (const path of ['https://example.test/api/bootstrap', '//example.test/api/bootstrap', '/api/../bootstrap', '/api/entries/reseed']) {
      await expect(adapter(path)).rejects.toThrow()
    }
    expect(calls).toBe(0)
  })

  it('rejeita lote malformado e preserva endpoints Java já compatíveis', async () => {
    const paths: string[] = []
    const request: JavaLabRequest = async <T>(path: string): Promise<T> => { paths.push(path); return { settings: {} } as T }
    const adapter = createJavaLabAdapter(request)
    await expect(adapter('/api/entries/batch', { method: 'POST', body: { upserts: [null], deletes: [] } })).rejects.toThrow()
    await adapter('/api/settings/theme', { method: 'POST', body: { themeMode: 'dark' } })
    expect(paths).toEqual(['/api/settings/theme'])
  })
})

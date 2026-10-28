type Resource = 'accounts' | 'entries' | 'rules' | 'wishlist'
type Item = Record<string, unknown>
type Batch = { upserts: Item[]; deletes: string[] }
export type JavaLabRequestOptions = { method?: 'GET' | 'POST'; body?: unknown }
export type JavaLabRequest = <T>(path: string, options?: JavaLabRequestOptions) => Promise<T>

const fields: Record<Resource, readonly string[]> = {
  accounts: ['name', 'owner', 'type', 'limitTotal', 'closingDay', 'dueDay', 'active'],
  entries: ['ruleId', 'accountId', 'categoryId', 'title', 'description', 'amount', 'kind', 'dueDate', 'competenceDate',
    'installmentIndex', 'installmentTotal', 'status', 'origin', 'excludeFromCalc', 'metadata'],
  rules: ['title', 'description', 'accountId', 'categoryId', 'amount', 'kind', 'dueDay', 'frequency', 'startsAt', 'endsAt', 'autoGenerate', 'metadata'],
  wishlist: ['name', 'price', 'url', 'imageUrl', 'notes', 'priority', 'status', 'category']
}

const defaults: Record<Resource, Item> = {
  accounts: { owner: '', type: 'bank', limitTotal: null, closingDay: null, dueDay: null, active: true },
  entries: { ruleId: null, accountId: null, categoryId: null, description: '', installmentIndex: null,
    installmentTotal: null, status: 'pending', origin: 'manual', excludeFromCalc: false, metadata: null },
  rules: { description: '', accountId: null, categoryId: null, dueDay: null, frequency: 'monthly', endsAt: null, autoGenerate: true, metadata: null },
  wishlist: { price: null, url: null, imageUrl: null, notes: null, priority: 'medium', status: 'want', category: null }
}

export const combineJavaLabBatches = (batches: Batch[]): Batch => {
  const upserts = new Map<string, Item>()
  const deletes = new Set<string>()
  for (const batch of batches) {
    for (const id of batch.deletes) {
      deletes.add(id)
      upserts.delete(id)
    }
    for (const patch of batch.upserts) {
      const id = typeof patch.id === 'string' && patch.id ? patch.id : `new:${upserts.size}`
      upserts.set(id, { ...upserts.get(id), ...patch })
      deletes.delete(id)
    }
  }
  return { upserts: [...upserts.values()], deletes: [...deletes] }
}

export const prepareJavaLabBatch = (resource: Resource, batch: Batch, current: Item[]) => {
  const records = new Map(current.map(item => [item.id, item]))
  const combined = combineJavaLabBatches([batch])
  return {
    upserts: combined.upserts.map(patch => {
      const existing = typeof patch.id === 'string' ? records.get(patch.id) : undefined
      const merged = { ...defaults[resource], ...existing, ...patch }
      if (resource === 'entries' && !merged.competenceDate) merged.competenceDate = merged.dueDate
      const data = Object.fromEntries(fields[resource].filter(field => merged[field] !== undefined).map(field => [field, merged[field]]))
      return { id: existing?.id ?? null, data }
    }),
    deletes: combined.deletes.filter(id => records.has(id))
  }
}

export const createJavaLabAdapter = (request: JavaLabRequest): JavaLabRequest => async <T>(path: string, options: JavaLabRequestOptions = {}): Promise<T> => {
  if (!/^\/api\/(bootstrap|accounts|entries|rules|wishlist|settings|onboarding|import|reports|auth|families)(?:\/|\?|$)/.test(path)
    || /\.\.|%2e|[\\#]/i.test(path)) {
    throw new Error('Este endereço não está disponível no laboratório Java.')
  }
  if (path === '/api/entries/reseed') throw new Error('O laboratório usa apenas dados fictícios. A importação do arquivo original está desativada.')
  const match = path.match(/^\/api\/(accounts|entries|rules|wishlist)\/batch$/)
  if (!match) return request<T>(path, options)
  const resource = match[1] as Resource
  const body = options.body as Batch | undefined
  if (!body || !Array.isArray(body.upserts) || !Array.isArray(body.deletes)
    || body.upserts.some(item => !item || typeof item !== 'object' || Array.isArray(item))
    || body.deletes.some(id => typeof id !== 'string')) throw new Error('Confira as alterações antes de salvar.')
  const collection = resource === 'wishlist' ? 'items' : resource
  const response = await request<Record<string, Item[]>>(`/api/${resource}`)
  const current = response[collection]
  if (!Array.isArray(current)) throw new Error('Não foi possível conferir os registros do laboratório.')
  return request<T>(`/api/legacy/${resource}/batch`, { method: 'POST', body: prepareJavaLabBatch(resource, body, current) })
}

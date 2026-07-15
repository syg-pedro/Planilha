import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const email = process.env.TEST_ACCOUNT_EMAIL
const password = process.env.TEST_ACCOUNT_PASSWORD
const configuredUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
const configuredServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY
const managementToken = process.env.SUPABASE_ACCESS_TOKEN
const projectRef = process.env.SUPABASE_PROJECT_REF

if (!email || !password) {
  throw new Error('Defina TEST_ACCOUNT_EMAIL e TEST_ACCOUNT_PASSWORD.')
}

const resolveCredentials = async () => {
  if (configuredUrl && configuredServiceKey) {
    return { url: configuredUrl, key: configuredServiceKey }
  }

  if (!managementToken || !projectRef) {
    throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_KEY, ou SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF.')
  }

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${managementToken}` }
  })
  const keys = await response.json().catch(() => [])
  if (!response.ok || !Array.isArray(keys)) {
    throw new Error(`Não foi possível obter a chave de servidor do projeto (${response.status}).`)
  }

  const elevated = keys.find((key) => key.name === 'service_role' || key.type === 'secret' || key.api_key?.startsWith('sb_secret_'))
  if (!elevated?.api_key) {
    throw new Error('O projeto não possui uma chave de servidor disponível para o gerador.')
  }

  return { url: `https://${projectRef}.supabase.co`, key: elevated.api_key }
}

const { url: supabaseUrl, key: serviceKey } = await resolveCredentials()
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
})
const now = new Date()
const nowIso = now.toISOString()
const today = nowIso.slice(0, 10)

const colors = {
  primary: '#00ff33',
  accent: '#bb00ff',
  positive: '#13a86b',
  negative: '#e84545',
  neutral: '#9aa2b2',
  background: '#090b10',
  card: '#171c25'
}

const dashboardConfig = {
  visibleWidgets: ['kpis', 'cashflow', 'projection', 'category', 'cards', 'limits', 'heatmap', 'upcoming'],
  sortMode: 'date_asc',
  defaultRange: 'month'
}

const failIfError = (error, action) => {
  if (error) throw new Error(`${action}: ${error.message}`)
}

const pad = (value) => String(value).padStart(2, '0')

const isoDate = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`

const idFor = (householdId, name) => `test-${householdId.slice(-12)}-${name}`

const buildMonths = () => Array.from({ length: 24 }, (_, index) => {
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 12 + index, 1))
  return { year: month.getUTCFullYear(), month: month.getUTCMonth(), index }
})

const statusFor = (date, variant = 0) => {
  if (date < today) return 'paid'
  if (variant % 5 === 0) return 'review'
  return 'pending'
}

const insertInBatches = async (table, rows) => {
  for (let index = 0; index < rows.length; index += 250) {
    const { error } = await supabase.from(table).insert(rows.slice(index, index + 250))
    failIfError(error, `Inserir ${table}`)
  }
}

const clearTestData = async (householdId) => {
  for (const table of ['wish_items', 'imports_csv', 'budgets', 'entries', 'rules', 'accounts', 'categories', 'patrimony', 'goals']) {
    const { error } = await supabase.from(table).delete().eq('household_id', householdId)
    failIfError(error, `Limpar ${table}`)
  }
}

const getOrCreateUser = async () => {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  failIfError(listError, 'Listar usuários')

  const existing = users.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
    failIfError(error, 'Atualizar usuário de teste')
    return existing
  }

  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
  failIfError(error, 'Criar usuário de teste')
  if (!data.user) throw new Error('O Supabase não retornou o usuário de teste criado.')
  return data.user
}

const getOrCreateHousehold = async (userId) => {
  const { data: membership, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .maybeSingle()
  failIfError(memberError, 'Buscar household do usuário de teste')
  if (membership?.household_id) return membership.household_id

  const householdId = `hh-test-${userId}`
  const { error: settingsError } = await supabase.from('household_settings').insert({
    id: householdId,
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    theme_mode: 'dark',
    density_mode: 'compact',
    period_mode: 'due_date',
    horizon_months: 24,
    notification_days: [3, 1],
    notification_time: '09:00',
    color_tokens: colors,
    dashboard_config: dashboardConfig,
    updated_at: nowIso
  })
  failIfError(settingsError, 'Criar household de teste')

  const { error: insertMemberError } = await supabase.from('household_members').insert({
    user_id: userId,
    household_id: householdId,
    role: 'owner'
  })
  failIfError(insertMemberError, 'Vincular usuário ao household de teste')
  return householdId
}

const seed = async () => {
  const user = await getOrCreateUser()
  const householdId = await getOrCreateHousehold(user.id)

  const { error: settingsError } = await supabase.from('household_settings').update({
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    theme_mode: 'dark',
    density_mode: 'compact',
    period_mode: 'due_date',
    horizon_months: 24,
    notification_days: [3, 1],
    notification_time: '09:00',
    color_tokens: colors,
    dashboard_config: dashboardConfig,
    updated_at: nowIso
  }).eq('id', householdId)
  failIfError(settingsError, 'Atualizar configurações de teste')

  await clearTestData(householdId)

  const ids = {
    bank: idFor(householdId, 'bank'),
    card: idFor(householdId, 'card'),
    card2: idFor(householdId, 'card2'),
    benefit: idFor(householdId, 'benefit'),
    external: idFor(householdId, 'external'),
    inactive: idFor(householdId, 'inactive'),
    salary: idFor(householdId, 'salary'),
    freelance: idFor(householdId, 'freelance'),
    rent: idFor(householdId, 'rent'),
    food: idFor(householdId, 'food'),
    transport: idFor(householdId, 'transport'),
    subscriptions: idFor(householdId, 'subscriptions'),
    health: idFor(householdId, 'health'),
    education: idFor(householdId, 'education'),
    leisure: idFor(householdId, 'leisure'),
    travel: idFor(householdId, 'travel'),
    debt: idFor(householdId, 'debt'),
    otherIncome: idFor(householdId, 'other-income'),
    salaryRule: idFor(householdId, 'rule-salary'),
    rentRule: idFor(householdId, 'rule-rent'),
    internetRule: idFor(householdId, 'rule-internet'),
    streamingRule: idFor(householdId, 'rule-streaming'),
    gymRule: idFor(householdId, 'rule-gym'),
    manualRule: idFor(householdId, 'rule-manual')
  }

  const accounts = [
    { id: ids.bank, household_id: householdId, name: 'Conta Principal', owner: 'Conta de testes', type: 'bank', limit_total: null, closing_day: null, due_day: null, active: true },
    { id: ids.card, household_id: householdId, name: 'Cartão Teste Platinum', owner: 'Conta de testes', type: 'credit_card', limit_total: 8500, closing_day: 3, due_day: 10, active: true },
    { id: ids.card2, household_id: householdId, name: 'Cartão Teste Viagens', owner: 'Conta de testes', type: 'credit_card', limit_total: 4200, closing_day: 18, due_day: 25, active: true },
    { id: ids.benefit, household_id: householdId, name: 'Vale Alimentação', owner: 'Conta de testes', type: 'benefit', limit_total: 900, closing_day: null, due_day: null, active: true },
    { id: ids.external, household_id: householdId, name: 'Conta Compartilhada', owner: 'Outro titular', type: 'external', limit_total: null, closing_day: null, due_day: null, active: true },
    { id: ids.inactive, household_id: householdId, name: 'Conta Encerrada', owner: 'Conta de testes', type: 'bank', limit_total: null, closing_day: null, due_day: null, active: false }
  ]

  const categories = [
    [ids.salary, 'Salário', 'income', '#13a86b'],
    [ids.freelance, 'Freelance', 'income', '#2dd4bf'],
    [ids.otherIncome, 'Outras receitas', 'income', '#60a5fa'],
    [ids.rent, 'Moradia', 'expense', '#f97316'],
    [ids.food, 'Alimentação', 'expense', '#f59e0b'],
    [ids.transport, 'Transporte', 'expense', '#3b82f6'],
    [ids.subscriptions, 'Assinaturas', 'expense', '#a855f7'],
    [ids.health, 'Saúde', 'expense', '#ec4899'],
    [ids.education, 'Educação', 'expense', '#14b8a6'],
    [ids.leisure, 'Lazer', 'expense', '#8b5cf6'],
    [ids.travel, 'Viagens', 'expense', '#06b6d4'],
    [ids.debt, 'Dívidas e parcelas', 'expense', '#ef4444']
  ].map(([id, name, kind, color]) => ({ id, household_id: householdId, name, kind, color }))

  const months = buildMonths()
  const startDate = isoDate(months[0].year, months[0].month, 1)
  const endDate = isoDate(months.at(-1).year, months.at(-1).month, 28)
  const rules = [
    { id: ids.salaryRule, household_id: householdId, title: 'Salário mensal', description: 'Receita recorrente para testar fluxo de caixa', account_id: ids.bank, category_id: ids.salary, amount: 7800, kind: 'income', due_day: 5, frequency: 'monthly', starts_at: startDate, ends_at: null, auto_generate: true, metadata: { testData: true } },
    { id: ids.rentRule, household_id: householdId, title: 'Aluguel', description: 'Despesa fixa de moradia', account_id: ids.bank, category_id: ids.rent, amount: 2350, kind: 'expense', due_day: 8, frequency: 'monthly', starts_at: startDate, ends_at: null, auto_generate: true, metadata: { testData: true } },
    { id: ids.internetRule, household_id: householdId, title: 'Internet fibra', description: 'Assinatura residencial', account_id: ids.card, category_id: ids.subscriptions, amount: 129.9, kind: 'expense', due_day: 12, frequency: 'monthly', starts_at: startDate, ends_at: null, auto_generate: true, metadata: { testData: true, subscription: true } },
    { id: ids.streamingRule, household_id: householdId, title: 'Streaming', description: 'Assinatura mensal de vídeo', account_id: ids.card, category_id: ids.subscriptions, amount: 55.9, kind: 'expense', due_day: 15, frequency: 'monthly', starts_at: startDate, ends_at: null, auto_generate: true, metadata: { testData: true, subscription: true } },
    { id: ids.gymRule, household_id: householdId, title: 'Academia', description: 'Assinatura de saúde', account_id: ids.card2, category_id: ids.health, amount: 119.9, kind: 'expense', due_day: 20, frequency: 'monthly', starts_at: startDate, ends_at: null, auto_generate: true, metadata: { testData: true, subscription: true } },
    { id: ids.manualRule, household_id: householdId, title: 'Bônus anual planejado', description: 'Regra manual sem geração automática', account_id: ids.bank, category_id: ids.otherIncome, amount: 1500, kind: 'income', due_day: null, frequency: 'manual', starts_at: startDate, ends_at: endDate, auto_generate: false, metadata: { testData: true } }
  ]

  const entries = []
  const addEntry = ({ id, ruleId = null, accountId = null, categoryId = null, title, description, amount, kind, dueDate, status, origin, installmentIndex = null, installmentTotal = null, excludeFromCalc = false, metadata = null }) => {
    entries.push({
      id,
      household_id: householdId,
      rule_id: ruleId,
      account_id: accountId,
      category_id: categoryId,
      title,
      description,
      amount,
      kind,
      due_date: dueDate,
      competence_date: dueDate,
      installment_index: installmentIndex,
      installment_total: installmentTotal,
      status,
      origin,
      exclude_from_calc: excludeFromCalc,
      metadata,
      created_at: nowIso,
      updated_at: nowIso
    })
  }

  for (const { year, month, index } of months) {
    const day = (value) => isoDate(year, month, value)
    addEntry({ id: idFor(householdId, `salary-${index}`), ruleId: ids.salaryRule, accountId: ids.bank, categoryId: ids.salary, title: 'Salário mensal', description: 'Gerado por regra', amount: 7800 + (index % 4) * 100, kind: 'income', dueDate: day(5), status: statusFor(day(5), index), origin: 'auto', metadata: { generatedFromRule: true, testData: true } })
    addEntry({ id: idFor(householdId, `rent-${index}`), ruleId: ids.rentRule, accountId: ids.bank, categoryId: ids.rent, title: 'Aluguel', description: 'Gerado por regra', amount: 2350, kind: 'expense', dueDate: day(8), status: statusFor(day(8), index + 1), origin: 'auto', metadata: { generatedFromRule: true, testData: true } })
    addEntry({ id: idFor(householdId, `internet-${index}`), ruleId: ids.internetRule, accountId: ids.card, categoryId: ids.subscriptions, title: 'Internet fibra', description: 'Gerado por regra', amount: 129.9, kind: 'expense', dueDate: day(12), status: statusFor(day(12), index + 2), origin: 'auto', metadata: { generatedFromRule: true, testData: true } })
    addEntry({ id: idFor(householdId, `streaming-${index}`), ruleId: ids.streamingRule, accountId: ids.card, categoryId: ids.subscriptions, title: 'Streaming', description: 'Gerado por regra', amount: 55.9, kind: 'expense', dueDate: day(15), status: statusFor(day(15), index + 3), origin: 'auto', metadata: { generatedFromRule: true, testData: true } })
    addEntry({ id: idFor(householdId, `gym-${index}`), ruleId: ids.gymRule, accountId: ids.card2, categoryId: ids.health, title: 'Academia', description: 'Gerado por regra', amount: 119.9, kind: 'expense', dueDate: day(20), status: statusFor(day(20), index + 4), origin: 'auto', metadata: { generatedFromRule: true, testData: true } })
    addEntry({ id: idFor(householdId, `food-${index}`), accountId: ids.benefit, categoryId: ids.food, title: 'Supermercado', description: 'Compra manual no vale alimentação', amount: 380 + (index % 5) * 35, kind: 'expense', dueDate: day(16), status: statusFor(day(16), index + 5), origin: 'manual', metadata: { testData: true } })
    addEntry({ id: idFor(householdId, `transport-${index}`), accountId: ids.bank, categoryId: ids.transport, title: 'Transporte', description: 'Combustível e mobilidade', amount: 260 + (index % 4) * 25, kind: 'expense', dueDate: day(18), status: statusFor(day(18), index + 6), origin: 'manual', metadata: { testData: true } })
    addEntry({ id: idFor(householdId, `card-${index}`), accountId: ids.card, categoryId: ids.leisure, title: 'Compra no cartão', description: 'Despesa avulsa para a fatura', amount: 180 + (index % 6) * 75, kind: 'expense', dueDate: day(25), status: statusFor(day(25), index + 7), origin: 'manual', metadata: { testData: true } })

    if (index % 3 === 0) {
      addEntry({ id: idFor(householdId, `freelance-${index}`), accountId: ids.external, categoryId: ids.freelance, title: 'Projeto freelancer', description: 'Receita eventual', amount: 1250 + (index % 4) * 300, kind: 'income', dueDate: day(22), status: statusFor(day(22), index + 8), origin: 'manual', metadata: { testData: true } })
    }
    if (index % 4 === 0) {
      addEntry({ id: idFor(householdId, `import-${index}`), accountId: ids.bank, categoryId: ids.food, title: 'Compra importada de CSV', description: 'Lançamento importado', amount: 94.5 + index, kind: 'expense', dueDate: day(27), status: statusFor(day(27), index + 9), origin: 'imported', metadata: { testData: true, csv: { description: 'Compra importada de CSV', amount: String(94.5 + index), date: day(27) } } })
    }
    if (index % 6 === 0) {
      addEntry({ id: idFor(householdId, `reimbursement-${index}`), accountId: null, categoryId: null, title: 'Reembolso corporativo', description: 'Teste de lançamento excluído dos cálculos', amount: 420, kind: 'income', dueDate: day(28), status: statusFor(day(28), index + 10), origin: 'manual', excludeFromCalc: true, metadata: { testData: true } })
    }
  }

  for (let index = 0; index < 12; index += 1) {
    const due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1))
    const dueDate = isoDate(due.getUTCFullYear(), due.getUTCMonth(), 10)
    addEntry({ id: idFor(householdId, `notebook-${index + 1}`), accountId: ids.card, categoryId: ids.debt, title: 'Notebook para trabalho', description: 'Parcelamento de equipamento', amount: 450, kind: 'expense', dueDate, status: statusFor(dueDate, index), origin: 'manual', installmentIndex: index + 1, installmentTotal: 12, metadata: { testData: true, group: 'notebook' } })
  }

  for (let index = 0; index < 18; index += 1) {
    const due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3 + index, 1))
    const dueDate = isoDate(due.getUTCFullYear(), due.getUTCMonth(), 28)
    addEntry({ id: idFor(householdId, `travel-${index + 1}`), accountId: ids.card2, categoryId: ids.travel, title: 'Viagem de férias', description: 'Parcelamento de viagem', amount: 320, kind: 'expense', dueDate, status: statusFor(dueDate, index + 3), origin: 'manual', installmentIndex: index + 1, installmentTotal: 18, metadata: { testData: true, group: 'travel' } })
  }

  const budgets = months.flatMap(({ year, month, index }) => {
    const monthRef = `${year}-${pad(month + 1)}`
    return [
      [ids.food, 1300],
      [ids.transport, 620],
      [ids.leisure, 700],
      [ids.health, 450],
      [ids.subscriptions, 360]
    ].map(([categoryId, amount], budgetIndex) => ({
      id: idFor(householdId, `budget-${index}-${budgetIndex}`),
      household_id: householdId,
      category_id: categoryId,
      month_ref: monthRef,
      amount: amount + (index % 3) * 25
    }))
  })

  const imports = months.filter(({ index }) => index % 4 === 0).map(({ year, month, index }) => ({
    id: idFor(householdId, `import-record-${index}`),
    household_id: householdId,
    account_id: ids.bank,
    file_name: `extrato-teste-${year}-${pad(month + 1)}.csv`,
    inserted_count: 1,
    warnings: [],
    created_at: nowIso
  }))

  const patrimony = [
    ['asset-emergency', 'Reserva de emergência', 'asset', 18500, 'Investimentos'],
    ['asset-car', 'Automóvel', 'asset', 42000, 'Bens'],
    ['asset-investments', 'Investimentos', 'asset', 12750, 'Investimentos'],
    ['liability-credit', 'Saldo de cartão', 'liability', 1680, 'Dívidas'],
    ['liability-loan', 'Empréstimo pessoal', 'liability', 8400, 'Dívidas']
  ].map(([id, name, kind, value, category]) => ({ id: idFor(householdId, id), household_id: householdId, name, kind, value, category, updated_at: nowIso }))

  const goals = [
    ['goal-emergency', 'Reserva de emergência', 30000, 18500, '2027-01-31', '#13a86b'],
    ['goal-travel', 'Viagem internacional', 15000, 4800, '2027-06-30', '#06b6d4'],
    ['goal-course', 'Especialização', 8000, 2200, '2026-12-15', '#a855f7']
  ].map(([id, name, targetAmount, currentAmount, deadline, color]) => ({ id: idFor(householdId, id), household_id: householdId, name, target_amount: targetAmount, current_amount: currentAmount, deadline, color, created_at: nowIso, updated_at: nowIso }))

  const wishes = [
    ['wish-phone', 'Celular novo', 4200, 'high', 'saving', 'Tecnologia', 'Meta em andamento'],
    ['wish-bike', 'Bicicleta urbana', 2100, 'medium', 'want', 'Lazer', 'Item desejado'],
    ['wish-monitor', 'Monitor ultrawide', 2800, 'high', 'want', 'Trabalho', 'Comparar preços antes de comprar'],
    ['wish-headphones', 'Fone com cancelamento', 950, 'low', 'bought', 'Tecnologia', 'Compra concluída']
  ].map(([id, name, price, priority, status, category, notes]) => ({ id: idFor(householdId, id), household_id: householdId, name, price, url: null, image_url: null, notes, priority, status, category, created_at: nowIso, updated_at: nowIso }))

  await insertInBatches('accounts', accounts)
  await insertInBatches('categories', categories)
  await insertInBatches('rules', rules)
  await insertInBatches('entries', entries)
  await insertInBatches('budgets', budgets)
  await insertInBatches('imports_csv', imports)
  await insertInBatches('patrimony', patrimony)
  await insertInBatches('goals', goals)
  await insertInBatches('wish_items', wishes)

  const tables = ['accounts', 'categories', 'rules', 'entries', 'budgets', 'imports_csv', 'patrimony', 'goals', 'wish_items']
  const counts = {}
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('household_id', householdId)
    failIfError(error, `Contar ${table}`)
    counts[table] = count ?? 0
  }

  console.log(JSON.stringify({ email, householdId, months: { start: startDate, end: endDate, total: months.length }, counts }, null, 2))
}

seed().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

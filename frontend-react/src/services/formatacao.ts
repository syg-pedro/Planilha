export const dinheiro = (valor: number | null | undefined) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL'
}).format(valor ?? 0)

export const dataCurta = (valor: string) => new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: 'short', timeZone: 'UTC'
}).format(new Date(`${valor.slice(0, 10)}T12:00:00Z`))

export const mesAtual = () => new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: '2-digit', timeZone: 'America/Sao_Paulo'
}).format(new Date()).replace(/^(\d{2})\/(\d{4})$/, '$2-$1')

export const hoje = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())

export const intervaloMes = (mes: string) => ({ from: `${mes}-01`,
  to: new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).toISOString().slice(0, 10) })

export const mesNome = (valor: string) => new Intl.DateTimeFormat('pt-BR', {
  month: 'long', year: 'numeric', timeZone: 'UTC'
}).format(new Date(`${valor}-01T12:00:00Z`))

export const camposEditaveis = <T extends object>(registro: T, nomes: readonly string[]) =>
  Object.fromEntries(Object.entries(registro).filter(([nome]) => nomes.includes(nome)))

export const CAMPOS_LANCAMENTO = ['ruleId', 'accountId', 'categoryId', 'title', 'description', 'amount', 'kind',
  'dueDate', 'competenceDate', 'installmentIndex', 'installmentTotal', 'status', 'origin', 'excludeFromCalc', 'metadata'] as const

export const TIPOS = [{ value: 'expense', label: 'Despesa' }, { value: 'income', label: 'Receita' }]
export const SITUACOES = [{ value: 'pending', label: 'Pendente' }, { value: 'paid', label: 'Pago / recebido' },
  { value: 'review', label: 'Revisar' }]

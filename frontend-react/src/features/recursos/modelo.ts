import { z } from 'zod'
import type { Account, Category, FinanceRule, WishItem } from '../../types'

export type Recurso = 'accounts' | 'categories' | 'rules' | 'wishlist'
export type Registro = Account | Category | FinanceRule | WishItem

const campos = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(100, 'Use até 100 caracteres.'),
  responsavel: z.string().trim().max(80, 'Use até 80 caracteres.'),
  tipo: z.enum(['bank', 'credit_card', 'benefit', 'external']), valor: z.string(),
  diaFechamento: z.string(), diaVencimento: z.string(), ativo: z.boolean(), descricao: z.string(),
  natureza: z.enum(['income', 'expense']), frequencia: z.enum(['monthly', 'manual']),
  inicio: z.string(), fim: z.string(), gerarAutomaticamente: z.boolean(), contaId: z.string(), categoriaId: z.string(),
  metadados: z.string(), url: z.string().trim(), imagemUrl: z.string().trim(), observacoes: z.string().trim(),
  prioridade: z.enum(['high', 'medium', 'low']), situacao: z.enum(['want', 'saving', 'bought']),
  categoriaTexto: z.string().trim(), cor: z.string()
})
export type Valores = z.infer<typeof campos>

export const numeroOpcional = (valor: string) => valor.trim() ? Number(valor.trim().replace(',', '.')) : null
export const nomeRegistro = (registro: Registro) => 'name' in registro ? registro.name : registro.title

const dataValida = (valor: string) => !valor || (/^\d{4}-\d{2}-\d{2}$/.test(valor)
  && !Number.isNaN(Date.parse(`${valor}T00:00:00Z`)) && new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) === valor)
const metadadosValidos = (valor: string) => {
  if (!valor.trim()) return true
  try {
    const objeto: unknown = JSON.parse(valor)
    return objeto === null || (typeof objeto === 'object' && !Array.isArray(objeto))
  } catch { return false }
}
const urlValida = (valor: string) => {
  if (!valor) return true
  try {
    const url = new URL(valor)
    return ['http:', 'https:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password
  } catch { return false }
}

export const esquemaFormulario = (recurso: Recurso) => campos.superRefine((dados, contexto) => {
  const erro = (campo: keyof Valores, mensagem: string) => contexto.addIssue({ code: 'custom', path: [campo], message: mensagem })
  const valorNecessario = recurso === 'rules'
  const validarValor = recurso !== 'categories' && (recurso !== 'accounts' || dados.tipo === 'credit_card')
  if (validarValor && ((valorNecessario && !dados.valor.trim())
    || (dados.valor.trim() && !/^\d{1,12}([.,]\d{1,2})?$/.test(dados.valor.trim())))) {
    erro('valor', 'Informe um valor não negativo, com até 12 dígitos e 2 casas decimais.')
  }
  if (recurso === 'accounts' && dados.tipo === 'credit_card' || recurso === 'rules') {
    for (const campo of recurso === 'accounts' ? ['diaFechamento', 'diaVencimento'] as const : ['diaVencimento'] as const) {
      const valor = dados[campo].trim()
      if (valor && (!/^\d+$/.test(valor) || Number(valor) < 1 || Number(valor) > 31)) erro(campo, 'Use um dia entre 1 e 31.')
    }
  }
  if (recurso === 'categories' && !/^#[a-f\d]{6}$/i.test(dados.cor)) erro('cor', 'Use uma cor hexadecimal com seis dígitos.')
  if (recurso === 'rules') {
    if (!dataValida(dados.inicio)) erro('inicio', 'Informe uma data válida.')
    if (!dataValida(dados.fim)) erro('fim', 'Informe uma data válida.')
    if (!metadadosValidos(dados.metadados)) erro('metadados', 'Informe um objeto JSON válido ou deixe vazio.')
  }
  if (recurso === 'wishlist') {
    if (dados.observacoes.length > 5000) erro('observacoes', 'Use até 5000 caracteres.')
    if (dados.categoriaTexto.length > 100) erro('categoriaTexto', 'Use até 100 caracteres.')
    if (dados.url.length > 2048 || !urlValida(dados.url)) erro('url', 'Use um endereço completo http:// ou https://, sem usuário ou senha.')
    if (dados.imagemUrl.length > 2048 || !urlValida(dados.imagemUrl)) erro('imagemUrl', 'Use um endereço completo http:// ou https://, sem usuário ou senha.')
  }
})

export function valoresIniciais(registro: Registro | null, corPadrao: string): Valores {
  const valores: Valores = {
    nome: '', responsavel: '', tipo: 'bank', valor: '', diaFechamento: '', diaVencimento: '', ativo: true,
    descricao: '', natureza: 'expense', frequencia: 'monthly', inicio: '', fim: '', gerarAutomaticamente: true,
    contaId: '', categoriaId: '', metadados: '', url: '', imagemUrl: '', observacoes: '', prioridade: 'medium',
    situacao: 'want', categoriaTexto: '', cor: /^#[a-f\d]{3}$/i.test(corPadrao)
      ? `#${corPadrao.slice(1).split('').map(caractere => caractere + caractere).join('')}` : corPadrao
  }
  if (!registro) return valores
  valores.nome = nomeRegistro(registro)
  if ('type' in registro) Object.assign(valores, { responsavel: registro.owner, tipo: registro.type,
    valor: registro.limitTotal?.toString() ?? '', diaFechamento: registro.closingDay?.toString() ?? '',
    diaVencimento: registro.dueDay?.toString() ?? '', ativo: registro.active })
  else if ('frequency' in registro) Object.assign(valores, { valor: registro.amount.toString(), descricao: registro.description,
    natureza: registro.kind, frequencia: registro.frequency, inicio: registro.startsAt, fim: registro.endsAt ?? '',
    diaVencimento: registro.dueDay?.toString() ?? '', gerarAutomaticamente: registro.autoGenerate,
    contaId: registro.accountId ?? '', categoriaId: registro.categoryId ?? '',
    metadados: registro.metadata ? JSON.stringify(registro.metadata, null, 2) : '' })
  else if ('price' in registro) Object.assign(valores, { valor: registro.price?.toString() ?? '', url: registro.url ?? '',
    imagemUrl: registro.imageUrl ?? '', observacoes: registro.notes ?? '', prioridade: registro.priority,
    situacao: registro.status, categoriaTexto: registro.category ?? '' })
  else Object.assign(valores, { natureza: registro.kind, cor: registro.color })
  return valores
}

export function corpoFormulario(recurso: Recurso, dados: Valores) {
  if (recurso === 'accounts') return { name: dados.nome.trim(), owner: dados.responsavel.trim(), type: dados.tipo,
    limitTotal: dados.tipo === 'credit_card' ? numeroOpcional(dados.valor) : null,
    closingDay: dados.tipo === 'credit_card' ? numeroOpcional(dados.diaFechamento) : null,
    dueDay: dados.tipo === 'credit_card' ? numeroOpcional(dados.diaVencimento) : null, active: dados.ativo }
  if (recurso === 'categories') return { name: dados.nome.trim(), kind: dados.natureza, color: dados.cor }
  if (recurso === 'rules') return { title: dados.nome.trim(), description: dados.descricao, amount: numeroOpcional(dados.valor),
    kind: dados.natureza, dueDay: numeroOpcional(dados.diaVencimento), frequency: dados.frequencia,
    startsAt: dados.inicio || null, endsAt: dados.fim || null, autoGenerate: dados.gerarAutomaticamente,
    accountId: dados.contaId || null, categoryId: dados.categoriaId || null,
    metadata: dados.metadados.trim() ? JSON.parse(dados.metadados) as Record<string, unknown> | null : null }
  return { name: dados.nome.trim(), price: numeroOpcional(dados.valor), url: dados.url.trim() || null,
    imageUrl: dados.imagemUrl.trim() || null, notes: dados.observacoes.trim() || null,
    priority: dados.prioridade, status: dados.situacao, category: dados.categoriaTexto.trim() || null }
}

export const camposServidor: Record<string, keyof Valores> = {
  name: 'nome', title: 'nome', owner: 'responsavel', type: 'tipo', limitTotal: 'valor', amount: 'valor', price: 'valor',
  closingDay: 'diaFechamento', dueDay: 'diaVencimento', active: 'ativo', description: 'descricao', kind: 'natureza',
  frequency: 'frequencia', startsAt: 'inicio', endsAt: 'fim', autoGenerate: 'gerarAutomaticamente', accountId: 'contaId',
  categoryId: 'categoriaId', metadata: 'metadados', url: 'url', imageUrl: 'imagemUrl', notes: 'observacoes',
  priority: 'prioridade', status: 'situacao', category: 'categoriaTexto', color: 'cor'
}

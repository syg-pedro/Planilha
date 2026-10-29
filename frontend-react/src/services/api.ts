import type { Sessao } from '../types'

let token: string | null = null
let renovacao: Promise<Sessao | null> | null = null

const obterBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined) || ''
  return envUrl.replace(/\/+$/, '')
}

export class FalhaApi extends Error {
  constructor(public status: number, public fields: Record<string, string> = {}) {
    super(status === 401 ? 'Sua sessão expirou. Entre novamente.'
      : status === 403 ? 'Você não tem permissão para esta ação.'
        : status === 404 ? 'O registro não foi encontrado. Atualize a página.'
          : status === 400 ? 'Confira os dados informados.'
            : status === 409 ? 'Os dados mudaram. Atualize e tente novamente.'
              : 'Não foi possível concluir. Tente novamente.')
  }
}

export const definirToken = (novo: string | null) => { token = novo }

export const renovarSessao = (): Promise<Sessao | null> => {
  const base = obterBaseUrl()
  renovacao ??= fetch(`${base}/api/auth/refresh`, {
    method: 'POST', credentials: base ? 'include' : 'same-origin', headers: { 'X-Requested-With': 'FinanceiroLab' }
  }).then(async resposta => {
    if (!resposta.ok) { token = null; return null }
    const sessao = await resposta.json() as Sessao
    token = sessao.accessToken
    window.dispatchEvent(new CustomEvent('finance-lab:session', { detail: sessao }))
    return sessao
  }).catch(() => { token = null; return null }).finally(() => { renovacao = null })
  return renovacao
}

export async function api<T>(caminho: string, opcoes: { method?: string; body?: unknown } = {}, repetir = true): Promise<T> {
  if (!caminho.startsWith('/api/') || caminho.includes('://')) throw new FalhaApi(400)
  const base = obterBaseUrl()
  let resposta: Response
  try {
    resposta = await fetch(`${base}${caminho}`, {
      method: opcoes.method ?? 'GET', credentials: base ? 'include' : 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'FinanceiroLab',
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body)
    })
  } catch (erro) {
    console.error('Falha de conexão com o laboratório.', erro)
    throw new FalhaApi(503)
  }
  if (resposta.status === 401 && repetir && !caminho.startsWith('/api/auth/')) {
    if (await renovarSessao()) return api<T>(caminho, opcoes, false)
    window.dispatchEvent(new Event('finance-lab:unauthorized'))
  }
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({})) as { fields?: Record<string, string> }
    if (resposta.status >= 500) console.error('Falha na API local.', resposta.status, caminho)
    throw new FalhaApi(resposta.status, corpo.fields)
  }
  return resposta.status === 204 ? undefined as T : resposta.json() as Promise<T>
}

export const consulta = (filtros: Record<string, string | undefined>) => {
  const parametros = new URLSearchParams()
  Object.entries(filtros).forEach(([nome, valor]) => { if (valor) parametros.set(nome, valor) })
  return parametros.toString() ? `?${parametros}` : ''
}

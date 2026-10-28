import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, definirToken, renovarSessao } from '../services/api'
import type { Sessao } from '../types'

type Contexto = {
  sessao: Sessao | null; carregando: boolean
  entrar: (email: string, password: string) => Promise<void>
  cadastrar: (dados: { name: string; email: string; password: string; familyName: string }) => Promise<void>
  sair: () => Promise<void>; selecionarFamilia: (id: string) => Promise<void>
}
const ContextoSessao = createContext<Contexto | null>(null)

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const cache = useQueryClient()
  const [sessao, definirSessao] = useState<Sessao | null>(null)
  const [carregando, definirCarregando] = useState(true)
  const familiaAtual = useRef<string | null>(null)
  const aplicar = (nova: Sessao | null) => {
    cache.clear()
    definirToken(nova?.accessToken ?? null)
    familiaAtual.current = nova?.family.id ?? null
    definirSessao(nova)
  }
  useEffect(() => {
    let ativo = true
    void renovarSessao().then(nova => { if (ativo) { definirSessao(nova); definirCarregando(false) } })
    const expirar = () => { cache.clear(); definirToken(null); definirSessao(null) }
    const renovar = (evento: Event) => {
      const nova = (evento as CustomEvent<Sessao>).detail
      if (familiaAtual.current !== nova.family.id) cache.clear()
      familiaAtual.current = nova.family.id
      definirSessao(nova)
    }
    window.addEventListener('finance-lab:unauthorized', expirar)
    window.addEventListener('finance-lab:session', renovar)
    return () => { ativo = false; window.removeEventListener('finance-lab:unauthorized', expirar)
      window.removeEventListener('finance-lab:session', renovar) }
  }, [cache])
  const entrar = async (email: string, password: string) => aplicar(await api<Sessao>('/api/auth/login', {
    method: 'POST', body: { email, password }
  }))
  const cadastrar: Contexto['cadastrar'] = async dados => aplicar(await api<Sessao>('/api/auth/register', { method: 'POST', body: dados }))
  const sair = async () => { await api('/api/auth/logout', { method: 'POST' }); aplicar(null) }
  const selecionarFamilia = async (id: string) => aplicar(await api<Sessao>('/api/families/select', { method: 'POST', body: { id } }))
  return <ContextoSessao.Provider value={{ sessao, carregando, entrar, cadastrar, sair, selecionarFamilia }}>{children}</ContextoSessao.Provider>
}

export function useSessao() {
  const contexto = useContext(ContextoSessao)
  if (!contexto) throw new Error('Sessão indisponível.')
  return contexto
}

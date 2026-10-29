import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button, Modal } from '@heroui/react'
import { useSessao } from '../hooks/useSessao'
import { useFinanceiro, useGravar } from '../hooks/useFinanceiro'
import { Carregando, Falha } from './Controles'
import type { HouseholdSettings } from '../types'

const grupos = [
  { titulo: 'Seu dia a dia', paginas: [['/', 'Visão geral', '01'], ['/lancamentos', 'Lançamentos', '02'], ['/planilha', 'Planilha mensal', '03']] },
  { titulo: 'Organizar', paginas: [['/contas', 'Contas e cartões', '04'], ['/categorias', 'Categorias', '05'], ['/recorrencias', 'Recorrências', '06']] },
  { titulo: 'Olhar adiante', paginas: [['/dividas', 'Dívidas', '07'], ['/planejamento', 'Planejamento', '08'], ['/relatorios', 'Relatórios', '09'], ['/desejos', 'Lista de desejos', '10']] },
  { titulo: 'Sua casa', paginas: [['/importacao', 'Importar dados', '11'], ['/familia', 'Família', '12'], ['/configuracoes', 'Configurações', '13']] }
]

function Navegacao({ fechar }: { fechar?: () => void }) {
  return <nav aria-label="Navegação principal">{grupos.map(grupo => <div className="ff-nav__group" key={grupo.titulo}>
    <p>{grupo.titulo}</p>{grupo.paginas.map(([rota, titulo, numero]) => <NavLink end={rota === '/'} key={rota} to={rota} onClick={fechar}>
      <span aria-hidden="true">{numero}</span>{titulo}<span className="ff-nav__indicator" aria-hidden="true">↗</span>
    </NavLink>)}
  </div>)}</nav>
}

export default function Estrutura() {
  const { sessao, carregando, sair } = useSessao()
  const financeiro = useFinanceiro()
  const [erro, definirErro] = useState<unknown>(null)
  const [menuAberto, definirMenuAberto] = useState(false)
  const tema = useGravar<Pick<HouseholdSettings, 'themeMode' | 'densityMode' | 'colorTokens'>>('/api/settings/theme')
  const preferencias = financeiro.data?.settings
  const caminho = useLocation().pathname
  const pagina = grupos.flatMap(grupo => grupo.paginas).find(([rota]) => rota === caminho)?.[1] ?? 'Planilha'
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const aplicar = () => {
      const modo = preferencias?.themeMode ?? 'dark'
      document.documentElement.dataset.density = preferencias?.densityMode ?? 'comfortable'
      if (modo === 'custom' && preferencias?.colorTokens) {
        document.documentElement.dataset.theme = 'custom'
        document.documentElement.classList.remove('dark', 'light')
        document.documentElement.style.setProperty('--ff-custom-bg', preferencias.colorTokens.background)
        document.documentElement.style.setProperty('--ff-custom-surface', preferencias.colorTokens.card)
        document.documentElement.style.setProperty('--ff-custom-text', preferencias.colorTokens.neutral)
        document.documentElement.style.setProperty('--ff-custom-positive', preferencias.colorTokens.positive)
        document.documentElement.style.setProperty('--ff-custom-negative', preferencias.colorTokens.negative)
        document.documentElement.style.setProperty('--ff-custom-accent', preferencias.colorTokens.accent || preferencias.colorTokens.primary)
      } else {
        const escuro = modo === 'dark' || (modo === 'system' ? true : media.matches)
        document.documentElement.classList.toggle('dark', escuro)
        document.documentElement.classList.toggle('light', !escuro)
        document.documentElement.dataset.theme = escuro ? 'dark' : 'light'
        document.documentElement.style.removeProperty('--ff-custom-bg')
        document.documentElement.style.removeProperty('--ff-custom-surface')
        document.documentElement.style.removeProperty('--ff-custom-text')
        document.documentElement.style.removeProperty('--ff-custom-positive')
        document.documentElement.style.removeProperty('--ff-custom-negative')
        document.documentElement.style.setProperty('--ff-custom-accent', preferencias?.colorTokens?.primary ?? '')
      }
    }
    aplicar(); media.addEventListener('change', aplicar)
    return () => media.removeEventListener('change', aplicar)
  }, [preferencias])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return
    const lancamentos = financeiro.data?.entries
    const diasAviso = preferencias?.notificationDays
    if (!lancamentos?.length || !diasAviso?.length) return

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const hojeIso = hoje.toISOString().slice(0, 10)
    const chaveArmazenamento = `ff-notif-${hojeIso}`
    if (sessionStorage.getItem(chaveArmazenamento)) return

    const pendentes = lancamentos.filter(l => l.status === 'pending')
    const proximos = pendentes.filter(l => {
      const dataVenc = new Date(l.dueDate + 'T00:00:00')
      const diffDias = Math.round((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      return diasAviso.includes(diffDias)
    })

    if (proximos.length > 0) {
      try {
        new Notification('Planilha: Vencimentos Próximos', {
          body: proximos.length === 1
            ? `O lançamento "${proximos[0].title}" vence em breve.`
            : `Você tem ${proximos.length} lançamentos com vencimento próximo.`
        })
        sessionStorage.setItem(chaveArmazenamento, 'true')
      } catch { }
    }
  }, [financeiro.data?.entries, preferencias?.notificationDays])
  if (carregando) return <Carregando />
  if (!sessao) return <Navigate to="/login" replace />
  return <div className="ff-app"><a href="#conteudo" className="ff-skip">Pular para o conteúdo</a>
    <aside className="ff-sidebar"><NavLink className="ff-brand" to="/"><span aria-hidden="true">p.</span><span>Planilha</span></NavLink>
      <Navegacao /><div className="ff-sidebar__foot"><span className="ff-tag">Ambiente local</span><p>Seu dinheiro merece atenção.</p></div></aside>
    <div className="ff-workspace"><header className="ff-topbar"><div className="ff-mobile-menu"><Button variant="outline" aria-label="Abrir navegação" onPress={() => definirMenuAberto(true)}>☰</Button>
      <Modal.Backdrop isOpen={menuAberto} onOpenChange={definirMenuAberto}><Modal.Container placement="top"><Modal.Dialog><Modal.CloseTrigger aria-label="Fechar navegação" />
        <Modal.Header><Modal.Heading>Planilha</Modal.Heading></Modal.Header><Modal.Body><Navegacao fechar={() => definirMenuAberto(false)} /></Modal.Body>
      </Modal.Dialog></Modal.Container></Modal.Backdrop></div>
      <div className="ff-topbar__family"><span className="ff-eyebrow">SUA FAMÍLIA</span><strong>{sessao.family.name}</strong></div>
      <div className="ff-topbar__actions"><Button variant="ghost" size="sm" aria-label="Alternar tema" isDisabled={!preferencias}
        isPending={tema.isPending} onPress={() => { if (preferencias) tema.mutate({ themeMode: document.documentElement.classList.contains('dark') ? 'light' : 'dark',
          densityMode: preferencias.densityMode, colorTokens: preferencias.colorTokens }) }}>◐</Button>
        <span className="ff-user">{sessao.user.name}</span><Button variant="outline" size="sm" onPress={() => { void sair().catch(definirErro) }}>Sair</Button></div>
    </header><main id="conteudo" className="ff-main" tabIndex={-1}><div className="ff-breadcrumb">Sua organização <span aria-hidden="true">/</span> {pagina}</div>
      {erro != null && <Falha erro={erro} />}{tema.isError && <Falha erro={tema.error} />}
      {financeiro.isError ? <Falha erro={financeiro.error} repetir={() => { void financeiro.refetch() }} /> : financeiro.isPending ? <Carregando /> : <Outlet />}
    </main><footer className="ff-footer">Planilha <span>Um mês de cada vez.</span></footer></div>
  </div>
}

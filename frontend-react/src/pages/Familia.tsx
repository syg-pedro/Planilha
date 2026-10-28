import { useState } from 'react'
import { Button } from '@heroui/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Campo, Carregando, Escolha, Falha, Janela, Painel } from '../components/Controles'
import { Tabela } from '../components/Tabela'
import { useSessao } from '../hooks/useSessao'
import { api } from '../services/api'
import { dataCurta } from '../services/formatacao'
import { podeRemoverMembro, textosFamilia as pt } from '../features/preferencias/familia'
import type { Convite, Familia as FamiliaRegistro, Membro } from '../features/preferencias/familia'

function Conteudo() {
  const { sessao, selecionarFamilia } = useSessao()
  const cache = useQueryClient()
  const responsavel = sessao?.family.role === 'owner'
  const familias = useQuery({ queryKey: ['lab', sessao?.family.id, 'families'], queryFn: () => api<{ families: FamiliaRegistro[] }>('/api/families') })
  const membros = useQuery({ queryKey: ['lab', sessao?.family.id, 'members'], queryFn: () => api<{ members: Membro[] }>('/api/families/members') })
  const convites = useQuery({ queryKey: ['lab', sessao?.family.id, 'invitations'], queryFn: () => api<{ invitations: Convite[] }>('/api/families/invitations'), enabled: responsavel })
  const [email, definirEmail] = useState('')
  const [papel, definirPapel] = useState('member')
  const [codigo, definirCodigo] = useState('')
  const [novoConvite, definirNovoConvite] = useState<{ token: string; expiresAt: string } | null>(null)
  const [pendente, definirPendente] = useState(false)
  const [erro, definirErro] = useState<unknown>(null)
  const [mensagem, definirMensagem] = useState('')
  const [exclusao, definirExclusao] = useState<{ caminho: string; titulo: string; descricao: string } | null>(null)
  const executar = async (acao: () => Promise<void>) => {
    definirPendente(true); definirErro(null); definirMensagem('')
    try { await acao() } catch (falha) { definirErro(falha) } finally { definirPendente(false) }
  }
  const atualizar = async () => { await cache.invalidateQueries({ queryKey: ['lab'] }) }
  const convidar = (evento: React.FormEvent) => {
    evento.preventDefault()
    void executar(async () => {
      definirNovoConvite(null)
      const resposta = await api<{ token: string; expiresAt: string }>('/api/families/invitations', { method: 'POST', body: { email: email.trim(), role: papel } })
      definirNovoConvite(resposta); definirEmail(''); await atualizar()
    })
  }
  const aceitar = (evento: React.FormEvent) => {
    evento.preventDefault()
    void executar(async () => {
      const resposta = await api<{ family: FamiliaRegistro }>('/api/families/invitations/accept', { method: 'POST', body: { token: codigo.trim() } })
      definirCodigo(''); await selecionarFamilia(resposta.family.id)
    })
  }
  return <div className="ff-form">
    <Painel titulo="Família atual" detalhe={pt.acesso}><Escolha titulo="Selecionar família" valor={sessao?.family.id ?? ''}
      opcoes={(familias.data?.families ?? []).map(familia => ({ value: familia.id, label: `${familia.name} · ${familia.role === 'owner' ? 'Responsável' : 'Membro'}` }))}
      disabled={pendente || familias.isPending} alterar={id => { if (id !== sessao?.family.id) void executar(() => selecionarFamilia(id)) }} />
      {familias.isError && <Falha erro={familias.error} repetir={() => void familias.refetch()} />}</Painel>
    <Painel titulo={pt.membros}>{membros.isPending ? <Carregando /> : membros.isError ? <Falha erro={membros.error} repetir={() => void membros.refetch()} /> :
      <Tabela titulo={pt.membros} registros={membros.data.members.map(membro => ({ ...membro, id: membro.userId }))} colunas={[
        { id: 'nome', titulo: 'Nome', conteudo: membro => membro.name }, { id: 'email', titulo: 'E-mail', conteudo: membro => membro.email },
        { id: 'papel', titulo: 'Acesso', conteudo: membro => membro.role === 'owner' ? 'Responsável' : 'Membro' },
        { id: 'acoes', titulo: 'Ações', conteudo: membro => responsavel && podeRemoverMembro(membro, membros.data.members, sessao!.user.id) ?
          <Button size="sm" variant="danger" isDisabled={pendente} onPress={() => definirExclusao({ caminho: `/api/families/members/${encodeURIComponent(membro.userId)}`, titulo: 'Remover pessoa', descricao: `${membro.name} perderá o acesso aos dados desta família.` })}>Remover</Button> : '—' }
      ]} />}</Painel>
    {responsavel && <Painel titulo={pt.convites} detalhe={pt.semEmail}><div className="ff-form">
      <form className="ff-form" onSubmit={convidar}><div className="ff-form-row"><Campo titulo="E-mail da pessoa convidada" type="email" maxLength={254} required value={email} onChange={evento => definirEmail(evento.target.value)} disabled={pendente} />
        <Escolha titulo="Acesso" valor={papel} alterar={definirPapel} disabled={pendente} opcoes={[{ value: 'member', label: 'Membro' }, { value: 'owner', label: 'Responsável' }]} /></div>
        <div className="ff-actions"><Button type="submit" isPending={pendente}>Criar convite</Button></div></form>
      {novoConvite && <div className="ff-form" role="status"><p>{pt.token}</p><Campo titulo="Código do convite" value={novoConvite.token} readOnly />
        <p className="ff-muted">Válido até {dataCurta(novoConvite.expiresAt)}.</p><div className="ff-actions"><Button variant="outline" onPress={() => void executar(async () => {
          try { await navigator.clipboard.writeText(novoConvite.token); definirMensagem('Código copiado.') }
          catch { definirMensagem('Não foi possível copiar. Selecione o código acima e copie manualmente.') }
        })}>Copiar código</Button><Button variant="tertiary" onPress={() => definirNovoConvite(null)}>Ocultar código</Button></div></div>}
      {convites.isPending ? <Carregando /> : convites.isError ? <Falha erro={convites.error} repetir={() => void convites.refetch()} /> :
        <Tabela titulo="Convites pendentes" registros={convites.data?.invitations ?? []} colunas={[
          { id: 'email', titulo: 'E-mail', conteudo: convite => convite.email }, { id: 'validade', titulo: 'Validade', conteudo: convite => dataCurta(convite.expiresAt) },
          { id: 'acoes', titulo: 'Ações', conteudo: convite => <Button size="sm" variant="danger" isDisabled={pendente} onPress={() => definirExclusao({ caminho: `/api/families/invitations/${encodeURIComponent(convite.id)}`, titulo: 'Revogar convite', descricao: `O código enviado para ${convite.email} deixará de funcionar.` })}>Revogar</Button> }
        ]} />}
    </div></Painel>}
    <Painel titulo="Entrar em outra família" detalhe={pt.entrada}><form className="ff-form" onSubmit={aceitar}>
      <Campo titulo="Código recebido" autoComplete="off" maxLength={200} required value={codigo} onChange={evento => definirCodigo(evento.target.value)} disabled={pendente} />
      <div className="ff-actions"><Button type="submit" isPending={pendente}>Aceitar convite</Button></div>
    </form></Painel>
    {erro != null && <Falha erro={erro} />}{mensagem && <p role="status">{mensagem}</p>}
    <Janela titulo={exclusao?.titulo ?? ''} aberta={exclusao != null} fechar={() => { if (!pendente) definirExclusao(null) }}>
      <p>{exclusao?.descricao}</p><div className="ff-actions ff-actions--end"><Button variant="tertiary" isDisabled={pendente} onPress={() => definirExclusao(null)}>Cancelar</Button>
        <Button variant="danger" isPending={pendente} onPress={() => void executar(async () => { if (!exclusao) return
          await api(exclusao.caminho, { method: 'DELETE' }); definirNovoConvite(null); definirExclusao(null); await atualizar()
        })}>Confirmar</Button></div>
    </Janela>
  </div>
}

export default function Familia() {
  const { sessao } = useSessao()
  return <><h1 className="ff-page-title">{pt.titulo}</h1><Conteudo key={sessao?.family.id} /></>
}

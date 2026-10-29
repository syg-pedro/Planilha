import { useState } from 'react'
import { Button } from '@heroui/react'
import { Alerta, Campo, Carregando, Escolha, Falha, Marcacao, Painel } from '../components/Controles'
import { useFinanceiro, useGravar } from '../hooks/useFinanceiro'
import { useSessao } from '../hooks/useSessao'
import { useNotificacoes } from '../hooks/useNotificacoes'
import { esquemaPreferencias, gravarPreferencias, lerPreferencias, textosPreferencias as pt } from '../features/preferencias/modelo'
import type { HouseholdSettings } from '../types'
import type { Preferencias } from '../features/preferencias/modelo'

function Formulario({ settings, responsavel }: { settings: HouseholdSettings; responsavel: boolean }) {
  const [valores, definirValores] = useState(() => lerPreferencias(settings))
  const [erros, definirErros] = useState<Record<string, string>>({})
  const [salvo, definirSalvo] = useState(false)
  const gravar = useGravar<ReturnType<typeof gravarPreferencias>>('/api/settings', 'PUT')
  const avisos = useNotificacoes()
  const alterar = <K extends keyof Preferencias>(campo: K, valor: Preferencias[K]) => {
    definirValores(atual => ({ ...atual, [campo]: valor })); definirSalvo(false)
  }
  const salvar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    const resultado = esquemaPreferencias.safeParse(valores)
    if (!resultado.success) {
      definirErros(Object.fromEntries(resultado.error.issues.map(erro => [String(erro.path[0]), erro.message])))
      return
    }
    definirErros({})
    try { await gravar.mutateAsync(gravarPreferencias(settings, resultado.data)); definirSalvo(true) } catch { }
  }
  const bloqueado = !responsavel || gravar.isPending
  return <form className="ff-form" onSubmit={salvar}>
    {!responsavel && <p className="ff-muted">{pt.somenteLeitura}</p>}
    <Painel titulo="Aparência e período" detalhe={`${settings.currency} · ${settings.timezone}`}>
      <div className="ff-form"><div className="ff-form-row">
        <Escolha titulo="Tema" valor={valores.tema} alterar={valor => alterar('tema', valor as Preferencias['tema'])} disabled={bloqueado}
          opcoes={[{ value: 'system', label: 'Sistema' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }, { value: 'custom', label: 'Personalizado' }]} />
        <Escolha titulo="Densidade" valor={valores.densidade} alterar={valor => alterar('densidade', valor as Preferencias['densidade'])} disabled={bloqueado}
          opcoes={[{ value: 'compact', label: 'Compacta' }, { value: 'comfortable', label: 'Confortável' }]} />
      </div><div className="ff-form-row">
        <Escolha titulo="Período financeiro" valor={valores.periodo} alterar={valor => alterar('periodo', valor as Preferencias['periodo'])} disabled={bloqueado}
          opcoes={[{ value: 'due_date', label: 'Vencimento' }, { value: 'competence', label: 'Competência' }]} />
        <Campo titulo="Horizonte em meses" type="number" min={1} max={120} placeholder="12" value={valores.horizonte} onChange={evento => alterar('horizonte', evento.target.value)} erro={erros.horizonte} disabled={bloqueado} />
      </div>{valores.tema === 'custom' && <div className="ff-form-row">{pt.cores.map(cor =>
        <Campo key={cor.value} titulo={cor.label} value={valores.cores[cor.value]} maxLength={7} placeholder="#00f59b" disabled={bloqueado}
          onChange={evento => alterar('cores', { ...valores.cores, [cor.value]: evento.target.value })} />)}</div>}
      {erros.cores && <p role="alert" className="ff-error">{erros.cores}</p>}</div>
    </Painel>
    <Painel titulo="Painel inicial"><div className="ff-form">
      <div className="ff-form-row"><Escolha titulo="Ordenação" valor={valores.ordem} alterar={valor => alterar('ordem', valor as Preferencias['ordem'])} disabled={bloqueado}
        opcoes={[{ value: 'date_asc', label: 'Data crescente' }, { value: 'date_desc', label: 'Data decrescente' }, { value: 'amount_desc', label: 'Maior valor' }]} />
      <Escolha titulo="Intervalo inicial" valor={valores.intervalo} alterar={valor => alterar('intervalo', valor as Preferencias['intervalo'])} disabled={bloqueado}
        opcoes={[{ value: 'month', label: 'Mês' }, { value: 'quarter', label: 'Trimestre' }, { value: 'year', label: 'Ano' }]} /></div>
      <fieldset disabled={bloqueado} className="ff-form-row"><legend>Elementos visíveis</legend>{pt.widgets.map(widget =>
        <Marcacao key={widget.value} titulo={widget.label} marcado={valores.widgets.includes(widget.value)}
          alterar={marcado => alterar('widgets', marcado ? [...valores.widgets, widget.value] : valores.widgets.filter(id => id !== widget.value))} />)}</fieldset>
    </div></Painel>
    <Painel titulo="Avisos no navegador" detalhe={pt.notificacoes}><div className="ff-form">
      <div className="ff-form-row"><Campo titulo="Dias de antecedência (separados por vírgula)" placeholder="Ex: 1, 3, 7" value={valores.dias} disabled={bloqueado}
        onChange={evento => alterar('dias', evento.target.value)} erro={erros.dias} />
      <Campo titulo="Horário" type="time" value={valores.horario} disabled={bloqueado} onChange={evento => alterar('horario', evento.target.value)} erro={erros.horario} /></div>
      <p className="ff-muted">{!avisos.suportado ? 'Este navegador não oferece notificações neste contexto.' : avisos.permissao === 'granted' ? 'Permissão concedida neste navegador.' : avisos.permissao === 'denied' ? 'Permissão bloqueada. Altere nas configurações do navegador.' : 'A permissão ainda não foi solicitada.'}</p>
      {avisos.suportado && <div className="ff-actions"><Button type="button" variant="outline" isDisabled={avisos.permissao !== 'default'} isPending={avisos.pendente} onPress={() => void avisos.solicitar()}>Permitir notificações</Button>
        <Button type="button" variant="tertiary" isDisabled={avisos.permissao !== 'granted'} onPress={avisos.testar}>Testar aviso</Button></div>}
      {avisos.falha && <Alerta tipo="erro">Não foi possível exibir o aviso neste navegador.</Alerta>}
    </div></Painel>
    {gravar.isError && <Falha erro={gravar.error} />}
    {salvo && <Alerta tipo="sucesso">{pt.salvo}</Alerta>}
    <div className="ff-actions ff-actions--end"><Button type="submit" isDisabled={!responsavel} isPending={gravar.isPending}>{pt.salvar}</Button></div>
  </form>
}

export default function Configuracoes() {
  const dados = useFinanceiro()
  const { sessao } = useSessao()
  return <><h1 className="ff-page-title">{pt.titulo}</h1><p className="ff-muted">{pt.detalhe}</p>
    {dados.isPending ? <Carregando /> : dados.isError ? <Falha erro={dados.error} repetir={() => void dados.refetch()} /> :
      <Formulario key={sessao?.family.id} settings={dados.data.settings} responsavel={sessao?.family.role === 'owner'} />}</>
}

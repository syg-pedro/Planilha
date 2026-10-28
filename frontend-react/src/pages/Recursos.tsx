import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@heroui/react'
import { Campo, Carregando, Confirmar, Escolha, Falha, Janela, Painel, Vazio } from '../components/Controles'
import { Tabela } from '../components/Tabela'
import { useFinanceiro, useGravar } from '../hooks/useFinanceiro'
import { useSessao } from '../hooks/useSessao'
import { api } from '../services/api'
import { dinheiro } from '../services/formatacao'
import type { WishItem } from '../types'
import { FormularioRecurso } from '../features/recursos/FormularioRecurso'
import { corpoFormulario, nomeRegistro } from '../features/recursos/modelo'
import type { Recurso, Registro } from '../features/recursos/modelo'
import { frequencias, prioridades, rotulos, situacoesDesejo, textos, tiposConta } from '../features/recursos/textos'

const rotulo = (opcoes: { value: string; label: string }[], valor: string) => opcoes.find(opcao => opcao.value === valor)?.label ?? valor
const pesquisar = (valor: string) => valor.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR')

function GerarRecorrencias({ horizonte, concluir, fechar, pendencia }: {
  horizonte: number; concluir: (quantidade: number) => void; fechar: () => void; pendencia: (valor: boolean) => void
}) {
  const esquema = z.object({ meses: z.string().regex(/^\d+$/, 'Informe um número inteiro.').refine(valor => Number(valor) >= 1 && Number(valor) <= 120, 'Use entre 1 e 120 meses.') })
  const { register, handleSubmit, formState: { errors } } = useForm<{ meses: string }>({ resolver: zodResolver(esquema), defaultValues: { meses: String(horizonte) } })
  const gravar = useGravar<{ months: number }>('/api/rules/rebuild')
  return <form className="ff-form" noValidate onSubmit={handleSubmit(async valores => {
    pendencia(true)
    try {
      const resposta = await gravar.mutateAsync({ months: Number(valores.meses) }) as { generated: number }
      concluir(resposta.generated)
    } catch { return }
    finally { pendencia(false) }
  })}><p>{rotulos.gerarDescricao}</p>
    <Campo titulo={rotulos.horizonte} type="number" min={1} max={120} {...register('meses')} erro={errors.meses?.message} />
    {gravar.isError && <Falha erro={gravar.error} />}
    <div className="ff-actions ff-actions--end"><Button variant="tertiary" onPress={fechar} isDisabled={gravar.isPending}>{rotulos.cancelar}</Button>
      <Button type="submit" isPending={gravar.isPending}>{rotulos.gerar}</Button></div>
  </form>
}

function ConteudoRecursos({ recurso }: { recurso: Recurso }) {
  const { sessao } = useSessao()
  const financeiro = useFinanceiro()
  const desejos = useQuery({ queryKey: ['lab', sessao?.family.id, 'wishlist'],
    queryFn: () => api<{ items: WishItem[] }>('/api/wishlist'), enabled: recurso === 'wishlist' && !!sessao })
  const [busca, definirBusca] = useState('')
  const [prioridade, definirPrioridade] = useState('all')
  const [situacao, definirSituacao] = useState('all')
  const [edicao, definirEdicao] = useState<Registro | null | undefined>(undefined)
  const [exclusao, definirExclusao] = useState<Registro | null>(null)
  const [geracao, definirGeracao] = useState(false)
  const [gerando, definirGerando] = useState(false)
  const [sucesso, definirSucesso] = useState('')
  const caminho = `/api/${recurso}`
  const salvar = useGravar<ReturnType<typeof corpoFormulario>>(`${caminho}${edicao ? `/${encodeURIComponent(edicao.id)}` : ''}`, edicao ? 'PUT' : 'POST')
  const excluir = useGravar<undefined>(`${caminho}/${encodeURIComponent(exclusao?.id ?? '')}`, 'DELETE')
  const dados = financeiro.data
  const texto = textos[recurso]
  const carregando = financeiro.isLoading || recurso === 'wishlist' && desejos.isLoading
  const falha = financeiro.error ?? (recurso === 'wishlist' ? desejos.error : null)
  const registros: Registro[] = recurso === 'wishlist' ? desejos.data?.items ?? [] : dados?.[recurso] ?? []
  const filtrados = registros.filter(registro => {
    const complemento = 'owner' in registro ? registro.owner : 'description' in registro ? registro.description
      : 'price' in registro ? `${registro.category ?? ''} ${registro.notes ?? ''}` : ''
    if (!pesquisar(`${nomeRegistro(registro)} ${complemento}`).includes(pesquisar(busca))) return false
    return !('price' in registro) || ((prioridade === 'all' || registro.priority === prioridade) && (situacao === 'all' || registro.status === situacao))
  })
  const resumo = (registro: Registro) => {
    if ('type' in registro) return rotulo(tiposConta, registro.type)
    if ('frequency' in registro) return `${registro.kind === 'income' ? 'Receita' : 'Despesa'} · ${rotulo(frequencias, registro.frequency)}`
    if ('price' in registro) return `${rotulo(prioridades, registro.priority)} prioridade`
    return registro.kind === 'income' ? 'Receita' : 'Despesa'
  }
  const valor = (registro: Registro) => {
    if ('limitTotal' in registro) return registro.type === 'credit_card' && registro.limitTotal !== null ? dinheiro(registro.limitTotal) : '—'
    if ('amount' in registro) return dinheiro(registro.amount)
    if ('price' in registro) return registro.price === null ? rotulos.aDefinir : dinheiro(registro.price)
    return <span className="ff-status"><span style={{ color: registro.color }} aria-hidden="true">●</span>{registro.color}</span>
  }
  const estado = (registro: Registro) => {
    if ('active' in registro) return registro.active ? 'Ativa' : 'Inativa'
    if ('autoGenerate' in registro) return registro.autoGenerate && registro.frequency === 'monthly' && registro.dueDay ? `Mensal · dia ${registro.dueDay}` : 'Sem geração automática'
    if ('price' in registro) return rotulo(situacoesDesejo, registro.status)
    return 'Disponível'
  }
  const impacto = recurso === 'accounts'
    ? 'Os lançamentos e as regras serão preservados sem esta conta. Excluir um benefício pode alterar sua participação nos totais.'
    : recurso === 'categories' ? 'Os lançamentos e as regras serão preservados sem esta categoria.'
      : recurso === 'rules' ? 'Lançamentos automáticos não pagos do mês atual em diante serão removidos. Pagos, antigos e manuais serão preservados.'
        : 'O desejo será removido da lista.'
  return <>
    <header className="ff-page-title"><div><h1>{texto.titulo}</h1><p>{texto.descricao}</p></div>
      <div className="ff-actions">{recurso === 'rules' && <Button variant="outline" onPress={() => definirGeracao(true)} isDisabled={!dados}>{rotulos.gerar}</Button>}
        <Button onPress={() => { salvar.reset(); definirSucesso(''); definirEdicao(null) }} isDisabled={!dados || excluir.isPending}>{texto.adicionar}</Button></div>
    </header>
    {sucesso && <p role="status" className="ff-positive">{sucesso}</p>}
    {excluir.isError && <Falha erro={excluir.error} />}
    {carregando ? <Carregando /> : falha ? <Falha erro={falha} repetir={() => { void financeiro.refetch(); if (recurso === 'wishlist') void desejos.refetch() }} /> : <Painel>
      <div className="ff-filters"><Campo titulo={rotulos.buscar} type="search" value={busca} onChange={evento => definirBusca(evento.target.value)} />
        {recurso === 'wishlist' && <>
          <Escolha titulo={rotulos.prioridade} valor={prioridade} alterar={definirPrioridade} opcoes={[{ value: 'all', label: 'Todas as prioridades' }, ...prioridades]} />
          <Escolha titulo={rotulos.situacao} valor={situacao} alterar={definirSituacao} opcoes={[{ value: 'all', label: 'Todas as situações' }, ...situacoesDesejo]} />
        </>}
      </div>
      <p className="ff-muted">{filtrados.length} de {registros.length} registros</p>
      {!filtrados.length ? <Vazio titulo={registros.length ? rotulos.semResultado : texto.titulo}>{registros.length ? rotulos.ajustarFiltros : texto.vazio}</Vazio>
        : <Tabela titulo={texto.titulo} registros={filtrados} colunas={[
          { id: 'nome', titulo: rotulos.nome, conteudo: registro => <div><strong>{nomeRegistro(registro)}</strong>
            {'owner' in registro && registro.owner && <p className="ff-muted">{registro.owner}</p>}
            {'price' in registro && registro.url && <p><a href={registro.url} target="_blank" rel="noopener noreferrer">Ver produto ↗</a></p>}</div> },
          { id: 'tipo', titulo: recurso === 'wishlist' ? rotulos.prioridade : 'Tipo', conteudo: resumo },
          { id: 'valor', titulo: recurso === 'categories' ? 'Cor' : recurso === 'accounts' ? 'Limite' : 'Valor', conteudo: registro => <span className="ff-number">{valor(registro)}</span> },
          { id: 'estado', titulo: rotulos.situacao, conteudo: registro => <span className="ff-status">{estado(registro)}</span> },
          { id: 'acoes', titulo: 'Ações', conteudo: registro => <div className="ff-actions"><Button size="sm" variant="ghost" aria-label={`Editar ${nomeRegistro(registro)}`}
            isDisabled={excluir.isPending} onPress={() => { salvar.reset(); definirEdicao(registro) }}>{rotulos.editar}</Button>
            <Button size="sm" variant="ghost" aria-label={`Excluir ${nomeRegistro(registro)}`} isDisabled={excluir.isPending}
              onPress={() => { excluir.reset(); definirExclusao(registro) }}>{rotulos.excluir}</Button></div> }
        ]} />}
    </Painel>}
    <Janela titulo={`${edicao ? 'Editar' : 'Adicionar'} ${texto.singular}`} aberta={edicao !== undefined} fechar={() => { if (!salvar.isPending) definirEdicao(undefined) }}>
      {edicao !== undefined && dados && <FormularioRecurso key={edicao?.id ?? 'novo'} recurso={recurso} registro={edicao} dados={dados}
        fechar={() => definirEdicao(undefined)} salvar={async corpo => { await salvar.mutateAsync(corpo); definirEdicao(undefined); definirSucesso('Registro salvo.') }} />}
    </Janela>
    <Confirmar titulo={`Excluir ${texto.singular}`} descricao={`Excluir “${exclusao ? nomeRegistro(exclusao) : ''}”? ${impacto}`}
      aberta={exclusao !== null} pendente={excluir.isPending} fechar={() => { if (!excluir.isPending) definirExclusao(null) }}
      confirmar={() => { void excluir.mutateAsync(undefined).then(() => { definirExclusao(null); definirSucesso('Registro excluído.') }).catch(() => definirExclusao(null)) }} />
    <Janela titulo={rotulos.gerar} aberta={geracao} fechar={() => { if (!gerando) definirGeracao(false) }}>
      {geracao && dados && <GerarRecorrencias horizonte={dados.settings.horizonMonths} fechar={() => definirGeracao(false)}
        pendencia={definirGerando} concluir={quantidade => { definirGeracao(false); definirSucesso(`${rotulos.geracaoConcluida} ${quantidade} lançamentos no horizonte.`) }} />}
    </Janela>
  </>
}

export default function Recursos({ recurso }: { recurso: Recurso }) {
  const { sessao } = useSessao()
  return <ConteudoRecursos key={`${recurso}-${sessao?.family.id ?? ''}`} recurso={recurso} />
}

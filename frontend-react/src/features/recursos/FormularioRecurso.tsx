import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@heroui/react'
import { AreaTexto, Campo, Escolha, Falha, Marcacao } from '../../components/Controles'
import { FalhaApi } from '../../services/api'
import { TIPOS } from '../../services/formatacao'
import type { BootstrapResponse } from '../../types'
import { camposServidor, corpoFormulario, esquemaFormulario, valoresIniciais } from './modelo'
import type { Recurso, Registro, Valores } from './modelo'
import { frequencias, prioridades, rotulos, situacoesDesejo, tiposConta } from './textos'

type ChaveEscolha = 'tipo' | 'natureza' | 'frequencia' | 'contaId' | 'categoriaId' | 'prioridade' | 'situacao'

export function FormularioRecurso({ recurso, registro, dados, salvar, fechar }: {
  recurso: Recurso; registro: Registro | null; dados: BootstrapResponse
  salvar: (corpo: ReturnType<typeof corpoFormulario>) => Promise<void>; fechar: () => void
}) {
  const [erro, definirErro] = useState<unknown>(null)
  const { register, control, watch, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Valores>({
    resolver: zodResolver(esquemaFormulario(recurso)), defaultValues: valoresIniciais(registro, dados.settings.colorTokens.primary)
  })
  const placeholderNome = recurso === 'accounts' ? 'Ex: Cartão Neon, Conta Corrente...'
    : recurso === 'categories' ? 'Ex: Alimentação, Moradia, Lazer...'
    : recurso === 'rules' ? 'Ex: Assinatura Streaming, Aluguel...'
    : 'Ex: Smartphone novo, Curso de Inglês...'

  const campo = (nome: keyof Valores, titulo: string, tipo = 'text', extras?: Record<string, unknown>) => <Campo titulo={titulo} type={tipo}
    {...register(nome)} erro={errors[nome]?.message} {...extras} />
  const escolha = (nome: ChaveEscolha, titulo: string, opcoes: { value: string; label: string }[]) => {
    const opcional = nome === 'contaId' || nome === 'categoriaId'
    return <Controller control={control} name={nome} render={({ field }) => <Escolha titulo={titulo}
      valor={opcional ? field.value || 'none' : field.value} alterar={valor => field.onChange(opcional && valor === 'none' ? '' : valor)}
      opcoes={opcoes} erro={errors[nome]?.message} disabled={isSubmitting} />} />
  }
  const textoLongo = (nome: 'descricao' | 'observacoes' | 'metadados', titulo: string, placeholder?: string) =>
    <AreaTexto titulo={titulo} rows={nome === 'metadados' ? 4 : 3} placeholder={placeholder} {...register(nome)} erro={errors[nome]?.message} />
  return <form className="ff-form" noValidate onSubmit={handleSubmit(async valores => {
    definirErro(null)
    try { await salvar(corpoFormulario(recurso, valores)) }
    catch (falha) {
      definirErro(falha)
      if (falha instanceof FalhaApi) Object.entries(falha.fields).forEach(([nome, mensagem]) => {
        const campo = camposServidor[nome]
        if (campo) setError(campo, { type: 'server', message: mensagem })
      })
    }
  })}>
    {campo('nome', rotulos.nome, 'text', { placeholder: placeholderNome })}
    {recurso === 'accounts' && <>
      <div className="ff-form-row">{escolha('tipo', rotulos.tipo, tiposConta)}{campo('responsavel', rotulos.responsavel, 'text', { placeholder: 'Ex: Pedro, Maria, Conjunta...' })}</div>
      {watch('tipo') === 'credit_card' && <>
        <Campo titulo={rotulos.limite} inputMode="decimal" placeholder="0,00" step="0.01" {...register('valor')} erro={errors.valor?.message} />
        <div className="ff-form-row">{campo('diaFechamento', rotulos.fechamento, 'number', { min: 1, max: 31, placeholder: 'Ex: 5' })}{campo('diaVencimento', rotulos.vencimento, 'number', { min: 1, max: 31, placeholder: 'Ex: 10' })}</div>
      </>}
      <Controller control={control} name="ativo" render={({ field }) => <Marcacao titulo={rotulos.ativa} marcado={field.value} alterar={field.onChange} />} />
    </>}
    {recurso === 'categories' && <div className="ff-form-row">{escolha('natureza', rotulos.natureza, TIPOS)}{campo('cor', rotulos.cor, 'color')}</div>}
    {recurso === 'rules' && <>
      <div className="ff-form-row">{escolha('natureza', rotulos.natureza, TIPOS)}
        <Campo titulo={rotulos.valor} inputMode="decimal" placeholder="0,00" step="0.01" {...register('valor')} erro={errors.valor?.message} /></div>
      <div className="ff-form-row">{escolha('frequencia', rotulos.frequencia, frequencias)}{campo('diaVencimento', rotulos.vencimento, 'number', { min: 1, max: 31, placeholder: 'Ex: 10' })}</div>
      <Controller control={control} name="gerarAutomaticamente" render={({ field }) => <Marcacao titulo={rotulos.automatica} marcado={field.value} alterar={field.onChange} />} />
      {!watch('diaVencimento') && <p className="ff-muted">{rotulos.semDia}</p>}
      <div className="ff-form-row">
        {escolha('contaId', rotulos.conta, [{ value: 'none', label: rotulos.semConta }, ...dados.accounts.map(conta => ({ value: conta.id, label: conta.name }))])}
        {escolha('categoriaId', rotulos.categoria, [{ value: 'none', label: rotulos.semCategoria }, ...dados.categories.map(categoria => ({ value: categoria.id, label: categoria.name }))])}
      </div>
      {textoLongo('descricao', rotulos.descricao, 'Ex: Desconto automático em conta corrente todo dia 10')}
      <div className="ff-form-row">{campo('inicio', rotulos.inicio, 'date')}{campo('fim', rotulos.fim, 'date')}</div>
      <p className="ff-muted">{rotulos.datasInformativas}</p>
      {textoLongo('metadados', rotulos.metadados, 'Parâmetros ou observações extras...')}
    </>}
    {recurso === 'wishlist' && <>
      <Campo titulo={rotulos.valor} inputMode="decimal" placeholder="0,00" step="0.01" {...register('valor')} erro={errors.valor?.message} />
      <div className="ff-form-row">{escolha('prioridade', rotulos.prioridade, prioridades)}{escolha('situacao', rotulos.situacao, situacoesDesejo)}</div>
      {campo('categoriaTexto', rotulos.categoriaTexto, 'text', { placeholder: 'Ex: Eletrônicos, Viagem...' })}{campo('url', rotulos.url, 'url', { placeholder: 'https://exemplo.com/item' })}{campo('imagemUrl', rotulos.imagem, 'url', { placeholder: 'https://exemplo.com/foto.jpg' })}
      <p className="ff-muted">{rotulos.linksGuardados}</p>{textoLongo('observacoes', rotulos.observacoes, 'Detalhes, links adicionais ou especificações do item...')}
    </>}
    {erro != null && <Falha erro={erro} />}
    <div className="ff-actions ff-actions--end"><Button variant="tertiary" onPress={fechar} isDisabled={isSubmitting}>{rotulos.cancelar}</Button>
      <Button type="submit" isPending={isSubmitting}>{rotulos.salvar}</Button></div>
  </form>
}

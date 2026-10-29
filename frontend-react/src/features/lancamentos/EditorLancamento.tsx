import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@heroui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AreaTexto, Campo, Escolha, Falha, Marcacao } from '../../components/Controles'
import { useFinanceiro } from '../../hooks/useFinanceiro'
import { api } from '../../services/api'
import { hoje, SITUACOES, TIPOS } from '../../services/formatacao'
import type { FinanceEntry } from '../../types'

const schema = z.object({
  title: z.string().trim().min(1, 'Informe uma descrição.').max(100, 'Use até 100 caracteres.'),
  description: z.string(), amount: z.number().nonnegative('Use um valor igual ou maior que zero.').multipleOf(.01, 'Use até 2 casas decimais.'),
  kind: z.enum(['income', 'expense']), status: z.enum(['pending', 'paid', 'review']),
  dueDate: z.iso.date('Informe uma data válida.'), competenceDate: z.iso.date('Informe uma data válida.'),
  accountId: z.string(), categoryId: z.string(), excludeFromCalc: z.boolean(),
  months: z.number().int().min(1).max(120), installmentIndex: z.number().int().min(0), installmentTotal: z.number().int().min(0)
}).superRefine((dados, contexto) => {
  if ((dados.installmentTotal > 0 || dados.installmentIndex > 0)
    && (dados.installmentIndex < 1 || dados.installmentTotal < dados.installmentIndex)) {
    contexto.addIssue({ code: 'custom', path: ['installmentIndex'], message: 'Informe número e total de parcelas válidos.' })
  }
})
type Dados = z.infer<typeof schema>

export function EditorLancamento({ lancamento, rascunho, fechar }: { lancamento: FinanceEntry | null; rascunho?: Partial<FinanceEntry>; fechar: () => void }) {
  const financeiro = useFinanceiro()
  const cache = useQueryClient()
  const inicial = lancamento ?? rascunho
  const { register, control, handleSubmit, formState: { errors } } = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: {
    title: inicial?.title ?? '', description: inicial?.description ?? '', amount: inicial?.amount ?? 0,
    kind: inicial?.kind ?? 'expense', status: inicial?.status ?? 'pending', dueDate: inicial?.dueDate ?? hoje(),
    competenceDate: inicial?.competenceDate ?? hoje(), accountId: inicial?.accountId ?? '',
    categoryId: inicial?.categoryId ?? '', excludeFromCalc: inicial?.excludeFromCalc ?? false,
    months: 1, installmentIndex: inicial?.installmentIndex ?? 0, installmentTotal: inicial?.installmentTotal ?? 0
  } })
  const gravar = useMutation({ mutationFn: (dados: Dados) => {
    const { months, ...campos } = dados
    const corpo = { ...campos, accountId: campos.accountId || null, categoryId: campos.categoryId || null,
      installmentIndex: campos.installmentIndex || null, installmentTotal: campos.installmentTotal || null,
      ruleId: lancamento?.ruleId ?? null, origin: lancamento?.origin ?? 'manual', metadata: lancamento?.metadata ?? null }
    return lancamento ? api(`/api/entries/${lancamento.id}`, { method: 'PUT', body: corpo })
      : api('/api/entries/repeat', { method: 'POST', body: { entry: corpo, months } })
  }, onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['lab'] }); fechar() } })
  const referencias = (tipo: 'accounts' | 'categories', vazio: string) => [
    { value: 'none', label: vazio }, ...(financeiro.data?.[tipo] ?? []).map(item => ({ value: item.id, label: item.name }))
  ]
  return <form className="ff-form" noValidate onSubmit={handleSubmit(dados => gravar.mutate(dados))}>
    <Campo titulo="Descrição" {...register('title')} erro={errors.title?.message} autoFocus />
    <div className="ff-form-row"><Campo titulo="Valor (R$)" type="number" min="0" step="0.01" inputMode="decimal"
      {...register('amount', { valueAsNumber: true })} erro={errors.amount?.message} />
      <Campo titulo="Vencimento / recebimento" type="date" {...register('dueDate')} erro={errors.dueDate?.message} /></div>
    <div className="ff-form-row"><Controller control={control} name="kind" render={({ field }) => <Escolha titulo="Tipo" valor={field.value} alterar={field.onChange} opcoes={TIPOS} />} />
      <Controller control={control} name="status" render={({ field }) => <Escolha titulo="Situação" valor={field.value} alterar={field.onChange} opcoes={SITUACOES} />} /></div>
    <div className="ff-form-row"><Controller control={control} name="accountId" render={({ field }) => <Escolha titulo="Conta" valor={field.value || 'none'}
      alterar={valor => field.onChange(valor === 'none' ? '' : valor)} opcoes={referencias('accounts', 'Sem conta')} />} />
      <Controller control={control} name="categoryId" render={({ field }) => <Escolha titulo="Categoria" valor={field.value || 'none'}
        alterar={valor => field.onChange(valor === 'none' ? '' : valor)} opcoes={referencias('categories', 'Sem categoria')} />} /></div>
    <details className="ff-details"><summary>Competência, repetição e outros detalhes</summary><div className="ff-form">
      <div className="ff-form-row"><Campo titulo="Competência" type="date" {...register('competenceDate')} erro={errors.competenceDate?.message} />
        {!lancamento && <Campo titulo="Repetir por quantos meses?" type="number" min="1" max="120" {...register('months', { valueAsNumber: true })} erro={errors.months?.message} />}</div>
      {!lancamento && <p className="ff-muted">O valor informado se repete por mês. Os próximos lançamentos ficam pendentes.</p>}
      <div className="ff-form-row"><Campo titulo="Parcela nº (0 = sem parcela)" type="number" min="0" {...register('installmentIndex', { valueAsNumber: true })} erro={errors.installmentIndex?.message} />
        <Campo titulo="Total de parcelas (0 = sem parcela)" type="number" min="0" {...register('installmentTotal', { valueAsNumber: true })} erro={errors.installmentTotal?.message} /></div>
      <Controller control={control} name="excludeFromCalc" render={({ field }) => <Marcacao titulo="Excluir dos totais" marcado={field.value} alterar={field.onChange} />} />
      <AreaTexto titulo="Observações" rows={2} {...register('description')} />
    </div></details>{gravar.isError && <Falha erro={gravar.error} />}
    <div className="ff-actions ff-actions--end"><Button variant="tertiary" onPress={fechar} isDisabled={gravar.isPending}>Cancelar</Button>
      <Button type="submit" isPending={gravar.isPending}>Salvar lançamento</Button></div>
  </form>
}

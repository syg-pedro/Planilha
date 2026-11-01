<template>
  <BaseModal :open="true" :title="`${row.title} · ${sheetMonthLabel(month)}`" :subtitle="subtitle" :max-width="640" @close="emit('close')">
    <div class="cell-entries">
      <div v-if="entries.length" class="cell-entries__wrap">
        <table class="cell-entries__table">
          <thead>
            <tr>
              <th scope="col">Descrição</th>
              <th scope="col">Parcela</th>
              <th scope="col" class="num">Valor</th>
              <th scope="col">Pago</th>
              <th scope="col"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in entries" :key="entry.id" :class="{ 'is-paid': entry.status === 'paid' }">
              <td>
                <input class="cell-entries__input" :value="entry.title" :aria-label="`Descrição de ${entry.title}`" @change="rename(entry, $event)" @keydown.enter.prevent="blurTarget">
              </td>
              <td class="muted">{{ entry.installmentTotal ? `${entry.installmentIndex}/${entry.installmentTotal}` : '—' }}</td>
              <td>
                <input class="cell-entries__input num" inputmode="decimal" :value="raw(entry.amount)" :aria-label="`Valor de ${entry.title}`" @change="setAmount(entry, $event)" @keydown.enter.prevent="blurTarget">
              </td>
              <td>
                <input type="checkbox" class="cell-entries__check" :checked="entry.status === 'paid'" :aria-label="`${entry.title} pago`" @change="setPaid(entry, $event)">
              </td>
              <td><BaseButton size="sm" variant="ghost" :aria-label="`Excluir ${entry.title}`" @click="remove(entry)">Excluir</BaseButton></td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colspan="2">Total</td><td class="num">{{ fmt(total) }}</td><td colspan="2" /></tr>
          </tfoot>
        </table>
      </div>
      <p v-else class="muted">Nenhum lançamento neste mês.</p>

      <form class="cell-entries__new" novalidate @submit.prevent="add">
        <h3>{{ card ? 'Nova compra' : 'Novo lançamento' }} em {{ sheetMonthLabel(month) }}</h3>
        <BaseInput v-model="draft.title" label="Descrição" :placeholder="card ? 'Ex.: Tênis' : row.title" />
        <BaseInput v-model="draft.amount" :label="card ? 'Valor da parcela' : 'Valor'" placeholder="0,00" />
        <BaseInput v-if="card" v-model="draft.count" type="number" label="Parcelas" />
        <p v-if="formError" class="cell-entries__error" role="alert">{{ formError }}</p>
        <BaseButton type="submit">Adicionar</BaseButton>
      </form>
    </div>
    <template #footer>
      <BaseButton v-if="entries.length" variant="secondary" @click="payAll">{{ payLabel }}</BaseButton>
      <BaseButton variant="ghost" @click="emit('close')">Fechar</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { MatrixRow } from '#shared/matrix'
import { sumMoney } from '#shared/money'
import { newSheetEntry, nextInstallments, parseSheetInput, planInstallments } from '#shared/spreadsheet'
import type { EntryBatchRequest, FinanceEntry } from '#shared/types'
import { useFinanceStore } from '../../stores/useFinanceStore'
import { useCurrency } from '../../composables/useCurrency'
import type { SheetAction } from '../../composables/useSpreadsheetHistory'
import { isCardColumn, sheetMonthLabel } from '../../composables/useSpreadsheetModel'

const props = defineProps<{
  row: MatrixRow
  month: string
  save: (batch: EntryBatchRequest, label: string, actions?: SheetAction[]) => Promise<boolean>
}>()
const emit = defineEmits<{ close: [] }>()
const store = useFinanceStore()
const { format: fmt } = useCurrency()

const card = computed(() => isCardColumn(props.row))
const entries = computed(() => [...(props.row.cells[props.month]?.entries ?? [])].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')))
const total = computed(() => sumMoney(entries.value.map((entry) => entry.amount)))
const allPaid = computed(() => entries.value.length > 0 && entries.value.every((entry) => entry.status === 'paid'))
const dueDay = computed(() => (card.value ? props.row.account!.dueDay : null) ?? props.row.dueDays[0] ?? 1)
const subtitle = computed(() => {
  const paid = entries.value.filter((entry) => entry.status === 'paid').length
  const status = entries.value.length ? `${paid} de ${entries.value.length} pagos` : 'sem lançamentos'
  return `${card.value ? 'Fatura' : 'Total'} ${fmt(total.value)} · vence dia ${String(dueDay.value).padStart(2, '0')} · ${status}`
})
const payLabel = computed(() => allPaid.value ? 'Voltar para pendente' : card.value ? 'Marcar fatura como paga' : 'Marcar todos como pagos')

const raw = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })
const blurTarget = (event: KeyboardEvent) => (event.target as HTMLInputElement).blur()
const inputValue = (event: Event) => (event.target as HTMLInputElement)
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`
const upsert = (list: FinanceEntry[]): EntryBatchRequest => ({ upserts: list, deletes: [] })

/** Todas as parcelas da mesma compra recebem a nova descrição, para continuarem agrupadas. */
function rename(entry: FinanceEntry, event: Event) {
  const input = inputValue(event), title = input.value.trim()
  if (!title) {
    input.value = entry.title
    return
  }
  const siblings = entry.installmentTotal == null ? [entry] : store.entries.filter((item) =>
    item.kind === entry.kind && item.accountId === entry.accountId && item.title === entry.title && item.installmentTotal === entry.installmentTotal)
  void props.save(upsert(siblings.map((item) => ({ ...item, title }))), siblings.length > 1 ? `Descrição atualizada em ${siblings.length} parcelas` : 'Descrição atualizada')
}

function setAmount(entry: FinanceEntry, event: Event) {
  const input = inputValue(event), value = parseSheetInput(input.value)
  if (value === null || Number.isNaN(value) || value <= 0) {
    input.value = raw(entry.amount)
    formError.value = 'Informe um valor maior que zero, como 55,44.'
    return
  }
  formError.value = ''
  const next = nextInstallments(store.entries, entry, entry.amount)
  const actions: SheetAction[] = next.length ? [{
    label: `Aplicar também às próximas ${plural(next.length, 'parcela', 'parcelas')}`,
    run: () => void props.save(upsert(next.map((item) => ({ ...item, amount: value }))), `${plural(next.length, 'parcela atualizada', 'parcelas atualizadas')}`),
  }] : []
  void props.save(upsert([{ ...entry, amount: value }]), `Valor de ${entry.title} atualizado`, actions)
}

function setPaid(entry: FinanceEntry, event: Event) {
  const paid = inputValue(event).checked
  void props.save(upsert([{ ...entry, status: paid ? 'paid' : 'pending' }]), paid ? `${entry.title} marcado como pago` : `${entry.title} voltou para pendente`)
}

function remove(entry: FinanceEntry) {
  const next = nextInstallments(store.entries, entry)
  const actions: SheetAction[] = next.length ? [{
    label: `Remover também as próximas ${plural(next.length, 'parcela', 'parcelas')}`,
    run: () => void props.save({ upserts: [], deletes: next.map((item) => item.id) }, `${plural(next.length, 'parcela removida', 'parcelas removidas')}`),
  }] : []
  void props.save({ upserts: [], deletes: [entry.id] }, `${entry.title} removido`, actions)
}

function payAll() {
  const status = allPaid.value ? 'pending' : 'paid'
  void props.save(upsert(entries.value.map((entry) => ({ ...entry, status }))), status === 'paid' ? 'Marcado como pago' : 'Voltou para pendente')
}

const draft = reactive<{ title: string; amount: string | number | null; count: string | number | null }>({ title: '', amount: '', count: 1 })
const formError = ref('')
async function add() {
  const amount = parseSheetInput(String(draft.amount ?? ''))
  const count = Number(draft.count)
  if (amount === null || Number.isNaN(amount) || amount <= 0) {
    formError.value = card.value ? 'Informe o valor da parcela, como 89,90.' : 'Informe o valor, como 89,90.'
    return
  }
  if (card.value && (!Number.isInteger(count) || count < 1 || count > 48)) {
    formError.value = 'O número de parcelas vai de 1 a 48.'
    return
  }
  formError.value = ''
  const title = draft.title.trim() || (card.value ? 'Compra' : props.row.title)
  const base = {
    householdId: store.settings.id, title, accountId: props.row.account?.id ?? null,
    categoryId: props.row.entries[0]?.categoryId ?? null, amount, kind: props.row.kind,
  }
  const now = new Date().toISOString()
  const created = card.value
    ? planInstallments(base, props.month, dueDay.value, count, () => crypto.randomUUID(), now)
    : [newSheetEntry(base, props.month, dueDay.value, crypto.randomUUID(), now)]
  const saved = await props.save(upsert(created), created.length > 1 ? `${title} adicionado em ${created.length} parcelas` : `${title} adicionado`)
  if (saved) Object.assign(draft, { title: '', amount: '', count: 1 })
}
</script>

<style scoped>
.cell-entries { display: grid; gap: var(--ds-space-6); }
.cell-entries__wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); }
.cell-entries__table { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
.cell-entries__table th { text-align: left; font-size: 11px; font-weight: 600; color: var(--text3); background: var(--bg2); padding: 6px 8px; border-bottom: 1px solid var(--border); }
.cell-entries__table td { padding: 4px 6px; border-bottom: 1px solid var(--border); }
.cell-entries__table tfoot td { font-weight: 700; border-bottom: 0; padding: 8px; }
.cell-entries__table .num { text-align: right; }
.cell-entries__input { width: 100%; min-width: 88px; height: var(--ds-control-height-sm); padding: 0 8px; font: inherit; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
.cell-entries__input:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.cell-entries__check { width: 16px; height: 16px; accent-color: var(--primary); }
.is-paid .cell-entries__input { color: var(--text3); }
.muted { color: var(--text3); margin: 0; }
.cell-entries__new { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--ds-space-3); align-items: end; padding: var(--ds-space-5); background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); }
.cell-entries__new h3 { grid-column: 1 / -1; margin: 0; font-size: 14px; color: var(--text); }
.cell-entries__error { grid-column: 1 / -1; margin: 0; color: var(--ds-text-danger); font-size: 12px; }
</style>

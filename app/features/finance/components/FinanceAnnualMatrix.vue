<template>
  <section
    ref="screenHost"
    class="planilha"
    :class="{ 'planilha--expanded': expanded }"
    aria-label="Área de trabalho da Planilha"
  >
    <PlanilhaToolbar
      v-model="query"
      :accounts="store.accounts"
      :today-month="todayMonth"
      :focus-month="focusMonth"
      :compact="compact"
      :selecting="selection.enabled.value"
      :expanded="expanded"
      :metadata="showMetadata"
      @create="newEntry()"
      @select="toggleSelection"
      @expand="expanded = !expanded"
      @metadata="showMetadata = $event"
      @clear="clearFilters"
      @focus-month="focusMonth = $event"
    />
    <div class="planilha__context">
      <span
        >{{ periodLabel }} ·
        {{ query.dateMode === 'competence' ? 'por competência' : 'por vencimento' }}</span
      >
      <span v-if="filtered">{{ entries.length }} lançamento(s) no resultado · totais filtrados</span>
      <button
        v-if="hiddenMonths.some((month) => months.includes(month))"
        type="button"
        @click="hiddenMonths = []"
      >
        Mostrar meses ocultos
      </button>
    </div>
    <FinancePeriodSummary
      :totals="totals"
      :label="filtered ? 'Resumo dos resultados filtrados' : 'Resumo do período'"
    />
    <UCollapsible v-if="filtered" class="planilha__general">
      <UButton color="neutral" variant="link" trailing-icon="i-lucide-chevron-down">Consultar resumo geral do período</UButton>
      <template #content><FinancePeriodSummary :totals="generalTotals" label="Resumo geral, sem filtros" /></template>
    </UCollapsible>
    <Transition name="ds-reveal"
      ><UAlert v-if="feedback" class="planilha__feedback" role="status" aria-live="polite" :color="store.offlineQueue.length ? 'warning' : 'success'" variant="subtle" :title="feedback" icon="i-lucide-circle-check">
        <template v-if="undoStatus" #actions><UButton color="neutral" variant="outline" :disabled="busy" @click="restoreStatus">Desfazer</UButton></template>
      </UAlert></Transition
    >
    <UAlert v-if="error && !editorEntry && !accountEditor && !confirmation" :description="error" color="error" variant="subtle" role="alert" />
    <UCard v-if="!store.entries.length" title="Sua organização começa aqui" description="Cadastre o primeiro lançamento. Você pode adicionar uma conta agora ou escolher depois.">
      <BaseButton @click="newEntry()">Criar primeiro lançamento</BaseButton
      ><NuxtLink
        :to="{ path: '/contas', query: { ...(route.query.key ? { key: route.query.key } : {}), new: '1' } }"
        >Criar uma conta</NuxtLink
      >
    </UCard>
    <Transition name="ds-reveal"
      ><UAlert v-if="selection.enabled.value" class="planilha__selection" role="status" aria-live="polite" color="primary" variant="subtle" description="Soma dos valores selecionados; não representa o saldo.">
        <template #title><span
          >{{ selection.count.value }}
          {{ selection.count.value === 1 ? 'célula selecionada' : 'células selecionadas' }} ·
          <strong>Soma: {{ fmt(selection.sum.value) }}</strong></span></template>
        <template #actions><BaseButton variant="ghost" @click="selection.clear">Limpar seleção</BaseButton></template>
      </UAlert></Transition
    >
    <div
      v-if="activeRow && activeCell && !compact && !selection.enabled.value"
      class="planilha__cell-context"
    >
      <span
        >{{ activeRow.title }} · {{ shortMonth(activeCell.month) }} ·
        {{ fmt(cell(activeRow, activeCell.month).amount) }}</span
      ><BaseButton variant="ghost" @click="editCell(activeRow, activeCell.month)">Editar</BaseButton
      ><BaseButton variant="ghost" @click="detailOpen = true">Ver composição</BaseButton>
    </div>
    <Transition name="fade-slide" mode="out-in">
    <FinanceMatrixTable
      v-if="query.presentation === 'matrix'"
      :key="`matrix:${query.month}:${query.range}`"
      ref="table"
      :groups="groups"
      :months="visibleMonths"
      :summaries="model.summaries"
      :collapsed="collapsed"
      :selected="selection.selected.value"
      :selecting="selection.enabled.value"
      :active="activeCell"
      :metadata="showMetadata && !compact"
      :today-month="todayMonth"
      :max-height="tableHeight"
      :filtered="filtered"
      :highlighted="highlighted"
      @cell="selectCell"
      @edit="editCell"
      @inspect="inspectRow"
      @row-options="actionRow = $event"
      @month-options="actionMonth = $event"
      @collapse="toggleGroup"
      @drag-start="beginDrag"
      @drag-move="extendDrag"
    />
    <FinanceEntryGrid
      v-else
      key="list"
      :entries="entries"
      :accounts="store.accounts"
      :date-mode="query.dateMode"
      :busy="busy"
      :highlighted="highlighted"
      @edit="openEditor"
      @toggle="toggleEntryStatus"
    />
    </Transition>
    <p class="planilha__legend">
      <span class="text-success">✓ Pago / recebido</span> · <span class="text-error">○ Pendente</span> ·
      <span class="text-error">◐ Parcial</span> · <span class="text-error">! Revisar</span> ·
      — Sem lançamento · 0,00 Valor cadastrado
    </p>

    <BaseModal
      :open="Boolean(detailOpen && activeRow && activeCell && !selection.enabled.value)"
      :title="detailTitle"
      :max-width="760"
      @close="detailOpen = false"
    >
      <template v-if="activeRow && activeCell">
        <p class="planilha__detail-context">
          {{ rowDueCaption(activeRow) }} ·
          {{ cell(activeRow, activeCell.month).entries.length }} lançamento(s) ·
          {{ fmt(cell(activeRow, activeCell.month).amount) }}
        </p>
        <UCard v-if="activeRow.group === 'cards' && activeRow.account" variant="subtle" :ui="{ body: 'grid gap-2 text-xs' }">
          <span
            >Limite:
            {{
              activeRow.account.limitTotal == null ? 'Não cadastrado' : fmt(activeRow.account.limitTotal)
            }}</span
          ><span
            >Fecha dia {{ activeRow.account.closingDay ?? '—' }} · vence dia
            {{ activeRow.account.dueDay ?? '—' }}</span
          ><span
            >Comprometido: {{ fmt(cardCommitment(activeRow).committed) }} · disponível estimado:
            {{
              cardCommitment(activeRow).available == null
                ? 'Sem limite'
                : fmt(cardCommitment(activeRow).available!)
            }}</span
          ><small
            >Estimativa dos lançamentos pendentes do cartão, incluindo parcelas futuras; não é consulta ao
            banco.</small
          >
        </UCard>
        <FinanceEntryGrid
          :entries="cell(activeRow, activeCell.month).entries"
          :accounts="store.accounts"
          :date-mode="query.dateMode"
          :busy="busy"
          :highlighted="highlighted"
          @edit="openEditor"
          @toggle="toggleEntryStatus"
        />
        <UAlert v-if="error" color="error" variant="subtle" :description="error" role="alert" />
      </template>
      <template #footer
        ><template v-if="activeRow && activeCell"
          ><BaseButton variant="secondary" @click="viewMonth(activeCell.month)">Ver mês na Lista</BaseButton
          ><BaseButton @click="newEntry(activeRow, activeCell.month)"
            >Adicionar lançamento</BaseButton
          ></template
        ></template
      >
    </BaseModal>
    <FinanceEntryEditorModal
      v-if="editorEntry"
      :open="true"
      :entry="editorEntry"
      :accounts="store.accounts"
      :categories="store.categories"
      :allow-recurrence="creating"
      :creating="creating"
      :busy="busy"
      :error="error"
      @close="closeEditor"
      @save="saveEditor"
      @delete="requestDeleteEntry"
      ><template #context
        ><p class="planilha__detail-context">
          {{ creating ? 'Novo lançamento' : 'Edição' }} ·
          {{
            longMonth(
              (query.dateMode === 'competence' ? editorEntry.competenceDate : editorEntry.dueDate).slice(0, 7)
            )
          }}
        </p></template
      ></FinanceEntryEditorModal
    >
    <AccountEditorSheet
      v-if="accountEditor"
      :open="true"
      :account="accountEditor"
      :busy="busy"
      :error="error"
      @close="accountEditor = null"
      @save="saveAccount"
    />
    <BaseModal
      :open="Boolean(actionRow)"
      :title="actionRow?.title ?? 'Ações da linha'"
      :max-width="400"
      @close="actionRow = null"
      ><div v-if="actionRow" class="planilha__actions">
        <BaseButton
          variant="ghost"
          @click="createInActionRow"
          >Adicionar lançamento em {{ shortMonth(focusMonth) }}</BaseButton
        ><BaseButton
          v-if="actionRow.account && actionRow.group === 'cards'"
          variant="ghost"
          @click="editActionAccount"
          >Editar cartão</BaseButton
        ><BaseButton v-else variant="ghost" @click="requestRowAction('rename')"
          >Renomear lançamentos…</BaseButton
        ><BaseButton variant="ghost" @click="moveRow(-1)">↑ Mover para cima</BaseButton
        ><BaseButton variant="ghost" @click="moveRow(1)">↓ Mover para baixo</BaseButton
        ><BaseButton variant="ghost" @click="requestRowAction('delete')">Excluir lançamentos…</BaseButton>
      </div></BaseModal
    >
    <BaseModal
      :open="Boolean(actionMonth)"
      :title="actionMonth ? longMonth(actionMonth) : 'Opções do mês'"
      :max-width="400"
      @close="actionMonth = ''"
      ><div class="planilha__actions">
        <BaseButton variant="ghost" @click="viewMonth(actionMonth)">Ver lançamentos deste mês</BaseButton
        ><BaseButton variant="ghost" :disabled="visibleMonths.length <= 1" @click="hideMonth(false)"
          >Ocultar este mês</BaseButton
        ><BaseButton variant="ghost" @click="hideMonth(true)">Ocultar meses anteriores</BaseButton
        ><BaseButton variant="ghost" @click="requestClearMonth">Zerar valores do mês…</BaseButton>
      </div></BaseModal
    >
    <BaseModal
      :open="Boolean(confirmation)"
      :title="
        confirmation?.type === 'rename'
          ? 'Renomear lançamentos'
          : confirmation?.type === 'clear'
            ? 'Zerar valores'
            : 'Excluir lançamentos'
      "
      :max-width="480"
      :busy="busy"
      @close="confirmation = null"
    >
      <template v-if="confirmation"
        ><BaseDropdown
          v-if="confirmation.rowId"
          v-model="operationScope"
          label="Aplicar a"
          :options="scopeOptions"
        /><BaseInput v-if="confirmation.type === 'rename'" v-model="renameValue" label="Novo nome" />
        <p>{{ operationEntries.length }} lançamento(s){{ operationDates ? ` · ${operationDates}` : '' }}.</p>
        <p v-if="confirmation.type === 'delete'">
          A exclusão é permanente. Confira o período e a quantidade antes de confirmar.
        </p>
        <p v-else-if="confirmation.type === 'clear'">Os registros serão preservados com valor zero.</p>
        <UAlert v-if="error" color="error" variant="subtle" :description="error" role="alert" /></template
      >
      <template #footer
        ><BaseButton variant="secondary" :disabled="busy" @click="confirmation = null">Cancelar</BaseButton
        ><BaseButton
          :variant="confirmation?.type === 'delete' ? 'danger' : 'primary'"
          :disabled="
            busy || !operationEntries.length || (confirmation?.type === 'rename' && !renameValue.trim())
          "
          @click="confirmOperation"
          >{{ busy ? 'Salvando…' : 'Confirmar' }}</BaseButton
        ></template
      >
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import {
  buildFinanceMatrix,
  matrixCardCommitment,
  matrixDate,
  matrixRowId,
  sumMoney,
  type MatrixGroup,
  type MatrixRow,
  type MatrixMonthSummary
} from '#shared/matrix'
import type { Account, EntryKind, FinanceEntry } from '#shared/types'
import { serializeFinanceQuery } from '#shared/financeQuery'
import { useFinanceStore } from '../stores/useFinanceStore'
import { useCurrency } from '../composables/useCurrency'
import { useMatrixSelection, type MatrixCell } from '../composables/useMatrixSelection'
import { usePlanilhaQuery } from '../composables/usePlanilhaQuery'
import PlanilhaToolbar from './PlanilhaToolbar.vue'
import FinancePeriodSummary from './FinancePeriodSummary.vue'
import FinanceMatrixTable from './FinanceMatrixTable.vue'
import FinanceEntryGrid from './FinanceEntryGrid.vue'
import FinanceEntryEditorModal from './FinanceEntryEditorModal.vue'
import AccountEditorSheet from './AccountEditorSheet.vue'

const store = useFinanceStore(),
  route = useRoute(),
  router = useRouter()
const { query, months, entries, periodEntries, filtered, todayMonth, clearFilters } = usePlanilhaQuery()
const { format: fmt } = useCurrency(),
  { formatDate } = useDateFormat()
const compact = ref(false),
  expanded = ref(false),
  showMetadata = ref(false)
const focusMonth = useState(`planilha-focus:${store.settings.id}`, () => query.value.month)
const screenHost = ref<HTMLElement | null>(null),
  table = ref<InstanceType<typeof FinanceMatrixTable> | null>(null),
  tableHeight = ref<number | null>(null)
const hiddenMonths = ref<string[]>([]),
  rowOrder = ref<string[]>([]),
  collapsed = ref<MatrixGroup[]>(['excluded'])
const model = computed(() =>
  buildFinanceMatrix(entries.value, store.accounts, months.value, query.value.dateMode)
)
const generalModel = computed(() =>
  buildFinanceMatrix(periodEntries.value, store.accounts, months.value, query.value.dateMode)
)
const visibleMonths = computed(() => {
  const visible = months.value.filter((month) => !hiddenMonths.value.includes(month))
  return visible.length ? visible : [months.value[0]!]
})
const shortMonth = (month: string) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(
    new Date(`${month}-01T12:00:00Z`)
  )
const longMonth = (month: string) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${month}-01T12:00:00Z`)
  )
const periodLabel = computed(() =>
  months.value.length === 1
    ? longMonth(query.value.month)
    : `${shortMonth(months.value[0]!)} a ${shortMonth(months.value.at(-1)!)}`
)
const groupLabels: Record<MatrixGroup, string> = {
  expenses: 'Despesas',
  cards: 'Cartões',
  income: 'Receitas',
  excluded: 'Fora do saldo'
}
const groups = computed(() =>
  (Object.keys(groupLabels) as MatrixGroup[])
    .map((id) => ({
      id,
      label: groupLabels[id],
      rows: model.value.rows
        .filter((row) => row.group === id && (!filtered.value || row.entries.length))
        .sort((a, b) => {
          const ai = rowOrder.value.indexOf(a.id),
            bi = rowOrder.value.indexOf(b.id)
          return (ai < 0 ? Number.MAX_SAFE_INTEGER : ai) - (bi < 0 ? Number.MAX_SAFE_INTEGER : bi)
        })
    }))
    .filter((group) => group.rows.length)
)
const totalFields = ['income', 'expense', 'net', 'pendingExpense', 'pendingIncome', 'settledNet'] as const
const summarize = (source: ReturnType<typeof buildFinanceMatrix>) =>
  Object.fromEntries(
    totalFields.map((key) => [
      key,
      sumMoney(months.value.map((month) => source.summaries[month]?.[key] ?? 0))
    ])
  ) as Pick<MatrixMonthSummary, (typeof totalFields)[number]>
const totals = computed(() => summarize(model.value)),
  generalTotals = computed(() => summarize(generalModel.value))
const cell = (row: MatrixRow, month: string) => row.cells[month]!
const rowDueCaption = (row: MatrixRow) => {
  const days = row.dueDays.length ? row.dueDays : row.account?.dueDay ? [row.account.dueDay] : []
  return days.length
    ? `${row.kind === 'income' ? 'Recebe' : 'Vence'} ${days.length === 1 ? 'dia' : 'dias'} ${days.join(' / ')}`
    : 'Sem vencimento'
}
const activeCell = ref<{ rowId: string; month: string } | null>(null),
  detailOpen = ref(false)
const activeRow = computed(() => model.value.rows.find((row) => row.id === activeCell.value?.rowId) ?? null)
const detailTitle = computed(() =>
  activeRow.value && activeCell.value
    ? `${activeRow.value.title} · ${longMonth(activeCell.value.month)}`
    : 'Composição da célula'
)
const selectableCells = computed(() =>
  groups.value
    .filter((group) => !collapsed.value.includes(group.id))
    .flatMap((group) =>
      group.rows.flatMap((row) =>
        visibleMonths.value.map((month) => ({ kind: row.kind, title: row.id, month }))
      )
    )
)
const selection = useMatrixSelection(
  selectableCells,
  (item) => model.value.rows.find((row) => row.id === item.title)?.cells[item.month]?.amount ?? 0
)
let drag: { from: MatrixCell; base: Set<string> } | null = null,
  dragged = false
const selectionCell = (row: MatrixRow, month: string): MatrixCell => ({
  kind: row.kind,
  title: row.id,
  month
})
function beginDrag(row: MatrixRow, month: string, event: PointerEvent) {
  dragged = false
  if (selection.enabled.value && event.pointerType === 'mouse' && event.button === 0)
    drag = { from: selectionCell(row, month), base: new Set(selection.selected.value) }
}
function extendDrag(row: MatrixRow, month: string, event: PointerEvent) {
  if (!drag || !(event.buttons & 1) || drag.from.kind !== row.kind) return
  dragged = true
  selection.anchor.value = drag.from
  selection.range(drag.from, selectionCell(row, month), drag.base)
}
function endDrag() {
  drag = null
}
function selectCell(row: MatrixRow, month: string, event: MouseEvent) {
  focusMonth.value = month
  if (dragged) {
    dragged = false
    return
  }
  if (selection.enabled.value) {
    const item = selectionCell(row, month)
    if (event.shiftKey && selection.anchor.value)
      selection.range(selection.anchor.value, item, selection.selected.value)
    else selection.toggle(item)
  } else {
    activeCell.value = { rowId: row.id, month }
    detailOpen.value = compact.value
  }
}
function editCell(row: MatrixRow, month: string) {
  if (selection.enabled.value || busy.value) return
  focusMonth.value = month
  const records = cell(row, month).entries
  if (!records.length) newEntry(row, month)
  else if (records.length === 1) openEditor(records[0]!)
  else {
    activeCell.value = { rowId: row.id, month }
    detailOpen.value = true
  }
}
function inspectRow(row: MatrixRow) {
  detailOpen.value = true
  activeCell.value = {
    rowId: row.id,
    month: visibleMonths.value.includes(focusMonth.value) ? focusMonth.value : visibleMonths.value[0]!
  }
}
function toggleGroup(group: MatrixGroup) {
  collapsed.value = collapsed.value.includes(group)
    ? collapsed.value.filter((id) => id !== group)
    : [...collapsed.value, group]
}
function toggleSelection() {
  activeCell.value = null
  selection.enabled.value = !selection.enabled.value
}

const editorEntry = ref<FinanceEntry | null>(null),
  creating = ref(false),
  busy = ref(false),
  error = ref(''),
  feedback = ref(''),
  highlighted = ref<string[]>([])
const undoStatus = ref<FinanceEntry | null>(null)
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
function announce(message: string, ids: string[] = []) {
  feedback.value = message
  highlighted.value = ids
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedback.value = ''
    highlighted.value = []
    undoStatus.value = null
  }, 6500)
}
function openEditor(entry: FinanceEntry) {
  detailOpen.value = false
  activeCell.value = null
  creating.value = false
  error.value = ''
  focusMonth.value = matrixDate(entry, query.value.dateMode).slice(0, 7)
  editorEntry.value = { ...entry }
}
function closeEditor() {
  if (!busy.value) {
    editorEntry.value = null
    error.value = ''
  }
}
function createInActionRow() {
  if (actionRow.value) newEntry(actionRow.value)
  actionRow.value = null
}
function editActionAccount() {
  if (actionRow.value?.account) accountEditor.value = { ...actionRow.value.account }
  actionRow.value = null
}
function newEntry(
  row?: MatrixRow,
  month = focusMonth.value,
  kind: EntryKind = row?.kind ?? (query.value.kind === 'income' ? 'income' : 'expense')
) {
  detailOpen.value = false
  activeCell.value = null
  creating.value = true
  error.value = ''
  focusMonth.value = month
  const account = row?.account ?? store.accounts.find((account) => account.id === query.value.accountId)
  const maxDay = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate()
  const day = Math.min(maxDay, Math.max(1, row?.dueDays[0] ?? account?.dueDay ?? 1))
  const date = `${month}-${String(day).padStart(2, '0')}`,
    now = new Date().toISOString()
  editorEntry.value = {
    id: crypto.randomUUID(),
    householdId: store.settings.id,
    title: row?.group === 'cards' ? `${row.title} - fatura` : (row?.title ?? ''),
    description: '',
    amount: 0,
    kind,
    accountId: account?.id ?? null,
    categoryId: row?.entries[0]?.categoryId ?? null,
    ruleId: row?.group === 'cards' ? null : (row?.entries[0]?.ruleId ?? null),
    dueDate: date,
    competenceDate: date,
    status: 'pending',
    installmentIndex: null,
    installmentTotal: null,
    origin: 'manual',
    excludeFromCalc: row?.group === 'excluded',
    metadata: null,
    createdAt: now,
    updatedAt: now
  }
}
async function persist(upserts: Partial<FinanceEntry>[], deletes: string[] = []): Promise<boolean> {
  if (busy.value) return false
  busy.value = true
  error.value = ''
  try {
    await store.saveEntriesBatch({ upserts, deletes })
    announce(
      store.offlineQueue.length
        ? 'Pendente de sincronização. Seus dados estão salvos neste dispositivo.'
        : 'Alteração salva.',
      upserts.flatMap((entry) => (entry.id ? [entry.id] : []))
    )
    return true
  } catch {
    error.value = 'Não foi possível salvar. Seus dados continuam no editor. Tente novamente.'
    return false
  } finally {
    busy.value = false
  }
}
async function saveEditor(values: Partial<FinanceEntry>[]) {
  const seed = editorEntry.value
  if (!seed) return
  const upserts = values.map((value) => ({
    ...(store.entries.find((entry) => entry.id === value.id) ?? seed),
    ...value
  }))
  if (await persist(upserts)) editorEntry.value = null
}
async function toggleEntryStatus(entry: FinanceEntry) {
  const previous = { ...entry }
  if (await persist([{ ...entry, status: entry.status === 'paid' ? 'pending' : 'paid' }])) {
    undoStatus.value = previous
    feedback.value = store.offlineQueue.length
      ? 'Status atualizado neste dispositivo. Pendente de sincronização.'
      : entry.status === 'paid'
        ? 'Lançamento marcado como pendente.'
        : entry.kind === 'income'
          ? 'Recebimento confirmado.'
          : 'Pagamento confirmado.'
  }
}
async function restoreStatus() {
  if (!undoStatus.value) return
  const previous = undoStatus.value
  if (await persist([previous])) {
    undoStatus.value = null
    feedback.value = store.offlineQueue.length
      ? 'Status restaurado neste dispositivo. Pendente de sincronização.'
      : 'Status anterior restaurado.'
  }
}
const cardCommitment = (row: MatrixRow) => matrixCardCommitment(store.entries, row.account!)
const accountEditor = ref<Account | null>(null)
async function saveAccount(account: Partial<Account>) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await store.saveAccount(account)
    accountEditor.value = null
    announce('Conta atualizada.')
  } catch {
    error.value = 'Não foi possível salvar a conta. Tente novamente.'
  } finally {
    busy.value = false
  }
}

const actionRow = ref<MatrixRow | null>(null),
  actionMonth = ref('')
type Operation = { type: 'rename' | 'delete' | 'clear'; rowId?: string; ids?: string[]; month?: string }
const confirmation = ref<Operation | null>(null),
  operationScope = ref('period'),
  renameValue = ref('')
const scopeOptions = computed(() => [
  { value: 'month', label: `Somente ${shortMonth(focusMonth.value)}` },
  { value: 'period', label: 'Período exibido' },
  { value: 'all', label: 'Todos os meses da linha, incluindo itens ocultos' }
])
const operationEntries = computed(() => {
  const operation = confirmation.value
  if (!operation) return []
  return store.entries.filter((entry) => {
    if (operation.ids) return operation.ids.includes(entry.id)
    if (operation.month)
      return (
        entries.value.some((item) => item.id === entry.id) &&
        matrixDate(entry, query.value.dateMode).startsWith(operation.month)
      )
    if (matrixRowId(entry, store.accounts) !== operation.rowId) return false
    const month = matrixDate(entry, query.value.dateMode).slice(0, 7)
    return (
      operationScope.value === 'all' ||
      (entries.value.some((item) => item.id === entry.id) &&
        (operationScope.value === 'month' ? month === focusMonth.value : months.value.includes(month)))
    )
  })
})
const operationDates = computed(() => {
  const dates = operationEntries.value.map((entry) => matrixDate(entry, query.value.dateMode)).sort()
  return dates.length ? `${formatDate(dates[0]!)} a ${formatDate(dates.at(-1)!)}` : ''
})
function requestRowAction(type: 'rename' | 'delete') {
  if (!actionRow.value) return
  renameValue.value = actionRow.value.title
  operationScope.value = 'period'
  confirmation.value = { type, rowId: actionRow.value.id }
  actionRow.value = null
  error.value = ''
}
function requestDeleteEntry(id: string) {
  confirmation.value = { type: 'delete', ids: [id] }
  error.value = ''
}
function requestClearMonth() {
  confirmation.value = { type: 'clear', month: actionMonth.value }
  actionMonth.value = ''
  error.value = ''
}
async function confirmOperation() {
  if (!confirmation.value) return
  const current = confirmation.value,
    records = operationEntries.value
  if (current.type === 'rename' && !renameValue.value.trim()) return
  const upserts =
    current.type === 'rename'
      ? records.map((entry) => ({ ...entry, title: renameValue.value.trim() }))
      : current.type === 'clear'
        ? records.map((entry) => ({ ...entry, amount: 0 }))
        : []
  if (await persist(upserts, current.type === 'delete' ? records.map((entry) => entry.id) : [])) {
    confirmation.value = null
    if (current.type === 'delete') {
      editorEntry.value = null
      activeCell.value = null
    }
  }
}
function moveRow(direction: number) {
  const row = actionRow.value
  if (!row) return
  const ids = groups.value.find((group) => group.id === row.group)!.rows.map((item) => item.id),
    index = ids.indexOf(row.id),
    next = index + direction
  if (next >= 0 && next < ids.length) {
    ids.splice(index, 1)
    ids.splice(next, 0, row.id)
    rowOrder.value = [...rowOrder.value.filter((id) => !ids.includes(id)), ...ids]
  }
  actionRow.value = null
}
function hideMonth(previous: boolean) {
  if (!actionMonth.value) return
  const hidden = previous ? months.value.filter((month) => month < actionMonth.value) : [actionMonth.value]
  if (months.value.some((month) => !hidden.includes(month) && !hiddenMonths.value.includes(month)))
    hiddenMonths.value = [...new Set([...hiddenMonths.value, ...hidden])]
  actionMonth.value = ''
}
function viewMonth(month: string) {
  query.value.month = month
  query.value.range = 'month'
  query.value.presentation = 'list'
  focusMonth.value = month
  activeCell.value = null
  actionMonth.value = ''
}
watch(
  () => [query.value.month, query.value.range],
  () => {
    focusMonth.value = query.value.month
    activeCell.value = null
  }
)
watch(
  () => query.value.presentation,
  () => {
    selection.enabled.value = false
    activeCell.value = null
  }
)

let observer: ResizeObserver | undefined,
  media: MediaQueryList | undefined,
  active = true
function updateHeight() {
  if (!active || !screenHost.value) return
  compact.value = media?.matches ?? false
  const region = table.value?.host
  if (!region) return
  const styles = getComputedStyle(document.documentElement)
  const nav = expanded.value ? 0 : Number.parseFloat(styles.getPropertyValue('--app-bottom-offset')) || 0
  const height = window.visualViewport?.height ?? innerHeight
  tableHeight.value = Math.max(160, Math.floor(height - region.getBoundingClientRect().top - nav - 42))
}
function handleBack(event: Event) {
  if (event.defaultPrevented || !active) return
  if (
    editorEntry.value ||
    confirmation.value ||
    accountEditor.value ||
    actionRow.value ||
    actionMonth.value ||
    detailOpen.value
  )
    return
  if (expanded.value) {
    event.preventDefault()
    expanded.value = false
  } else if (selection.enabled.value) {
    event.preventDefault()
    selection.enabled.value = false
  } else if (activeCell.value) {
    event.preventDefault()
    activeCell.value = null
  }
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !document.querySelector('[aria-modal="true"]')) handleBack(event)
}
let processingAction = false
watch(
  () => [route.path, route.query.entry, route.query.new, store.initialized],
  async () => {
    if (
      !import.meta.client ||
      route.path !== '/planilha' ||
      !store.initialized ||
      processingAction ||
      (!route.query.entry && !route.query.new)
    )
      return
    processingAction = true
    try {
      const entry =
        typeof route.query.entry === 'string'
          ? store.entries.find((entry) => entry.id === route.query.entry)
          : undefined
      if (entry) {
        query.value.month = matrixDate(entry, query.value.dateMode).slice(0, 7)
        focusMonth.value = query.value.month
        openEditor(entry)
      } else if (route.query.new === '1') newEntry()
      else if (route.query.entry) error.value = 'Este lançamento não foi encontrado.'
      const next = { ...route.query, ...serializeFinanceQuery(query.value) }
      delete next.entry
      delete next.new
      await router.replace({ path: '/planilha', query: next })
    } finally {
      processingAction = false
    }
  },
  { immediate: true }
)
const preferenceKey = computed(() => `finance-planilha:${store.settings.id}`)
onMounted(() => {
  media = window.matchMedia('(max-width: 767px)')
  compact.value = media.matches
  try {
    const saved = JSON.parse(
      localStorage.getItem(preferenceKey.value) ??
        localStorage.getItem(`finance-annual-matrix:${store.settings.id}`) ??
        '{}'
    )
    rowOrder.value = Array.isArray(saved.rowOrder)
      ? saved.rowOrder.filter((id: unknown) => typeof id === 'string')
      : []
    hiddenMonths.value = Array.isArray(saved.hiddenMonths)
      ? saved.hiddenMonths.filter(
          (month: unknown) => typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)
        )
      : []
    showMetadata.value = saved.showMetadata === true
  } catch {
    /* Invalid visual preferences never prevent accessing records. */
  }
  observer = new ResizeObserver(updateHeight)
  if (screenHost.value) observer.observe(screenHost.value)
  window.addEventListener('resize', updateHeight)
  window.visualViewport?.addEventListener('resize', updateHeight)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
  window.addEventListener('finance:back', handleBack)
  window.addEventListener('keydown', keydown)
  nextTick(updateHeight)
})
watch(
  [hiddenMonths, rowOrder, showMetadata],
  () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(
        preferenceKey.value,
        JSON.stringify({
          hiddenMonths: hiddenMonths.value,
          rowOrder: rowOrder.value,
          showMetadata: showMetadata.value
        })
      )
    } catch {
      /* Changes still apply for the current session. */
    }
  },
  { deep: true }
)
watch([table, expanded, () => query.value.presentation, () => selection.enabled.value], () =>
  nextTick(updateHeight)
)
onActivated(() => {
  active = true
  nextTick(updateHeight)
})
onDeactivated(() => {
  active = false
  activeCell.value = null
  editorEntry.value = null
  accountEditor.value = null
  actionRow.value = null
  actionMonth.value = ''
  confirmation.value = null
  expanded.value = false
})
onBeforeUnmount(() => {
  clearTimeout(feedbackTimer)
  observer?.disconnect()
  window.removeEventListener('resize', updateHeight)
  window.visualViewport?.removeEventListener('resize', updateHeight)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
  window.removeEventListener('finance:back', handleBack)
  window.removeEventListener('keydown', keydown)
})
</script>

<style scoped>
.planilha {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: var(--ds-space-4);
}
.planilha--expanded {
  position: fixed;
  inset: 0;
  z-index: 200;
  padding: max(12px, env(safe-area-inset-top)) 14px max(12px, env(safe-area-inset-bottom));
  background: var(--bg);
  overflow: auto;
}
.planilha__cell-context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text2);
}
.planilha__context {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: var(--text3);
  font-size: 11px;
}
.planilha__context button {
  border: 0;
  background: none;
  color: var(--primary);
  font: inherit;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.planilha__general {
  color: var(--text2);
  font-size: 12px;
}
.planilha__general summary {
  cursor: pointer;
  padding: 4px 0 8px;
}
.planilha__legend {
  margin: 0;
  color: var(--text3);
  font-size: 10px;
  line-height: 1.6;
}
.planilha__detail-context {
  font-size: 12px;
  color: var(--text2);
  margin: 0 0 12px;
}
.planilha__actions {
  display: grid;
  gap: 8px;
}
.planilha__actions :deep(button) {
  justify-content: flex-start;
  min-height: 40px;
}
@media (max-width: 767px) {
  .planilha {
    gap: 10px;
  }
    .planilha__context {
    font-size: 10px;
  }
}
</style>

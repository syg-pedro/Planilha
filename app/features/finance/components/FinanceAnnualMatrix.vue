<template>
  <section
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
      :expanded="expanded"
      @create="newEntry()"
      @expand="expanded = !expanded"
      @clear="clearFilters"
      @focus-month="focusMonth = $event"
    />
    <div class="planilha__context">
      <span
        >{{ periodLabel }} ·
        {{ query.dateMode === 'competence' ? 'por competência' : 'por vencimento' }}</span
      >
      <span v-if="filtered">{{ entries.length }} lançamento(s) no resultado · totais filtrados</span>
    </div>
    <FinancePeriodSummary
      :totals="totals"
      :label="filtered ? 'Resumo dos resultados filtrados' : 'Resumo do período'"
    />
    <UCollapsible v-if="filtered" class="planilha__general">
      <UButton color="neutral" variant="link" trailing-icon="i-lucide-chevron-down">Consultar resumo geral do período</UButton>
      <template #content><FinancePeriodSummary :totals="generalTotals" label="Resumo geral, sem filtros" /></template>
    </UCollapsible>
    <UAlert v-if="error && !editorEntry && !confirmation" :description="error" color="error" variant="subtle" role="alert" />
    <UCard v-if="!store.entries.length" title="Sua organização começa aqui" description="Cadastre o primeiro lançamento. Você pode adicionar uma conta agora ou escolher depois.">
      <BaseButton @click="newEntry()">Criar primeiro lançamento</BaseButton
      ><NuxtLink
        :to="{ path: '/contas', query: { ...(route.query.key ? { key: route.query.key } : {}), new: '1' } }"
        >Criar uma conta</NuxtLink
      >
    </UCard>
    <Transition name="fade-slide" mode="out-in">
    <FinanceSpreadsheet
      v-if="!compact && query.presentation === 'matrix'"
      :key="`sheet:${query.month}:${query.range}`"
      :entries="entries"
      :months="months"
      :date-mode="query.dateMode"
      :today-month="todayMonth"
      @focus-month="focusMonth = $event"
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
    <BaseModal
      :open="Boolean(confirmation)"
      title="Excluir lançamento"
      :max-width="480"
      :busy="busy"
      @close="confirmation = null"
    >
      <template v-if="confirmation"
        ><p>{{ operationEntries.length }} lançamento(s){{ operationDates ? ` · ${operationDates}` : '' }}.</p>
        <p>A exclusão é permanente. Confira antes de confirmar.</p>
        <UAlert v-if="error" color="error" variant="subtle" :description="error" role="alert" /></template
      >
      <template #footer
        ><BaseButton variant="secondary" :disabled="busy" @click="confirmation = null">Cancelar</BaseButton
        ><BaseButton
          variant="danger"
          :disabled="busy || !operationEntries.length"
          @click="confirmOperation"
          >{{ busy ? 'Salvando…' : 'Confirmar' }}</BaseButton
        ></template
      >
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import { buildFinanceMatrix, matrixDate, sumMoney, type MatrixMonthSummary } from '#shared/matrix'
import type { FinanceEntry } from '#shared/types'
import { serializeFinanceQuery } from '#shared/financeQuery'
import { useFinanceStore } from '../stores/useFinanceStore'
import { usePlanilhaQuery } from '../composables/usePlanilhaQuery'
import PlanilhaToolbar from './PlanilhaToolbar.vue'
import FinancePeriodSummary from './FinancePeriodSummary.vue'
import FinanceEntryGrid from './FinanceEntryGrid.vue'
import FinanceEntryEditorModal from './FinanceEntryEditorModal.vue'
import FinanceSpreadsheet from './spreadsheet/FinanceSpreadsheet.vue'

const store = useFinanceStore(),
  route = useRoute(),
  router = useRouter()
const toast = useToast()
const { query, months, entries, periodEntries, filtered, todayMonth, clearFilters, compact } = usePlanilhaQuery()
const { formatDate } = useDateFormat()
const expanded = ref(false)
const focusMonth = useState(`planilha-focus:${store.settings.id}`, () => query.value.month)
const model = computed(() =>
  buildFinanceMatrix(entries.value, store.accounts, months.value, query.value.dateMode)
)
const generalModel = computed(() =>
  buildFinanceMatrix(periodEntries.value, store.accounts, months.value, query.value.dateMode)
)
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

const editorEntry = ref<FinanceEntry | null>(null),
  creating = ref(false),
  busy = ref(false),
  error = ref(''),
  highlighted = ref<string[]>([])
let feedbackToastId: string | number | undefined
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
function announce(message: string, ids: string[] = [], undo?: FinanceEntry) {
  if (feedbackToastId !== undefined) toast.remove(feedbackToastId)
  feedbackToastId = toast.add({
    title: message,
    color: store.offlineQueue.length ? 'warning' : 'success',
    icon: store.offlineQueue.length ? 'i-lucide-cloud-off' : 'i-lucide-circle-check',
    duration: 6500,
    class: 'planilha-toast',
    actions: undo ? [{
      label: 'Desfazer',
      color: 'neutral',
      variant: 'outline',
      loadingAuto: true,
      closeOnClick: false,
      onClick: () => restoreStatus(undo)
    }] : []
  }).id
  highlighted.value = ids
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    highlighted.value = []
  }, 6500)
}
function openEditor(entry: FinanceEntry) {
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
function newEntry(month = focusMonth.value) {
  creating.value = true
  error.value = ''
  focusMonth.value = month
  const account = store.accounts.find((account) => account.id === query.value.accountId)
  const maxDay = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate()
  const day = Math.min(maxDay, Math.max(1, account?.dueDay ?? 1))
  const date = `${month}-${String(day).padStart(2, '0')}`,
    now = new Date().toISOString()
  editorEntry.value = {
    id: crypto.randomUUID(),
    householdId: store.settings.id,
    title: '',
    description: '',
    amount: 0,
    kind: query.value.kind === 'income' ? 'income' : 'expense',
    accountId: account?.id ?? null,
    categoryId: null,
    ruleId: null,
    dueDate: date,
    competenceDate: date,
    status: 'pending',
    installmentIndex: null,
    installmentTotal: null,
    origin: 'manual',
    excludeFromCalc: false,
    metadata: null,
    createdAt: now,
    updatedAt: now
  }
}
async function persist(upserts: Partial<FinanceEntry>[], deletes: string[] = [], notify = true): Promise<boolean> {
  if (busy.value) return false
  busy.value = true
  error.value = ''
  try {
    await store.saveEntriesBatch({ upserts, deletes })
    if (notify) announce(
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
  if (await persist([{ ...entry, status: entry.status === 'paid' ? 'pending' : 'paid' }], [], false)) {
    announce(store.offlineQueue.length
      ? 'Status atualizado neste dispositivo. Pendente de sincronização.'
      : entry.status === 'paid'
        ? 'Lançamento marcado como pendente.'
        : entry.kind === 'income'
          ? 'Recebimento confirmado.'
          : 'Pagamento confirmado.', [entry.id], previous)
  }
}
async function restoreStatus(previous: FinanceEntry) {
  if (await persist([previous], [], false)) {
    announce(store.offlineQueue.length
      ? 'Status restaurado neste dispositivo. Pendente de sincronização.'
      : 'Status anterior restaurado.', [previous.id])
  }
}

const confirmation = ref<{ ids: string[] } | null>(null)
const operationEntries = computed(() =>
  confirmation.value ? store.entries.filter((entry) => confirmation.value!.ids.includes(entry.id)) : []
)
const operationDates = computed(() => {
  const dates = operationEntries.value.map((entry) => matrixDate(entry, query.value.dateMode)).sort()
  return dates.length ? `${formatDate(dates[0]!)} a ${formatDate(dates.at(-1)!)}` : ''
})
function requestDeleteEntry(id: string) {
  confirmation.value = { ids: [id] }
  error.value = ''
}
async function confirmOperation() {
  if (!confirmation.value) return
  if (await persist([], operationEntries.value.map((entry) => entry.id))) {
    confirmation.value = null
    editorEntry.value = null
  }
}
watch(
  () => [query.value.month, query.value.range],
  () => {
    focusMonth.value = query.value.month
  }
)
watch(
  () => query.value.presentation,
  () => {
    expanded.value = false
  }
)

let active = true
function handleBack(event: Event) {
  if (event.defaultPrevented || !active || editorEntry.value || confirmation.value) return
  if (expanded.value) {
    event.preventDefault()
    expanded.value = false
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
onMounted(() => {
  window.addEventListener('finance:back', handleBack)
  window.addEventListener('keydown', keydown)
})
onActivated(() => {
  active = true
})
onDeactivated(() => {
  active = false
  editorEntry.value = null
  confirmation.value = null
  expanded.value = false
})
onBeforeUnmount(() => {
  clearTimeout(feedbackTimer)
  if (feedbackToastId !== undefined) toast.remove(feedbackToastId)
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
.planilha--expanded :deep(.sheet__grid) {
  max-height: calc(100dvh - 260px);
}
.planilha__context {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: var(--text3);
  font-size: 11px;
}
.planilha__general {
  color: var(--text2);
  font-size: 12px;
}
.planilha__detail-context {
  font-size: 12px;
  color: var(--text2);
  margin: 0 0 12px;
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

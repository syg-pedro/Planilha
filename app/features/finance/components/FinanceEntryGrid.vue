<template>
  <BasePanel title="Planilha editavel">
    <template #header>
      <div class="-mx-1 overflow-x-auto px-1 pb-1">
        <div class="flex min-w-max gap-2">
        <BaseButton size="sm" variant="secondary" @click="addRow">Novo lancamento</BaseButton>
        <BaseButton size="sm" variant="secondary" @click="deleteSelected">Excluir selecionados</BaseButton>
        <BaseButton size="sm" variant="primary" @click="store.rebuildRules">Regenerar recorrencias</BaseButton>
        </div>
      </div>
    </template>

    <div class="overflow-x-auto rounded-xl border">
      <div class="ag-theme-quartz ds-ag-theme h-[56vh] min-w-[920px] w-full sm:h-[66vh]">
        <AgGridVue
          :columnDefs="columnDefs"
          :defaultColDef="defaultColDef"
          :rowData="gridRows"
          :rowSelection="'multiple'"
          animateRows
          @grid-ready="onGridReady"
          @row-clicked="onRowClicked"
          @cell-value-changed="onCellValueChanged"
        />
      </div>
    </div>

    <p v-if="showFilterFallback" class="mt-2 text-xs ds-text-muted">
      Nenhum lancamento no recorte atual. Exibindo todos os registros para facilitar a edicao.
    </p>

    <FinanceEntryEditorModal
      :open="editorOpen"
      :entry="selectedEntry"
      :accounts="store.accounts"
      :categories="store.categories"
      @close="closeEditor"
      @save="saveFromEditor"
      @delete="deleteFromEditor"
    />
  </BasePanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, ModuleRegistry, type CellValueChangedEvent, type ColDef, type GridApi, type RowClickedEvent } from 'ag-grid-community'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import type { FinanceEntry } from '#shared/types'

ModuleRegistry.registerModules([AllCommunityModule])

const store = useFinanceStore()
const currency = useCurrency()
const { formatDate, toIsoDate } = useDateFormat()
const gridApi = ref<GridApi | null>(null)

const accountIds = computed(() => store.accounts.map((account) => account.id))
const categoryIds = computed(() => store.categories.map((category) => category.id))
const editorOpen = ref(false)
const selectedEntry = ref<FinanceEntry | null>(null)

const hasScopedFilters = computed(
  () =>
    store.filters.accountIds.length > 0 ||
    store.filters.categoryIds.length > 0 ||
    store.filters.range !== 'month'
)
const showFilterFallback = computed(
  () => store.filteredEntries.length === 0 && store.entries.length > 0 && !hasScopedFilters.value
)
const gridRows = computed(() => (showFilterFallback.value ? store.entries : store.filteredEntries))

const defaultColDef: ColDef = {
  flex: 1,
  minWidth: 120,
  editable: true,
  sortable: true,
  filter: true,
  resizable: true
}

const columnDefs = computed<ColDef[]>(() => [
  {
    field: 'dueDate',
    headerName: 'Vencimento',
    minWidth: 130,
    valueFormatter: ({ value }) => formatDate(value),
    valueParser: ({ newValue, oldValue }) => toIsoDate(String(newValue ?? '')) ?? oldValue
  },
  {
    field: 'competenceDate',
    headerName: 'Competencia',
    minWidth: 130,
    valueFormatter: ({ value }) => formatDate(value),
    valueParser: ({ newValue, oldValue }) => toIsoDate(String(newValue ?? '')) ?? oldValue
  },
  { field: 'title', headerName: 'Descricao', minWidth: 220 },
  {
    field: 'kind',
    headerName: 'Tipo',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: ['income', 'expense'] },
    valueFormatter: ({ value }) => (value === 'income' ? 'Receita' : 'Despesa')
  },
  {
    field: 'amount',
    headerName: 'Valor',
    type: 'numericColumn',
    valueParser: (params) => Number(params.newValue),
    valueFormatter: ({ value }) => currency.format(Number(value || 0))
  },
  {
    field: 'status',
    headerName: 'Status',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: ['pending', 'paid', 'review'] }
  },
  {
    field: 'accountId',
    headerName: 'Conta',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: accountIds.value },
    valueFormatter: ({ value }) => (value ? store.accountMap.get(value)?.name ?? value : 'Sem conta')
  },
  {
    field: 'categoryId',
    headerName: 'Categoria',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: categoryIds.value },
    valueFormatter: ({ value }) => (value ? store.categoryMap.get(value)?.name ?? value : 'Sem categoria')
  },
  { field: 'installmentIndex', headerName: 'Parcela', maxWidth: 100, valueParser: (params) => Number(params.newValue) },
  { field: 'installmentTotal', headerName: 'Total', maxWidth: 100, valueParser: (params) => Number(params.newValue) }
])

const onGridReady = (event: { api: GridApi }) => {
  gridApi.value = event.api
}

const onCellValueChanged = async (event: CellValueChangedEvent) => {
  await store.saveEntriesBatch({ upserts: [event.data], deletes: [] })
}

const onRowClicked = (event: RowClickedEvent) => {
  if (!event.data?.id) return
  selectedEntry.value = { ...event.data } as FinanceEntry
  editorOpen.value = true
}

const closeEditor = () => {
  editorOpen.value = false
  selectedEntry.value = null
}

const saveFromEditor = async (entry: Partial<FinanceEntry>) => {
  await store.saveEntriesBatch({ upserts: [entry], deletes: [] })
  closeEditor()
}

const deleteFromEditor = async (entryId: string) => {
  await store.saveEntriesBatch({ upserts: [], deletes: [entryId] })
  closeEditor()
}

const addRow = async () => {
  const now = new Date().toISOString().slice(0, 10)
  await store.saveEntriesBatch({
    upserts: [
      {
        id: `entry-${Math.random().toString(36).slice(2, 9)}`,
        dueDate: now,
        competenceDate: now,
        title: 'Novo lancamento',
        amount: 0,
        kind: 'expense',
        status: 'pending',
        accountId: null,
        categoryId: null
      }
    ],
    deletes: []
  })
}

const deleteSelected = async () => {
  if (!gridApi.value) return
  const rows = gridApi.value.getSelectedRows() as Array<{ id: string }>
  const ids = rows.map((row) => row.id).filter(Boolean)
  if (ids.length === 0) return
  await store.saveEntriesBatch({ upserts: [], deletes: ids })
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:16px">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-box">
        <div
          style="display:flex;align-items:center;gap:6px;background:var(--surface2);border-radius:var(--radius-xs);padding:0 12px;height:38px;transition:border-color 0.15s,box-shadow 0.15s"
          :style="searchFocused ? { border:'1.5px solid var(--primary)', boxShadow:'0 0 0 3px var(--primary-dim)' } : { border:'1.5px solid var(--border)' }"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text3);flex-shrink:0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchText"
            type="text"
            placeholder="Buscar lançamentos..."
            style="flex:1;background:transparent;border:none;outline:none;font-size:13px;color:var(--text);font-family:inherit"
            @focus="searchFocused=true"
            @blur="searchFocused=false"
          />
        </div>
      </div>
      <BaseSelect v-model="kindFilter" class="filter-select">
        <option value="all">Todos</option>
        <option value="income">Receitas</option>
        <option value="expense">Despesas</option>
      </BaseSelect>
      <BaseSelect v-model="statusFilter" class="filter-select">
        <option value="all">Todos os status</option>
        <option value="pending">Pendente</option>
        <option value="paid">Pago</option>
        <option value="review">Revisar</option>
      </BaseSelect>
      <button
        class="new-btn"
        @click="openNew"
        @mouseenter="($event.currentTarget as HTMLElement).style.filter='brightness(1.1)'"
        @mouseleave="($event.currentTarget as HTMLElement).style.filter=''"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Novo lançamento
      </button>
    </div>

    <!-- Summary strip -->
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <div :style="{ background:'var(--success-light)', borderRadius:'var(--radius-sm)', padding:'8px 16px', border:'1px solid var(--success)' }">
        <span style="font-size:11px;color:var(--success);font-weight:600;display:block">RECEITAS</span>
        <span style="font-size:16px;font-weight:800;color:var(--success)">{{ fmt(totals.income) }}</span>
      </div>
      <div :style="{ background:'var(--danger-light)', borderRadius:'var(--radius-sm)', padding:'8px 16px', border:'1px solid var(--danger)' }">
        <span style="font-size:11px;color:var(--danger);font-weight:600;display:block">DESPESAS</span>
        <span style="font-size:16px;font-weight:800;color:var(--danger)">{{ fmt(totals.expense) }}</span>
      </div>
      <div
        :style="{
          background: totals.net>=0?'var(--success-light)':'var(--danger-light)',
          borderRadius:'var(--radius-sm)', padding:'8px 16px',
          border: `1px solid ${totals.net>=0?'var(--success)':'var(--danger)'}`
        }"
      >
        <span style="font-size:11px;color:var(--text3);font-weight:600;display:block">SALDO</span>
        <span :style="{ fontSize:'16px', fontWeight:800, color: totals.net>=0?'var(--success)':'var(--danger)' }">{{ fmt(totals.net) }}</span>
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <div class="table-scroll">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:var(--surface2);border-bottom:1px solid var(--border)">
              <th style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap">Vencimento</th>
              <th style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap">Descrição</th>
              <th class="col-hide-sm" style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap">Tipo</th>
              <th class="col-hide-sm" style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap">Conta</th>
              <th class="col-hide-md" style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap">Categoria</th>
              <th style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap">Valor</th>
              <th style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap">Status</th>
              <th style="padding:10px 12px;text-align:left;color:var(--text3);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in filteredRows"
              :key="e.id"
              :style="{ borderBottom:'1px solid var(--border)', background: rowBg(e), cursor:'pointer', transition:'filter 0.1s' }"
              @mouseenter="($event.currentTarget as HTMLElement).style.filter='brightness(0.97)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.filter=''"
            >
              <td style="padding:10px 12px;font-weight:600;color:var(--text);white-space:nowrap" @click="openEdit(e)">{{ fmtDate(e.dueDate) }}</td>
              <td style="padding:10px 12px;color:var(--text)" @click="openEdit(e)">
                <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  {{ e.title }}
                  <span
                    v-if="e.installmentIndex"
                    style="font-size:10px;color:var(--text3);background:var(--border);border-radius:4px;padding:1px 5px"
                  >{{ e.installmentIndex }}/{{ e.installmentTotal }}</span>
                  <!-- Tipo badge visível apenas no mobile (quando a coluna está oculta) -->
                  <span
                    class="col-show-sm"
                    :style="{
                      background: e.kind==='income'?'var(--success-light)':'var(--danger-light)',
                      color: e.kind==='income'?'var(--success)':'var(--danger)',
                      borderRadius:'99px', padding:'1px 7px', fontSize:'10px', fontWeight:700
                    }"
                  >{{ e.kind==='income'?'Rec':'Desp' }}</span>
                </span>
              </td>
              <td class="col-hide-sm" style="padding:10px 12px" @click="openEdit(e)">
                <span
                  :style="{
                    background: e.kind==='income'?'var(--success-light)':'var(--danger-light)',
                    color: e.kind==='income'?'var(--success)':'var(--danger)',
                    borderRadius:'99px', padding:'2px 10px', fontSize:'11px', fontWeight:700
                  }"
                >{{ e.kind==='income'?'Receita':'Despesa' }}</span>
              </td>
              <td class="col-hide-sm" style="padding:10px 12px;color:var(--text2);white-space:nowrap" @click="openEdit(e)">
                {{ store.accountMap.get(e.accountId ?? '')?.name || '—' }}
              </td>
              <td class="col-hide-md" style="padding:10px 12px" @click="openEdit(e)">
                <span v-if="store.categoryMap.get(e.categoryId ?? '')" style="display:inline-flex;align-items:center;gap:5px">
                  <span
                    :style="{
                      width:'8px', height:'8px', borderRadius:'2px',
                      background: store.categoryMap.get(e.categoryId ?? '')?.color,
                      display:'inline-block'
                    }"
                  />
                  <span style="color:var(--text2);font-size:12px">{{ store.categoryMap.get(e.categoryId ?? '')?.name }}</span>
                </span>
              </td>
              <td
                :style="{ padding:'10px 12px', fontWeight:700, color: e.kind==='income'?'var(--success)':'var(--danger)', whiteSpace:'nowrap' }"
                @click="openEdit(e)"
              >{{ fmt(e.amount) }}</td>
              <td style="padding:10px 12px" @click="openEdit(e)">
                <span :style="badgeStyle(e.status)">{{ badgeLabel(e.status, e.kind) }}</span>
              </td>
              <td style="padding:10px 12px">
                <button
                  v-if="e.status !== 'paid'"
                  class="action-btn"
                  @click.stop="quickPay(e.id)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {{ e.kind === 'income' ? 'Receber' : 'Pagar' }}
                </button>
              </td>
            </tr>
            <tr v-if="filteredRows.length === 0">
              <td colspan="8" style="padding:32px;text-align:center;color:var(--text3)">Nenhum lançamento encontrado</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="padding:10px 16px;border-top:1px solid var(--border);background:var(--surface2);display:flex;gap:16px;flex-wrap:wrap">
        <span style="font-size:12px;color:var(--text3)">{{ filteredRows.length }} lançamento(s) exibido(s)</span>
      </div>
    </div>

    <FinanceEntryEditorModal
      :open="editorOpen"
      :entry="selectedEntry"
      :accounts="store.accounts"
      :categories="store.categories"
      @close="closeEditor"
      @save="saveFromEditor"
      @delete="deleteFromEditor"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import FinanceEntryEditorModal from '~/features/finance/components/FinanceEntryEditorModal.vue'
import type { FinanceEntry } from '#shared/types'

const props = withDefaults(defineProps<{ month?: string }>(), { month: '' })

const store = useFinanceStore()
const currency = useCurrency()

const fmt = (v: number) => currency.format(v)
const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const searchText = ref('')
const kindFilter = ref('all')
const statusFilter = ref('pending')
const searchFocused = ref(false)
const editorOpen = ref(false)
const selectedEntry = ref<FinanceEntry | null>(null)

const baseEntries = computed(() =>
  props.month ? store.entries.filter(e => e.dueDate.startsWith(props.month)) : store.filteredEntries
)

const filteredRows = computed(() => {
  return baseEntries.value
    .filter(e => {
      const matchText = !searchText.value || e.title.toLowerCase().includes(searchText.value.toLowerCase())
      const matchKind = kindFilter.value === 'all' || e.kind === kindFilter.value
      const matchStatus = statusFilter.value === 'all' || e.status === statusFilter.value
      return matchText && matchKind && matchStatus
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
})

const totals = computed(() => {
  const income = filteredRows.value.filter(e => e.kind === 'income').reduce((s, e) => s + e.amount, 0)
  const expense = filteredRows.value.filter(e => e.kind === 'expense').reduce((s, e) => s + e.amount, 0)
  return { income, expense, net: income - expense }
})

const rowBg = (e: FinanceEntry) => {
  if (e.status === 'paid') return 'var(--success-light)'
  if (e.status === 'review') return 'var(--danger-light)'
  if (e.kind === 'income') return 'var(--primary-light)'
  return 'transparent'
}

const badgeStyle = (status: FinanceEntry['status']) => {
  const map: Record<FinanceEntry['status'], { bg: string; color: string }> = {
    paid: { bg: 'var(--success-light)', color: 'var(--success)' },
    pending: { bg: 'var(--warning-light)', color: 'var(--warning)' },
    review: { bg: 'var(--danger-light)', color: 'var(--danger)' }
  }
  const s = map[status]
  return { background: s.bg, color: s.color, borderRadius: '99px', padding: '2px 10px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }
}

const badgeLabel = (status: FinanceEntry['status'], kind: FinanceEntry['kind']) => {
  if (status === 'paid') return kind === 'income' ? 'Recebido' : 'Pago'
  if (status === 'pending') return 'Pendente'
  return 'Revisar'
}

const openNew = () => {
  const now = new Date().toISOString().slice(0, 10)
  selectedEntry.value = {
    id: `entry-${Math.random().toString(36).slice(2, 9)}`,
    householdId: 'household-main',
    ruleId: null,
    accountId: null,
    categoryId: null,
    title: '',
    description: '',
    amount: 0,
    kind: 'expense',
    dueDate: now,
    competenceDate: now,
    installmentIndex: null,
    installmentTotal: null,
    status: 'pending',
    origin: 'manual',
    metadata: {},
    createdAt: now,
    updatedAt: now
  } as FinanceEntry
  editorOpen.value = true
}

const openEdit = (e: FinanceEntry) => {
  selectedEntry.value = { ...e }
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

const quickPay = async (id: string) => {
  const entry = store.entries.find(e => e.id === id)
  if (!entry) return
  await store.saveEntriesBatch({ upserts: [{ ...entry, status: 'paid' }], deletes: [] })
}
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 160px;
}

.filter-select {
  min-width: 130px;
}

.new-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-xs);
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.table-wrap {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  position: relative;
}

.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.action-btn {
  background: var(--success-light);
  color: var(--success);
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  min-height: 32px;
  touch-action: manipulation;
}

/* Mostrar apenas em mobile (quando colunas estão ocultas) */
.col-show-sm {
  display: none;
}

@media (max-width: 767px) {
  .toolbar {
    gap: 8px;
  }

  .search-box {
    min-width: 0;
    width: 100%;
    flex: none;
  }

  .filter-select {
    flex: 1;
    min-width: 0;
  }

  .new-btn {
    width: 100%;
    justify-content: center;
  }

  /* Oculta colunas: Tipo, Conta em telas pequenas */
  .col-hide-sm {
    display: none;
  }

  /* Mostra badge compacto de tipo inline na coluna Descrição */
  .col-show-sm {
    display: inline-flex;
  }

  .action-btn {
    padding: 8px 12px;
    min-height: 38px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  /* Oculta também a coluna Categoria em telas muito pequenas */
  .col-hide-md {
    display: none;
  }
}
</style>

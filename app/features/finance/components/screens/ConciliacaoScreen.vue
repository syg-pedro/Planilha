<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- Header strip -->
    <div class="summary-strip">
      <div class="summary-kpi">
        <p class="kpi-label">Pendentes de confirmação</p>
        <p class="kpi-value">{{ pendingItems.length }}</p>
      </div>
      <div class="summary-kpi">
        <p class="kpi-label">Valor total pendente</p>
        <p class="kpi-value" style="color: var(--danger)">{{ fmt(pendingTotal) }}</p>
      </div>
      <div class="summary-kpi">
        <p class="kpi-label">Confirmados este mês</p>
        <p class="kpi-value" style="color: var(--success)">{{ paidThisMonth }}</p>
      </div>
      <button
        v-if="pendingItems.length > 0"
        class="confirm-all-btn"
        :disabled="saving"
        @click="confirmAll"
      >
        <BaseIcon name="check" :size="14" color="#fff" />
        Confirmar tudo ({{ pendingItems.length }})
      </button>
    </div>

    <!-- Filter row -->
    <div class="filter-row">
      <select v-model="filterKind" class="filter-select">
        <option value="">Todos os tipos</option>
        <option value="expense">Despesas</option>
        <option value="income">Receitas</option>
      </select>
      <div class="search-box">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text3);flex-shrink:0">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar lançamento..."
          class="search-input"
        />
      </div>
      <span class="count-label">{{ visibleItems.length }} lançamentos</span>
    </div>

    <!-- Empty state -->
    <BaseEmptyState
      v-if="pendingItems.length === 0"
      icon="check"
      title="Tudo em dia!"
      body="Não há lançamentos pendentes de confirmação."
    />

    <!-- Lista de itens -->
    <div v-else class="items-list">
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="item-card"
        :class="{ 'item-overdue': isOverdue(item.dueDate), 'item-income': item.kind === 'income' }"
      >
        <!-- Indicador de cor (borda esquerda) -->
        <div class="item-indicator" :style="{
          background: item.kind === 'income' ? 'var(--success)' : isOverdue(item.dueDate) ? 'var(--danger)' : 'var(--warning)'
        }" />

        <!-- Conteúdo principal -->
        <div class="item-content">
          <!-- Linha 1: título + valor -->
          <div class="item-top">
            <p class="item-title">{{ item.title }}</p>
            <p class="item-amount" :style="{ color: item.kind === 'income' ? 'var(--success)' : 'var(--danger)' }">
              {{ item.kind === 'expense' ? '-' : '+' }}{{ fmt(item.amount) }}
            </p>
          </div>

          <!-- Linha 2: categoria + conta -->
          <div class="item-meta">
            <span v-if="categoryName(item.categoryId)" class="meta-tag">
              {{ categoryName(item.categoryId) }}
            </span>
            <span v-if="accountName(item.accountId) !== '—'" class="meta-tag">
              {{ accountName(item.accountId) }}
            </span>
          </div>

          <!-- Linha 3: data + badge vencida + botão confirmar -->
          <div class="item-bottom">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
              <span class="item-date">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:3px">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {{ fmtDate(item.dueDate) }}
              </span>
              <span v-if="isOverdue(item.dueDate)" class="badge-overdue">Vencida</span>
            </div>
            <button
              class="confirm-btn"
              :disabled="saving"
              @click="confirmOne(item.id)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useDateFormat } from '~/composables/useDateFormat'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store    = useFinanceStore()
const currency = useCurrency()
const { formatDate } = useDateFormat()
const fmt     = (v: number) => currency.format(v)
const fmtDate = (d: string) => formatDate(d)

const search     = ref('')
const filterKind = ref('')
const saving     = ref(false)

const pendingItems = computed(() =>
  store.entries.filter(e => e.status === 'pending' || e.status === 'review')
)

const paidThisMonth = computed(() => {
  const key = new Date().toISOString().slice(0, 7)
  return store.entries.filter(e => e.status === 'paid' && e.dueDate.startsWith(key)).length
})

const pendingTotal = computed(() =>
  pendingItems.value
    .filter(e => e.kind === 'expense')
    .reduce((s, e) => s + e.amount, 0)
)

const visibleItems = computed(() => {
  let list = pendingItems.value
  if (filterKind.value) list = list.filter(e => e.kind === filterKind.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(e => e.title.toLowerCase().includes(q))
  }
  return [...list].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
})

const isOverdue   = (d: string) => d < new Date().toISOString().slice(0, 10)
const categoryName = (id: string | null) => id ? (store.categoryMap.get(id)?.name ?? '') : ''
const accountName  = (id: string | null) => id ? (store.accountMap.get(id)?.name ?? '—') : '—'

const confirmOne = async (id: string) => {
  saving.value = true
  try {
    await store.saveEntriesBatch({ upserts: [{ id, status: 'paid' }], deletes: [] })
  } finally {
    saving.value = false
  }
}

const confirmAll = async () => {
  saving.value = true
  try {
    await store.saveEntriesBatch({
      upserts: pendingItems.value.map(e => ({ id: e.id, status: 'paid' as const })),
      deletes: []
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* ── Summary strip ───────────────────────────────────────── */
.summary-strip {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 16px 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  box-shadow: var(--shadow-sm);
}
.summary-kpi { flex: 1; min-width: 120px; }
.kpi-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}
.kpi-value {
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
  margin-top: 2px;
}
.confirm-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 18px;
  font-size: 13px;
  font-weight: 700;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--success);
  color: #fff;
  cursor: pointer;
  touch-action: manipulation;
  white-space: nowrap;
  transition: filter 0.12s;
}
.confirm-all-btn:hover { filter: brightness(1.08); }
.confirm-all-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Filter row ──────────────────────────────────────────── */
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.filter-select {
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 0 10px;
  height: 40px;
  font-size: 13px;
  color: var(--text);
  font-family: inherit;
  outline: none;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-appearance: none;
  appearance: none;
  padding-right: 28px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  background-size: 16px;
}
.search-box {
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 0 12px;
  height: 40px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-box:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-dim);
}
.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--text);
  font-family: inherit;
}
.count-label {
  font-size: 12px;
  color: var(--text3);
  white-space: nowrap;
}

/* ── Lista de itens ──────────────────────────────────────── */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card {
  display: flex;
  background: var(--surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: opacity 0.15s;
}
.item-overdue {
  border-color: color-mix(in srgb, var(--danger) 30%, var(--border));
  background: color-mix(in srgb, var(--danger) 3%, var(--surface));
}
.item-income {
  border-color: color-mix(in srgb, var(--success) 25%, var(--border));
}

/* Borda colorida esquerda */
.item-indicator {
  width: 4px;
  flex-shrink: 0;
}

/* Área de conteúdo */
.item-content {
  flex: 1;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

/* Linha 1: título + valor */
.item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.item-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.item-amount {
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Linha 2: tags meta */
.item-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.meta-tag {
  font-size: 11px;
  color: var(--text3);
  background: var(--surface2);
  border-radius: 4px;
  padding: 1px 7px;
  font-weight: 600;
}

/* Linha 3: data + botão */
.item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
}
.item-date {
  font-size: 12px;
  color: var(--text2);
  font-weight: 600;
  white-space: nowrap;
}
.badge-overdue {
  font-size: 10px;
  font-weight: 700;
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 14%, transparent);
  border-radius: 99px;
  padding: 2px 7px;
  white-space: nowrap;
}
.confirm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 700;
  border-radius: var(--radius-xs);
  border: none;
  background: var(--success);
  color: #fff;
  cursor: pointer;
  touch-action: manipulation;
  white-space: nowrap;
  min-height: 34px;
  font-family: inherit;
  flex-shrink: 0;
  transition: filter 0.12s;
}
.confirm-btn:hover { filter: brightness(1.08); }
.confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Mobile ──────────────────────────────────────────────── */
@media (max-width: 640px) {
  .summary-strip {
    padding: 14px 14px;
    gap: 10px;
  }
  .kpi-value { font-size: 18px; }
  .confirm-all-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
    font-size: 14px;
  }
  .filter-row {
    gap: 6px;
  }
  .filter-select {
    flex: 1;
  }
  .search-box {
    order: -1;
    width: 100%;
    flex: none;
    min-width: 0;
  }
  .count-label {
    width: 100%;
    text-align: right;
    order: 1;
  }
  .item-content { padding: 10px 12px; }
  .item-title { font-size: 14px; }
  .item-amount { font-size: 15px; }
}
</style>

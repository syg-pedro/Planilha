<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- Header strip -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 14px 18px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
      <div style="flex: 1; min-width: 180px">
        <p style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Pendentes de confirmação</p>
        <p style="font-size: 22px; font-weight: 800; color: var(--text); margin-top: 2px">{{ pendingItems.length }}</p>
      </div>
      <div style="flex: 1; min-width: 140px">
        <p style="font-size: 11px; color: var(--text3)">Valor total pendente</p>
        <p style="font-size: 18px; font-weight: 700; color: var(--danger)">{{ fmt(pendingTotal) }}</p>
      </div>
      <div style="flex: 1; min-width: 140px">
        <p style="font-size: 11px; color: var(--text3)">Confirmados este mês</p>
        <p style="font-size: 18px; font-weight: 700; color: var(--success)">{{ paidThisMonth }}</p>
      </div>
      <button
        v-if="pendingItems.length > 0"
        :disabled="saving"
        style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--success); color: #fff"
        @click="confirmAll"
      >
        <BaseIcon name="check" :size="14" color="#fff" />
        Confirmar tudo ({{ pendingItems.length }})
      </button>
    </div>

    <!-- Filter row -->
    <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
      <select
        v-model="filterKind"
        style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 34px; font-size: 12px; color: var(--text); font-family: inherit; outline: none"
      >
        <option value="">Todos os tipos</option>
        <option value="expense">Despesas</option>
        <option value="income">Receitas</option>
      </select>
      <input
        v-model="search"
        placeholder="Buscar lançamento..."
        style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 34px; font-size: 12px; color: var(--text); font-family: inherit; outline: none; min-width: 200px"
      />
      <span style="font-size: 12px; color: var(--text3); margin-left: 4px">{{ visibleItems.length }} lançamentos</span>
    </div>

    <!-- Empty state -->
    <BaseEmptyState v-if="pendingItems.length === 0" icon="check" title="Tudo em dia!" body="Não há lançamentos pendentes de confirmação." />

    <!-- Reconcile table -->
    <div v-else style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px">
        <thead>
          <tr style="background: var(--surface2); border-bottom: 1px solid var(--border)">
            <th style="width: 36px; padding: 10px 14px"></th>
            <th style="text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Descrição</th>
            <th style="text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap">Vencimento</th>
            <th style="text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Conta</th>
            <th style="text-align: right; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Valor</th>
            <th style="text-align: center; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Ação</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in visibleItems"
            :key="item.id"
            :style="{
              borderBottom: '1px solid var(--border)',
              background: isOverdue(item.dueDate) ? 'color-mix(in srgb, var(--danger) 4%, transparent)' : 'transparent',
              opacity: saving ? 0.6 : 1,
              transition: 'opacity 0.2s'
            }"
          >
            <td style="padding: 10px 14px">
              <div :style="{
                width: '10px', height: '10px', borderRadius: '50%',
                background: item.kind === 'income' ? 'var(--success)' : isOverdue(item.dueDate) ? 'var(--danger)' : 'var(--warning)'
              }" />
            </td>
            <td style="padding: 10px 14px">
              <p style="font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px">{{ item.title }}</p>
              <p v-if="categoryName(item.categoryId)" style="font-size: 11px; color: var(--text3)">{{ categoryName(item.categoryId) }}</p>
            </td>
            <td style="padding: 10px 14px; white-space: nowrap">
              <span style="font-size: 12px; color: var(--text2)">{{ fmtDate(item.dueDate) }}</span>
              <span v-if="isOverdue(item.dueDate)" style="margin-left: 6px; font-size: 10px; font-weight: 700; color: var(--danger); background: color-mix(in srgb, var(--danger) 12%, transparent); padding: 1px 6px; border-radius: 99px">Vencida</span>
            </td>
            <td style="padding: 10px 14px; font-size: 12px; color: var(--text2)">{{ accountName(item.accountId) }}</td>
            <td style="padding: 10px 14px; text-align: right; font-weight: 700; white-space: nowrap" :style="{ color: item.kind === 'income' ? 'var(--success)' : 'var(--danger)' }">
              {{ item.kind === 'expense' ? '-' : '+' }}{{ fmt(item.amount) }}
            </td>
            <td style="padding: 10px 14px; text-align: center">
              <button
                :disabled="saving"
                style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-xs); cursor: pointer; border: none; background: var(--success); color: #fff"
                @click="confirmOne(item.id)"
              >
                <BaseIcon name="check" :size="12" color="#fff" />
                Confirmar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useDateFormat } from '~/composables/useDateFormat'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store   = useFinanceStore()
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

const isOverdue = (dueDate: string) => dueDate < new Date().toISOString().slice(0, 10)

const categoryName = (id: string | null) =>
  id ? (store.categoryMap.get(id)?.name ?? '') : ''

const accountName = (id: string | null) =>
  id ? (store.accountMap.get(id)?.name ?? '—') : '—'

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

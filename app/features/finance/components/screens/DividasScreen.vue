<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- KPIs -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px">
      <BaseKpiCard icon="debt"     label="Saldo devedor total"  :value="fmt(summary.totalPending)"    color="var(--danger)"  :sub="`${debtGroups.length} compromisso(s)`" />
      <BaseKpiCard icon="calendar" label="Parcelas este mês"    :value="fmt(summary.thisMonth)"        color="var(--warning)" sub="Vencimento mês atual" />
      <BaseKpiCard icon="check"    label="Parcelas pagas"       :value="`${summary.paidCount}/${summary.totalCount}`" color="var(--success)" sub="Total de parcelas" />
      <BaseKpiCard icon="expense"  label="Total parcelado"      :value="fmt(summary.totalAmount)"      color="var(--primary)" sub="Valor original" />
    </div>

    <!-- Empty state -->
    <BaseEmptyState v-if="debtGroups.length === 0" icon="debt" title="Nenhuma dívida ou parcela" body="Não há lançamentos parcelados no sistema. Lançamentos com mais de 1 parcela aparecem aqui automaticamente." />

    <!-- Debt cards -->
    <div
      v-for="group in debtGroups"
      :key="group.key"
      class="debt-group"
      style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden"
    >
      <!-- Header -->
      <div style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; gap: 12px">
        <button
          style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; background: none; border: none; cursor: pointer; text-align: left; padding: 0"
          @click="toggleGroup(group.key)"
        >
          <div style="flex: 1; min-width: 0">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap">
              <p style="font-size: 14px; font-weight: 700; color: var(--text)">{{ group.title }}</p>
              <span style="font-size: 11px; font-weight: 700; color: var(--primary); background: var(--primary-dim); padding: 2px 8px; border-radius: 99px">
                {{ group.paidCount }}/{{ group.totalCount }} parcelas
              </span>
              <span v-if="group.paidCount === group.totalCount" style="font-size: 11px; font-weight: 700; color: var(--success); background: color-mix(in srgb, var(--success) 12%, transparent); padding: 2px 8px; border-radius: 99px">
                Quitado
              </span>
            </div>
            <div style="display: flex; gap: 16px; margin-top: 4px; flex-wrap: wrap">
              <span style="font-size: 12px; color: var(--text3)">Conta: {{ group.accountName }}</span>
              <span style="font-size: 12px; color: var(--text3)">Categoria: {{ group.catName }}</span>
              <span style="font-size: 12px; font-weight: 600" :style="{ color: group.pendingAmount > 0 ? 'var(--danger)' : 'var(--success)' }">
                Restante: {{ fmt(group.pendingAmount) }}
              </span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 14px; flex-shrink: 0">
            <div style="text-align: right">
              <p style="font-size: 15px; font-weight: 800; color: var(--danger)">{{ fmt(group.pendingAmount) }}</p>
              <p style="font-size: 11px; color: var(--text3)">de {{ fmt(group.totalAmount) }}</p>
            </div>
            <BaseIcon
              name="chevron_down"
              :size="16"
              :style="{ transform: expandedGroups.includes(group.key) ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', color: 'var(--text3)' }"
            />
          </div>
        </button>

        <!-- Botão editar conta -->
        <button
          v-if="group.accountId"
          class="icon-btn"
          title="Editar conta/cartão"
          @click.stop="openAccountEditor(group.accountId)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      <!-- Progress bar -->
      <div style="padding: 0 18px 10px">
        <div style="height: 6px; background: var(--bg2); border-radius: 99px; overflow: hidden">
          <div
            :style="{
              width: `${(group.paidCount / group.totalCount) * 100}%`,
              height: '100%',
              borderRadius: '99px',
              background: group.paidCount === group.totalCount ? 'var(--success)' : 'var(--primary)',
              transition: 'width 0.6s'
            }"
          />
        </div>
      </div>

      <!-- Expanded installments -->
      <div v-if="expandedGroups.includes(group.key)" style="border-top: 1px solid var(--border)">
        <div
          v-for="entry in group.entries"
          :key="entry.id"
          class="debt-installment"
          :style="entry.status === 'paid' ? { opacity: 0.55 } : {}"
        >
          <div class="debt-installment__identity">
            <div
              :style="{
                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                background: entry.status === 'paid' ? 'var(--success)' : isOverdue(entry.dueDate) ? 'var(--danger)' : 'var(--warning)'
              }"
            />
            <div class="debt-installment__details">
              <span style="font-size: 12px; color: var(--text3); white-space: nowrap">
                Parcela {{ entry.installmentIndex }}/{{ entry.installmentTotal }}
              </span>
              <span style="font-size: 12px; color: var(--text2); white-space: nowrap">{{ fmtDate(entry.dueDate) }}</span>
            </div>
          </div>
          <span class="debt-installment__amount" style="font-size: 12px; font-weight: 700" :style="{ color: entry.status === 'paid' ? 'var(--success)' : 'var(--danger)' }">
            {{ fmt(entry.amount) }}
          </span>
          <span
            class="debt-installment__status"
            :style="{
              fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
              background: entry.status === 'paid'
                ? 'color-mix(in srgb, var(--success) 12%, transparent)'
                : isOverdue(entry.dueDate)
                  ? 'color-mix(in srgb, var(--danger) 12%, transparent)'
                  : 'color-mix(in srgb, var(--warning) 12%, transparent)',
              color: entry.status === 'paid' ? 'var(--success)' : isOverdue(entry.dueDate) ? 'var(--danger)' : 'var(--warning)'
            }"
          >
            {{ entry.status === 'paid' ? (entry.kind === 'income' ? 'Recebido' : 'Pago') : isOverdue(entry.dueDate) ? 'Vencida' : 'Pendente' }}
          </span>

          <!-- Ações -->
          <div class="debt-installment__actions" data-testid="debt-installment-actions">
            <button
              v-if="entry.status !== 'paid'"
              class="action-btn action-pay"
              @click="quickPay(entry.id)"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ entry.kind === 'income' ? 'Receber' : 'Pagar' }}
            </button>
            <button
              class="action-btn action-edit"
              @click="openEditor(entry)"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor de parcela -->
    <FinanceEntryEditorModal
      :open="editorOpen"
      :entry="selectedEntry"
      :accounts="store.accounts"
      :categories="store.categories"
      @close="closeEditor"
      @save="saveEntry"
      @delete="deleteEntry"
    />

    <!-- Editor de conta/cartão -->
    <AccountEditorSheet
      :open="accountSheetOpen"
      :account="selectedAccount"
      @close="accountSheetOpen = false"
      @save="saveAccount"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useDateFormat } from '~/composables/useDateFormat'
import BaseKpiCard           from '~/components/base/BaseKpiCard.vue'
import BaseIcon              from '~/components/base/BaseIcon.vue'
import BaseEmptyState        from '~/components/base/BaseEmptyState.vue'
import FinanceEntryEditorModal from '~/features/finance/components/FinanceEntryEditorModal.vue'
import AccountEditorSheet      from '~/features/finance/components/AccountEditorSheet.vue'
import type { Account, FinanceEntry } from '#shared/types'

const store    = useFinanceStore()
const currency = useCurrency()
const { formatDate } = useDateFormat()
const fmt      = (v: number) => currency.format(v)
const fmtDate  = (d: string) => formatDate(d)

// ─── expand/collapse ─────────────────────────────────────────────────────────

const expandedGroups = ref<string[]>([])
const toggleGroup    = (key: string) => {
  const idx = expandedGroups.value.indexOf(key)
  if (idx >= 0) expandedGroups.value.splice(idx, 1)
  else expandedGroups.value.push(key)
}
const isOverdue = (dueDate: string) => dueDate < new Date().toISOString().slice(0, 10)

// ─── entry editor ────────────────────────────────────────────────────────────

const editorOpen    = ref(false)
const selectedEntry = ref<FinanceEntry | null>(null)

const openEditor  = (entry: FinanceEntry) => { selectedEntry.value = { ...entry }; editorOpen.value = true }
const closeEditor = () => { editorOpen.value = false; selectedEntry.value = null }

const saveEntry = async (entries: Partial<FinanceEntry>[]) => {
  await store.saveEntriesBatch({ upserts: entries, deletes: [] })
  closeEditor()
}

const deleteEntry = async (id: string) => {
  await store.saveEntriesBatch({ upserts: [], deletes: [id] })
  closeEditor()
}

const quickPay = async (id: string) => {
  const entry = store.entries.find(e => e.id === id)
  if (!entry) return
  await store.saveEntriesBatch({ upserts: [{ ...entry, status: 'paid' }], deletes: [] })
}

// ─── account editor ──────────────────────────────────────────────────────────

const accountSheetOpen  = ref(false)
const selectedAccount   = ref<Account | null>(null)

const openAccountEditor = (accountId: string) => {
  selectedAccount.value = store.accountMap.get(accountId) ?? null
  if (selectedAccount.value) accountSheetOpen.value = true
}

const saveAccount = async (account: Partial<Account>) => {
  await store.saveAccount(account)
  accountSheetOpen.value = false
  selectedAccount.value  = null
}

// ─── groups ──────────────────────────────────────────────────────────────────

const debtGroups = computed(() => {
  const installmentEntries = store.entries.filter(
    e => e.installmentTotal != null && e.installmentTotal > 1
  )
  const groupMap = new Map<string, typeof installmentEntries>()
  for (const entry of installmentEntries) {
    const key = entry.ruleId ?? `title:${entry.title}`
    const existing = groupMap.get(key) ?? []
    existing.push(entry)
    groupMap.set(key, existing)
  }

  return [...groupMap.entries()]
    .map(([key, entries]) => {
      const sorted        = [...entries].sort((a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0))
      const first         = sorted[0]!
      const paidCount     = sorted.filter(e => e.status === 'paid').length
      const totalCount    = sorted.length
      const totalAmount   = sorted.reduce((s, e) => s + e.amount, 0)
      const pendingAmount = sorted.filter(e => e.status !== 'paid').reduce((s, e) => s + e.amount, 0)
      const cat           = first.categoryId ? store.categoryMap.get(first.categoryId) : null
      const acc           = first.accountId  ? store.accountMap.get(first.accountId)  : null
      return {
        key,
        title:         first.title,
        catName:       cat?.name  ?? '—',
        accountName:   acc?.name  ?? '—',
        accountId:     first.accountId ?? null,
        entries:       sorted,
        paidCount,
        totalCount,
        totalAmount,
        pendingAmount
      }
    })
    .filter(g => g.pendingAmount > 0 || g.paidCount < g.totalCount)
    .sort((a, b) => b.pendingAmount - a.pendingAmount)
})

const summary = computed(() => {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const allGroups    = debtGroups.value
  return {
    totalPending:  allGroups.reduce((s, g) => s + g.pendingAmount, 0),
    totalAmount:   allGroups.reduce((s, g) => s + g.totalAmount, 0),
    paidCount:     allGroups.reduce((s, g) => s + g.paidCount, 0),
    totalCount:    allGroups.reduce((s, g) => s + g.totalCount, 0),
    thisMonth:     allGroups.flatMap(g => g.entries)
      .filter(e => e.status !== 'paid' && e.dueDate.startsWith(currentMonth))
      .reduce((s, e) => s + e.amount, 0)
  }
})
</script>

<style scoped>
.icon-btn {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text3);
  flex-shrink: 0;
  touch-action: manipulation;
  transition: background 0.12s, color 0.12s;
}
.icon-btn:hover {
  background: var(--primary-dim);
  color: var(--primary);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  border-radius: 6px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  font-family: inherit;
  min-height: 28px;
  touch-action: manipulation;
  white-space: nowrap;
}
.debt-installment {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--border);
}
.debt-installment__identity,
.debt-installment__details,
.debt-installment__actions {
  display: flex;
  align-items: center;
}
.debt-installment__identity {
  min-width: 0;
  gap: 10px;
}
.debt-installment__details {
  min-width: 0;
  gap: 14px;
  flex-wrap: wrap;
}
.debt-installment__amount,
.debt-installment__status {
  white-space: nowrap;
}
.debt-installment__actions {
  gap: 6px;
  flex-shrink: 0;
}
.action-pay {
  background: color-mix(in srgb, var(--success) 12%, transparent);
  color: var(--success);
}
.action-pay:hover {
  background: color-mix(in srgb, var(--success) 20%, transparent);
}
.action-edit {
  background: var(--surface2);
  color: var(--text2);
  border: 1px solid var(--border);
}
.action-edit:hover {
  background: var(--primary-dim);
  color: var(--primary);
  border-color: var(--primary);
}
@media (max-width: 600px) {
  .debt-installment {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    padding: 12px;
  }
  .debt-installment__identity { grid-column: 1; }
  .debt-installment__amount { grid-column: 2; }
  .debt-installment__status { grid-column: 1; justify-self: start; }
  .debt-installment__actions {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }
  .debt-installment__actions .action-btn {
    min-width: 0;
    justify-content: center;
  }
  .debt-installment__actions .action-btn:only-child { grid-column: 1 / -1; }
}
</style>

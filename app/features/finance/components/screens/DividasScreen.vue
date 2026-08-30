<template>
  <div class="debts">

    <!-- KPIs -->
    <div class="debts__kpis">
      <BaseKpiCard icon="debt"     label="Saldo devedor total"  :value="fmt(summary.totalPending)"    color="var(--danger)"  :sub="`${debtGroups.length} compromisso(s)`" />
      <BaseKpiCard icon="calendar" label="Parcelas este mês"    :value="fmt(summary.thisMonth)"        color="var(--warning)" sub="Vencimento mês atual" />
      <BaseKpiCard icon="check"    label="Parcelas pagas"       :value="`${summary.paidCount}/${summary.totalCount}`" color="var(--success)" sub="Total de parcelas" />
      <BaseKpiCard icon="expense"  label="Total parcelado"      :value="fmt(summary.totalAmount)"      color="var(--primary)" sub="Valor original" />
    </div>

    <!-- Empty state -->
    <BaseEmptyState v-if="debtGroups.length === 0" icon="debt" title="Nenhuma dívida ou parcela" body="Não há lançamentos parcelados no sistema. Lançamentos com mais de 1 parcela aparecem aqui automaticamente." />

    <!-- Debt cards -->
    <div v-else class="debts__grid">
      <article
        v-for="group in debtGroups"
        :key="group.key"
        class="debt-group"
      >
        <!-- Header -->
        <header class="neo-panel-header debts__head">
          <button class="debts__toggle" type="button" @click="toggleGroup(group.key)">
            <span class="debts__name">{{ group.title }}</span>
            <span v-if="group.paidCount === group.totalCount" class="debts__badge">Quitado</span>
            <span class="debts__progress ds-money">{{ group.paidCount }}/{{ group.totalCount }}</span>
            <BaseIcon
              name="chevron_down"
              :size="14"
              :style="{ transform: expandedGroups.includes(group.key) ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', color: 'var(--text3)', flexShrink: 0 }"
            />
          </button>

          <!-- Botão editar conta -->
          <button
            v-if="group.accountId"
            class="icon-btn"
            title="Editar conta/cartão"
            @click.stop="openAccountEditor(group.accountId)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </header>

        <!-- Body -->
        <div class="debts__body">
          <div class="debts__track">
            <div
              class="debts__fill"
              :style="{
                width: `${(group.paidCount / group.totalCount) * 100}%`,
                background: group.paidCount === group.totalCount ? 'var(--success)' : 'var(--primary)'
              }"
            />
          </div>
          <p class="debts__line">
            Parcela: <span class="debts__line-value ds-money">{{ fmt(group.installmentAmount) }}</span>
          </p>
          <p class="debts__line">
            Restante: <span class="debts__line-value debts__line-value--danger ds-money">{{ fmt(group.pendingAmount) }}</span>
          </p>
          <p class="debts__meta">{{ group.accountName }} · {{ group.catName }}</p>
        </div>

        <!-- Expanded installments -->
        <div v-if="expandedGroups.includes(group.key)" class="debts__installments">
          <div
            v-for="entry in group.entries"
            :key="entry.id"
            class="debt-installment"
            :style="entry.status === 'paid' ? { opacity: 0.55 } : {}"
          >
            <div class="debt-installment__identity">
              <div
                class="debt-installment__dot"
                :style="{
                  background: entry.status === 'paid' ? 'var(--success)' : isOverdue(entry.dueDate) ? 'var(--danger)' : 'var(--warning)'
                }"
              />
              <div class="debt-installment__details">
                <span class="debt-installment__label">
                  Parcela {{ entry.installmentIndex }}/{{ entry.installmentTotal }}
                </span>
                <span class="debt-installment__date">{{ fmtDate(entry.dueDate) }}</span>
              </div>
            </div>
            <span
              class="debt-installment__amount ds-money"
              :style="{ color: entry.status === 'paid' ? 'var(--success)' : 'var(--danger)' }"
            >
              {{ fmt(entry.amount) }}
            </span>
            <span
              class="debt-installment__status"
              :style="{
                background: entry.status === 'paid'
                  ? 'var(--success-light)'
                  : isOverdue(entry.dueDate)
                    ? 'var(--danger-light)'
                    : 'var(--warning-light)',
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
      </article>
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
        pendingAmount,
        installmentAmount: totalCount > 0 ? totalAmount / totalCount : 0
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
.debts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.debts__kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.debts__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: start;
}

.debt-group {
  overflow: hidden;
  min-width: 0;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

/* ── Cabeçalho ───────────────────────────────────────────── */
.debts__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 16px;
}

.debts__toggle {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.debts__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.debts__badge {
  flex-shrink: 0;
  padding: 1px 8px;
  background: var(--success-light);
  border-radius: var(--radius-pill);
  color: var(--success);
  font-size: 9.5px;
  font-weight: 800;
  white-space: nowrap;
}

.debts__progress {
  flex-shrink: 0;
  color: var(--text3);
  font-size: 11.5px;
  font-weight: 700;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background: var(--surface);
  color: var(--text3);
  cursor: pointer;
  touch-action: manipulation;
}

.icon-btn:hover {
  background: var(--primary-dim);
  color: var(--primary);
}

/* ── Corpo ───────────────────────────────────────────────── */
.debts__body {
  padding: 16px;
}

.debts__track {
  overflow: hidden;
  height: 9px;
  margin-bottom: 11px;
  background: var(--track);
  border: 1px solid var(--track);
  border-radius: var(--radius-pill);
}

.debts__fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition: width 0.45s steps(8, end);
}

.debts__line {
  color: var(--text3);
  font-size: 11px;
}

.debts__line + .debts__line {
  margin-top: 4px;
}

.debts__line-value {
  color: var(--text);
  font-weight: 700;
}

.debts__line-value--danger {
  color: var(--danger);
}

.debts__meta {
  overflow: hidden;
  margin-top: 8px;
  color: var(--text3);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Parcelas expandidas ─────────────────────────────────── */
.debts__installments {
  border-top: var(--border-width) solid var(--border);
}

.debt-installment {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
}

.debt-installment:last-child {
  border-bottom: none;
}

.debt-installment__identity {
  display: flex;
  grid-column: 1;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.debt-installment__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
}

.debt-installment__details {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.debt-installment__label {
  color: var(--text3);
  font-size: 11px;
  white-space: nowrap;
}

.debt-installment__date {
  color: var(--text2);
  font-size: 11px;
  white-space: nowrap;
}

.debt-installment__amount {
  grid-column: 2;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.debt-installment__status {
  grid-column: 1;
  justify-self: start;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 9.5px;
  font-weight: 800;
  white-space: nowrap;
}

.debt-installment__actions {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
}

.action-btn {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 28px;
  padding: 5px 10px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  touch-action: manipulation;
  white-space: nowrap;
}

.debt-installment__actions .action-btn:only-child {
  grid-column: 1 / -1;
}

.action-pay {
  background: var(--success-light);
  color: var(--success);
}

.action-pay:hover {
  background: color-mix(in srgb, var(--success) 22%, transparent);
}

.action-edit {
  background: var(--surface2);
  color: var(--text2);
}

.action-edit:hover {
  background: var(--primary-dim);
  color: var(--primary);
}

/* ── Responsivo ──────────────────────────────────────────── */
@media (max-width: 1180px) {
  .debts__kpis {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1100px) {
  .debts__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .debts__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .debts__kpis {
    gap: 8px;
  }

  .debts__body {
    padding: 14px;
  }

  .debt-installment {
    padding: 12px;
  }
}
</style>

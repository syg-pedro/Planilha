<template>
  <div style="display: flex; flex-direction: column; gap: 20px">

    <!-- Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px">
      <div>
        <h2 style="font-size: 18px; font-weight: 800; color: var(--text)">Cartões e Contas</h2>
        <p style="font-size: 13px; color: var(--text3); margin-top: 2px">{{ store.accounts.filter(a => a.active !== false).length }} conta(s) ativa(s)</p>
      </div>
      <button class="add-btn" @click="openNew">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Nova conta
      </button>
    </div>

    <!-- KPI strip -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px">
      <div class="kpi-card">
        <span class="kpi-label">Limite total</span>
        <span class="kpi-value" style="color: var(--primary)">{{ fmt(totalLimit) }}</span>
        <span class="kpi-sub">{{ creditCards.length }} cartão(ões)</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Uso pendente</span>
        <span class="kpi-value" style="color: var(--danger)">{{ fmt(totalPending) }}</span>
        <span class="kpi-sub">Faturas em aberto</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Disponível</span>
        <span class="kpi-value" style="color: var(--success)">{{ fmt(Math.max(0, totalLimit - totalPending)) }}</span>
        <span class="kpi-sub">Crédito livre</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Contas bancárias</span>
        <span class="kpi-value" style="color: var(--text)">{{ bankAccounts.length }}</span>
        <span class="kpi-sub">Banco / VR / Outros</span>
      </div>
    </div>

    <!-- ── Cartões de crédito ─────────────────────────────────────────── -->
    <div v-if="creditCards.length > 0">
      <p class="section-label">Cartões de crédito</p>
      <div class="cards-grid">
        <div
          v-for="card in creditCards"
          :key="card.id"
          class="credit-card-wrap"
        >
          <!-- Visual card -->
          <div class="credit-card" :style="cardGradient(card.id)">
            <div style="display: flex; align-items: flex-start; justify-content: space-between">
              <p style="font-size: 13px; font-weight: 800; color: rgba(255,255,255,0.95); letter-spacing: 0.02em">{{ card.name }}</p>
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none" style="opacity:0.7">
                <circle cx="10" cy="10" r="9" fill="rgba(255,255,255,0.6)" />
                <circle cx="18" cy="10" r="9" fill="rgba(255,255,255,0.35)" />
              </svg>
            </div>
            <div style="margin-top: 10px">
              <p style="font-size: 11px; color: rgba(255,255,255,0.65); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em">Titular</p>
              <p style="font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9)">{{ card.owner || '—' }}</p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px">
              <div>
                <p style="font-size: 10px; color: rgba(255,255,255,0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em">Limite</p>
                <p style="font-size: 16px; font-weight: 800; color: #fff">{{ card.limitTotal ? fmt(card.limitTotal) : 'Sem limite' }}</p>
              </div>
              <div style="text-align: right">
                <p v-if="card.closingDay" style="font-size: 10px; color: rgba(255,255,255,0.6)">Fecha dia {{ card.closingDay }}</p>
                <p v-if="card.dueDay" style="font-size: 10px; color: rgba(255,255,255,0.6)">Vence dia {{ card.dueDay }}</p>
              </div>
            </div>
          </div>

          <!-- Stats below card -->
          <div class="card-stats">
            <!-- Usage bar -->
            <div v-if="card.limitTotal">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px">
                <span style="font-size: 11px; color: var(--text3); font-weight: 600">Uso pendente</span>
                <span style="font-size: 11px; font-weight: 700" :style="{ color: usagePercent(card) > 80 ? 'var(--danger)' : usagePercent(card) > 50 ? 'var(--warning)' : 'var(--success)' }">
                  {{ usagePercent(card).toFixed(0) }}%
                </span>
              </div>
              <div style="height: 6px; background: var(--bg2, var(--surface2)); border-radius: 99px; overflow: hidden">
                <div
                  :style="{
                    width: `${Math.min(100, usagePercent(card))}%`,
                    height: '100%',
                    borderRadius: '99px',
                    background: usagePercent(card) > 80 ? 'var(--danger)' : usagePercent(card) > 50 ? 'var(--warning)' : 'var(--success)',
                    transition: 'width 0.5s'
                  }"
                />
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 5px">
                <span style="font-size: 11px; color: var(--text3)">{{ fmt(pendingForCard(card.id)) }} usado</span>
                <span style="font-size: 11px; color: var(--text2); font-weight: 600">{{ fmt(Math.max(0, card.limitTotal - pendingForCard(card.id))) }} livre</span>
              </div>
            </div>
            <div v-else style="font-size: 12px; color: var(--text3); padding: 4px 0">Sem limite cadastrado</div>

            <!-- Pending count -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border)">
              <span style="font-size: 12px; color: var(--text3)">
                {{ pendingCountForCard(card.id) }} lançamento(s) pendente(s)
              </span>
              <button class="edit-btn" @click="openEdit(card)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Outras contas ──────────────────────────────────────────────── -->
    <div v-if="bankAccounts.length > 0">
      <p class="section-label">Outras contas</p>
      <div class="neo-panel">
        <div
          v-for="(acc, idx) in bankAccounts"
          :key="acc.id"
          :style="{
            display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
            borderBottom: idx < bankAccounts.length - 1 ? '1px solid var(--border)' : 'none'
          }"
        >
          <div
            :style="{
              width: '40px', height: '40px', borderRadius: '10px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: typeColor(acc.type) + '20'
            }"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="typeColor(acc.type)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path :d="typeIcon(acc.type)" />
            </svg>
          </div>
          <div style="flex: 1; min-width: 0">
            <p style="font-size: 14px; font-weight: 700; color: var(--text)">{{ acc.name }}</p>
            <p style="font-size: 12px; color: var(--text3)">{{ typeLabel(acc.type) }}{{ acc.owner ? ` · ${acc.owner}` : '' }}</p>
          </div>
          <span
            :style="{
              fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px',
              background: typeColor(acc.type) + '18', color: typeColor(acc.type)
            }"
          >{{ typeLabel(acc.type) }}</span>
          <button class="edit-btn" @click="openEdit(acc)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Editar
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <BaseEmptyState
      v-if="store.accounts.length === 0"
      icon="card"
      title="Nenhuma conta cadastrada"
      body="Adicione um cartão ou conta bancária para começar."
    />

    <!-- Editor sheet -->
    <AccountEditorSheet
      :open="sheetOpen"
      :account="selectedAccount"
      @close="sheetOpen = false"
      @save="onSave"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import AccountEditorSheet from '~/features/finance/components/AccountEditorSheet.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'
import type { Account } from '#shared/types'

const store = useFinanceStore()
const currency = useCurrency()
const fmt = (v: number) => currency.format(v)

// ─── account groups ──────────────────────────────────────────────────────────

const creditCards  = computed(() => store.accounts.filter(a => a.type === 'credit_card' && a.active !== false))
const bankAccounts = computed(() => store.accounts.filter(a => a.type !== 'credit_card' && a.active !== false))

// ─── pending calculations ────────────────────────────────────────────────────

const pendingForCard = (accountId: string) =>
  store.entries
    .filter(e => e.accountId === accountId && e.kind === 'expense' && e.status !== 'paid')
    .reduce((s, e) => s + e.amount, 0)

const pendingCountForCard = (accountId: string) =>
  store.entries.filter(e => e.accountId === accountId && e.kind === 'expense' && e.status !== 'paid').length

const usagePercent = (card: Account) =>
  card.limitTotal && card.limitTotal > 0
    ? (pendingForCard(card.id) / card.limitTotal) * 100
    : 0

const totalLimit   = computed(() => creditCards.value.reduce((s, c) => s + (c.limitTotal ?? 0), 0))
const totalPending = computed(() => creditCards.value.reduce((s, c) => s + pendingForCard(c.id), 0))

// ─── card color (deterministic per id) ──────────────────────────────────────

const CARD_COLORS = [
  '#5b5bf7',
  '#e84545',
  '#13a86b',
  '#8b5cf6',
  '#263238',
  '#c66a00',
]

const cardGradient = (id: string) => {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return { background: CARD_COLORS[hash % CARD_COLORS.length] }
}

// ─── type helpers ────────────────────────────────────────────────────────────

const typeLabel = (type: Account['type']) =>
  ({ bank: 'Banco', credit_card: 'Cartão', benefit: 'Benefício', external: 'Externo' })[type] ?? type

const typeColor = (type: Account['type']) =>
  ({ bank: 'var(--primary)', credit_card: 'var(--danger)', benefit: 'var(--success)', external: 'var(--warning)' })[type] ?? 'var(--text3)'

const typeIcon = (type: Account['type']) => {
  if (type === 'credit_card') return 'M1 4h22v16H1zM1 10h22'
  if (type === 'benefit')     return 'M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 18l-6.1 3 1.2-6.8L2 9.3l6.9-1z'
  if (type === 'external')    return 'M22 12h-4l-3 9L9 3l-3 9H2'
  return 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'
}

// ─── editor ──────────────────────────────────────────────────────────────────

const sheetOpen      = ref(false)
const selectedAccount = ref<Account | null>(null)

const openEdit = (acc: Account) => {
  selectedAccount.value = { ...acc }
  sheetOpen.value = true
}

const openNew = () => {
  selectedAccount.value = {
    id:          crypto.randomUUID(),
    householdId: store.accounts[0]?.householdId ?? 'household-main',
    name:        '',
    owner:       '',
    type:        'credit_card',
    limitTotal:  null,
    closingDay:  null,
    dueDay:      null,
    active:      true,
  }
  sheetOpen.value = true
}

const onSave = async (account: Partial<Account>) => {
  await store.saveAccount(account)
  sheetOpen.value = false
  selectedAccount.value = null
}
</script>

<style scoped>
.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-xs);
  font-family: inherit;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: filter 0.12s;
  white-space: nowrap;
}
.add-btn:hover { filter: brightness(1.1); }

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 18px;
}
.kpi-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.kpi-value {
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
}
.kpi-sub {
  font-size: 11px;
  color: var(--text3);
}

.section-label {
  font-size: 11px;
  font-weight: 800;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 10px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.credit-card-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.credit-card {
  padding: 18px 20px 16px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  border-bottom: 2px solid var(--border);
}
.credit-card::before {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 140px;
  height: 140px;
  background: var(--accent);
  border: 3px solid var(--border);
  transform: rotate(18deg);
  opacity: 0.8;
}
.credit-card::after {
  content: '';
  position: absolute;
  bottom: -50px;
  left: -20px;
  width: 180px;
  height: 180px;
  background: rgb(255 255 255 / 0.16);
  border: 3px solid var(--border);
  transform: rotate(-12deg);
}

.card-stats {
  padding: 14px 18px;
}

.edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  white-space: nowrap;
  flex-shrink: 0;
}
.edit-btn:hover {
  background: var(--primary-dim);
  color: var(--primary);
  border-color: var(--primary);
}
</style>

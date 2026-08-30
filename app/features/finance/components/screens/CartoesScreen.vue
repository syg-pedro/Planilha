<template>
  <div class="cards">

    <!-- ── Faixa de resumo ────────────────────────────────────────────── -->
    <section class="neo-panel cards__summary">
      <div class="cards__summary-figure">
        <p class="cards__summary-label">Uso total dos cartões</p>
        <p class="cards__summary-value ds-money">
          {{ fmt(totalPending) }}
          <span class="cards__summary-limit">/ {{ fmt(totalLimit) }}</span>
        </p>
      </div>
      <div class="cards__summary-side">
        <div class="cards__ring ds-money">{{ totalUsagePercent.toFixed(0) }}%</div>
        <span class="cards__summary-count">{{ activeAccountCount }} conta(s) ativa(s)</span>
        <button class="add-btn" @click="openNew">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova conta
        </button>
      </div>
    </section>

    <!-- ── Cartões de crédito ─────────────────────────────────────────── -->
    <div v-if="creditCards.length > 0" class="cards__section">
      <p class="section-label">Cartões de crédito</p>
      <div class="cards__grid">
        <article
          v-for="card in creditCards"
          :key="card.id"
          class="credit-card"
          :style="cardGradient(card.id)"
        >
          <div class="credit-card__top">
            <p class="credit-card__name">{{ card.name }}</p>
            <div class="credit-card__owner-wrap">
              <span class="credit-card__owner">{{ card.owner || '—' }}</span>
              <button
                class="credit-card__edit"
                type="button"
                :title="`Editar ${card.name}`"
                :aria-label="`Editar ${card.name}`"
                @click="openEdit(card)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          </div>

          <p class="credit-card__number ds-money">•••• •••• •••• {{ cardLast4(card) }}</p>

          <div class="credit-card__footer">
            <div class="credit-card__cell">
              <p class="credit-card__cap">Fatura vence</p>
              <p class="credit-card__cap-value">{{ card.dueDay ? `Dia ${card.dueDay}` : '—' }}</p>
            </div>
            <div class="credit-card__cell credit-card__cell--end">
              <p class="credit-card__cap">Usado</p>
              <p class="credit-card__cap-value ds-money">
                {{ fmt(pendingForCard(card.id)) }}<template v-if="card.limitTotal"> / {{ fmt(card.limitTotal) }}</template>
              </p>
            </div>
          </div>

          <div class="credit-card__track">
            <div class="credit-card__fill" :style="{ width: `${Math.min(100, usagePercent(card))}%` }" />
          </div>

          <p class="credit-card__note">
            {{ pendingCountForCard(card.id) }} lançamento(s) pendente(s)<template v-if="!card.limitTotal"> · sem limite cadastrado</template>
          </p>
        </article>
      </div>
    </div>

    <!-- ── Outras contas ──────────────────────────────────────────────── -->
    <div v-if="bankAccounts.length > 0" class="cards__section">
      <p class="section-label">Outras contas</p>
      <div class="neo-panel">
        <div
          v-for="acc in bankAccounts"
          :key="acc.id"
          class="cards__row"
        >
          <div class="cards__row-icon" :style="{ background: `color-mix(in srgb, ${typeColor(acc.type)} 16%, transparent)` }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="typeColor(acc.type)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path :d="typeIcon(acc.type)" />
            </svg>
          </div>
          <div class="cards__row-main">
            <p class="cards__row-name">{{ acc.name }}</p>
            <p class="cards__row-sub">{{ typeLabel(acc.type) }}{{ acc.owner ? ` · ${acc.owner}` : '' }}</p>
          </div>
          <span
            class="cards__row-tag"
            :style="{
              background: `color-mix(in srgb, ${typeColor(acc.type)} 16%, transparent)`,
              color: typeColor(acc.type)
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

const activeAccountCount = computed(() => store.accounts.filter(a => a.active !== false).length)

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

const totalUsagePercent = computed(() =>
  totalLimit.value > 0 ? Math.min(100, (totalPending.value / totalLimit.value) * 100) : 0
)

// ─── card presentation helpers ──────────────────────────────────────────────

const MASKED_LAST4 = '••••'

/** Extrai os 4 últimos dígitos presentes no nome da conta ("Itaú final 8235"). */
const cardLast4 = (card: Account) => {
  const digits = (card.name.match(/\d/g) ?? []).join('')
  return digits.length >= 4 ? digits.slice(-4) : MASKED_LAST4
}

// ─── card gradient (deterministic per id) ───────────────────────────────────
// Gradientes escuros propositalmente literais: o texto branco sobre eles
// funciona igual em todos os temas (ver design de referência).

const CARD_GRADIENTS = [
  'linear-gradient(135deg,#7c1fa8,#bb00ff)',
  'linear-gradient(135deg,#0a5c2a,#13a86b)',
  'linear-gradient(135deg,#1b2f8f,#4f6ef7)',
  'linear-gradient(135deg,#8f1f2b,#e84545)',
  'linear-gradient(135deg,#11161f,#37465c)',
  'linear-gradient(135deg,#7a3d00,#d08717)',
]

const cardGradient = (id: string) => {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return { background: CARD_GRADIENTS[hash % CARD_GRADIENTS.length] }
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
.cards {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cards__section {
  min-width: 0;
}

/* ── Faixa de resumo ─────────────────────────────────────── */
.cards__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 18px;
  flex-wrap: wrap;
}

.cards__summary-figure {
  min-width: 0;
}

.cards__summary-label {
  color: var(--text3);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.cards__summary-value {
  margin-top: 3px;
  color: var(--text);
  font-size: 19px;
  font-weight: 700;
}

.cards__summary-limit {
  color: var(--text3);
  font-size: 13px;
}

.cards__summary-side {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.cards__ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border: 4px solid var(--primary);
  border-radius: 50%;
  color: var(--primary);
  font-size: 13px;
  font-weight: 800;
}

.cards__summary-count {
  color: var(--text3);
  font-size: 11px;
  white-space: nowrap;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: var(--primary);
  color: var(--on-primary);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.section-label {
  margin-bottom: 10px;
  color: var(--text3);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ── Cartões de crédito ──────────────────────────────────── */
.cards__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.credit-card {
  min-width: 0;
  padding: 22px;
  border: var(--border-width) solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow-md);
  color: #fff;
}

.credit-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.credit-card__name {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.credit-card__owner-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.credit-card__owner {
  font-size: 10.5px;
  font-weight: 700;
  opacity: 0.8;
  text-transform: uppercase;
}

.credit-card__edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--ds-radius-md);
  background: rgb(255 255 255 / 0.18);
  color: #fff;
  cursor: pointer;
  touch-action: manipulation;
  transition: background var(--ds-motion-fast) linear;
}

.credit-card__edit:hover {
  background: rgb(255 255 255 / 0.32);
}

.credit-card__number {
  margin-top: 32px;
  overflow: hidden;
  font-size: 18px;
  letter-spacing: 0.12em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.credit-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: 18px;
}

.credit-card__cell {
  min-width: 0;
}

.credit-card__cell--end {
  text-align: right;
}

.credit-card__cap {
  font-size: 9.5px;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.credit-card__cap-value {
  margin-top: 2px;
  font-size: 12.5px;
  font-weight: 700;
}

.credit-card__track {
  overflow: hidden;
  height: 6px;
  margin-top: 10px;
  background: rgb(0 0 0 / 0.35);
  border-radius: var(--radius-pill);
}

.credit-card__fill {
  height: 100%;
  background: #fff;
  border-radius: var(--radius-pill);
  transition: width 0.45s steps(8, end);
}

.credit-card__note {
  margin-top: 8px;
  font-size: 9.5px;
  opacity: 0.7;
}

/* ── Outras contas ───────────────────────────────────────── */
.cards__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 18px;
  border-bottom: 1px solid var(--border);
}

.cards__row:last-child {
  border-bottom: none;
}

.cards__row-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: var(--border-width) solid var(--border);
  border-radius: var(--ds-radius-md);
}

.cards__row-main {
  flex: 1;
  min-width: 0;
}

.cards__row-name {
  overflow: hidden;
  color: var(--text);
  font-size: 13.5px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cards__row-sub {
  margin-top: 2px;
  color: var(--text3);
  font-size: 11px;
}

.cards__row-tag {
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
}

.edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 6px 12px;
  background: var(--surface2);
  color: var(--text2);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.edit-btn:hover {
  background: var(--primary-dim);
  color: var(--primary);
}

/* ── Responsivo ──────────────────────────────────────────── */
@media (max-width: 900px) {
  .cards__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .cards {
    gap: 14px;
  }

  .cards__summary {
    padding: 13px 14px;
  }

  .cards__summary-value {
    font-size: 18px;
  }

  .cards__summary-side {
    width: 100%;
    justify-content: space-between;
  }

  .cards__ring {
    width: 46px;
    height: 46px;
    font-size: 12px;
  }

  .cards__summary-count {
    display: none;
  }

  .credit-card {
    padding: 18px;
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
  }

  .credit-card__number {
    margin-top: 26px;
    font-size: 17px;
  }

  .credit-card__footer {
    margin-top: 16px;
  }

  .cards__row {
    flex-wrap: wrap;
    padding: 12px 14px;
  }

  .cards__row-tag {
    display: none;
  }
}
</style>

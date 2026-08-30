<template>
  <div class="subs">

    <!-- Totalizadores -->
    <div class="subs__totals">
      <div class="subs__total subs__total--primary">
        <p class="subs__total-label">Total mensal</p>
        <p class="subs__total-value ds-money">{{ fmt(summary.monthly) }}</p>
      </div>
      <div class="subs__total">
        <p class="subs__total-label subs__total-label--muted">Projeção anual</p>
        <p class="subs__total-value subs__total-value--plain ds-money">{{ fmt(summary.annual) }}</p>
      </div>
    </div>

    <!-- Barra de ações -->
    <div class="subs__toolbar">
      <p class="subs__meta">
        <span>{{ summary.count }} ativa(s)</span>
        <span class="subs__meta-sep">·</span>
        <span>Próx. 7 dias <strong class="subs__meta-strong ds-money">{{ fmt(summary.next7) }}</strong></span>
      </p>
      <div class="subs__actions">
        <input
          v-model="search"
          class="subs__search"
          placeholder="Buscar assinatura..."
          aria-label="Buscar assinatura"
        />
        <BaseButton variant="primary" size="sm" @click="openModal(null)">
          <BaseIcon name="plus" :size="14" color="var(--on-primary)" /> Nova assinatura
        </BaseButton>
      </div>
    </div>

    <!-- Empty state -->
    <BaseEmptyState
      v-if="subscriptionRows.length === 0"
      icon="subscription"
      title="Nenhuma assinatura"
      body="Adicione assinaturas e serviços recorrentes para acompanhar seus gastos mensais."
    >
      <BaseButton variant="primary" class="subs__empty-btn" @click="openModal(null)">
        <BaseIcon name="plus" :size="14" color="var(--on-primary)" /> Adicionar
      </BaseButton>
    </BaseEmptyState>

    <!-- Grid de assinaturas -->
    <div v-else class="subs__grid">
      <article v-for="row in visibleRows" :key="row.rule.id" class="subs__card">
        <span class="subs__mark" :style="{ background: row.color }" />
        <div class="subs__info">
          <p class="subs__name">{{ row.rule.title }}</p>
          <p class="subs__next">Próx. cobrança {{ row.nextCharge }}</p>
          <p v-if="row.metaLine" class="subs__tags">{{ row.metaLine }}</p>
        </div>
        <div class="subs__values">
          <span class="subs__amount ds-money">{{ fmt(row.rule.amount) }}</span>
          <span class="subs__annual ds-money">{{ fmt(row.rule.amount * 12) }} / ano</span>
        </div>
        <div class="subs__card-actions">
          <button class="subs__icon-btn" title="Editar" @click="openModal(row.rule)">
            <BaseIcon name="settings" :size="14" />
          </button>
          <button class="subs__icon-btn subs__icon-btn--danger" title="Excluir" @click="deleteRule(row.rule)">
            <BaseIcon name="close" :size="14" />
          </button>
        </div>
      </article>
    </div>

    <!-- Modal: criar/editar assinatura -->
    <BaseModal :open="showModal" :title="editingRule ? 'Editar assinatura' : 'Nova assinatura'" @close="closeModal">
      <div class="subs__form">

        <!-- Nome -->
        <div class="subs__field">
          <label class="subs__label">Nome do serviço</label>
          <input v-model="form.title" class="subs__input" placeholder="Ex: Netflix, Spotify…" />
        </div>

        <!-- Descrição -->
        <div class="subs__field">
          <label class="subs__label">Descrição (opcional)</label>
          <input v-model="form.description" class="subs__input" placeholder="Ex: Parcela fixa mensal" />
        </div>

        <!-- Valor + Vencimento -->
        <div class="subs__pair">
          <div class="subs__field">
            <label class="subs__label">Valor (R$)</label>
            <input v-model.number="form.amount" class="subs__input ds-money" type="number" min="0" step="0.01" />
          </div>
          <div class="subs__field">
            <label class="subs__label">Dia de vencimento</label>
            <input v-model.number="form.dueDay" class="subs__input ds-money" type="number" min="1" max="31" placeholder="Ex: 5" />
          </div>
        </div>

        <!-- Categoria + Conta -->
        <div class="subs__pair">
          <div class="subs__field">
            <label class="subs__label">Categoria</label>
            <BaseDropdown v-model="form.categoryId" :height="38">
              <option value="">Sem categoria</option>
              <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </BaseDropdown>
          </div>
          <div class="subs__field">
            <label class="subs__label">Conta</label>
            <BaseDropdown v-model="form.accountId" :height="38">
              <option value="">Sem conta</option>
              <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </BaseDropdown>
          </div>
        </div>

        <!-- Erro -->
        <p v-if="errorMsg" class="subs__error">{{ errorMsg }}</p>

        <div class="subs__form-actions">
          <BaseButton variant="ghost" @click="closeModal">Cancelar</BaseButton>
          <BaseButton
            variant="primary"
            :loading="saving"
            :disabled="!form.title.trim() || form.amount <= 0"
            @click="saveSubscription"
          >{{ saving ? 'Salvando...' : (editingRule ? 'Salvar' : 'Criar') }}</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal: confirmar exclusão -->
    <BaseModal :open="deleteConfirm.open" title="Excluir assinatura" @close="deleteConfirm.open = false">
      <div class="subs__form">
        <p class="subs__confirm">
          Excluir <strong>{{ deleteConfirm.title }}</strong>? Esta ação remove a regra e todos os lançamentos automáticos futuros associados.
        </p>
        <div class="subs__form-actions">
          <BaseButton variant="ghost" @click="deleteConfirm.open = false">Cancelar</BaseButton>
          <BaseButton variant="danger" :loading="deleting" @click="confirmDelete">
            {{ deleting ? 'Excluindo...' : 'Excluir' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { makeId } from '#shared/id'
import type { FinanceRule } from '#shared/types'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseModal      from '~/components/base/BaseModal.vue'
import BaseButton     from '~/components/base/BaseButton.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)

const search = ref('')

// Próxima cobrança a partir do dia de vencimento da regra.
const nextChargeLabel = (dueDay: number | null) => {
  if (!dueDay) return 'não definida'
  const today  = new Date()
  const offset = dueDay >= today.getUTCDate() ? 0 : 1
  const first  = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1))
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  const target  = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(dueDay, lastDay)))
  return target.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
}

const subscriptionRows = computed(() =>
  store.rules
    .filter(r => r.frequency === 'monthly' && r.kind === 'expense')
    .map(rule => {
      const category    = rule.categoryId ? store.categoryMap.get(rule.categoryId) : undefined
      const catName     = category?.name ?? ''
      const accountName = rule.accountId ? (store.accountMap.get(rule.accountId)?.name ?? '—') : '—'
      return {
        rule,
        catName,
        accountName,
        color:      category?.color || 'var(--primary)',
        nextCharge: nextChargeLabel(rule.dueDay),
        metaLine:   [rule.description, catName, accountName === '—' ? '' : accountName].filter(Boolean).join(' · ')
      }
    })
    .sort((a, b) => b.rule.amount - a.rule.amount)
)

const visibleRows = computed(() => {
  if (!search.value.trim()) return subscriptionRows.value
  const q = search.value.toLowerCase()
  return subscriptionRows.value.filter(r => r.rule.title.toLowerCase().includes(q))
})

const summary = computed(() => {
  const rows    = subscriptionRows.value
  const monthly = rows.reduce((s, r) => s + r.rule.amount, 0)
  const today    = new Date()
  const todayDay = today.getUTCDate()
  const in7      = todayDay + 7
  const next7    = rows
    .filter(r => r.rule.dueDay != null && r.rule.dueDay >= todayDay && r.rule.dueDay <= in7)
    .reduce((s, r) => s + r.rule.amount, 0)
  return { count: rows.length, monthly, annual: monthly * 12, next7 }
})

// Modal
const showModal   = ref(false)
const editingRule = ref<FinanceRule | null>(null)
const saving      = ref(false)
const errorMsg    = ref('')
const form        = ref({
  title:       '',
  description: '',
  amount:      0,
  dueDay:      null as number | null,
  categoryId:  '',
  accountId:   ''
})

const deleteConfirm = ref({ open: false, title: '', id: '' })
const deleting      = ref(false)

const openModal = (rule: FinanceRule | null) => {
  editingRule.value = rule
  errorMsg.value    = ''
  form.value = {
    title:       rule?.title       ?? '',
    description: rule?.description ?? '',
    amount:      rule?.amount      ?? 0,
    dueDay:      rule?.dueDay      ?? null,
    categoryId:  rule?.categoryId  ?? '',
    accountId:   rule?.accountId   ?? ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value   = false
  editingRule.value = null
  errorMsg.value    = ''
}

const saveSubscription = async () => {
  if (!form.value.title.trim() || form.value.amount <= 0) return
  saving.value   = true
  errorMsg.value = ''
  try {
    const now = new Date().toISOString().slice(0, 10)
    const upsert: Partial<FinanceRule> = {
      id:           editingRule.value?.id ?? makeId('rule'),
      title:        form.value.title.trim(),
      description:  form.value.description.trim(),
      amount:       form.value.amount,
      kind:         'expense',
      frequency:    'monthly',
      autoGenerate: true,
      dueDay:       form.value.dueDay ?? null,
      categoryId:   form.value.categoryId || null,
      accountId:    form.value.accountId  || null,
      startsAt:     editingRule.value?.startsAt ?? now,
      endsAt:       null
    }
    await store.saveRules([upsert], [])
    await store.rebuildRules()
    closeModal()
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Erro ao salvar assinatura'
  } finally {
    saving.value = false
  }
}

const deleteRule = (rule: FinanceRule) => {
  deleteConfirm.value = { open: true, title: rule.title, id: rule.id }
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await store.saveRules([], [deleteConfirm.value.id])
    await store.rebuildRules()
    deleteConfirm.value.open = false
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.subs {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Totalizadores ─────────────────────────────────────────── */
.subs__totals {
  display: flex;
  gap: 12px;
}

.subs__total {
  flex: 1;
  min-width: 0;
  padding: 13px 16px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--shadow-sm);
}

.subs__total--primary {
  background: var(--primary-dim);
}

.subs__total-label {
  margin-bottom: 3px;
  color: var(--on-primary-dim);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.subs__total-label--muted {
  color: var(--text3);
}

.subs__total-value {
  color: var(--primary);
  font-size: 17px;
  font-weight: 700;
}

.subs__total-value--plain {
  color: var(--text);
}

/* ── Barra de ações ────────────────────────────────────────── */
.subs__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.subs__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text3);
  font-size: 11.5px;
  font-weight: 700;
}

.subs__meta-sep {
  color: var(--border);
}

.subs__meta-strong {
  color: var(--text2);
  font-weight: 700;
}

.subs__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.subs__search {
  min-width: 200px;
  height: 34px;
  padding: 0 12px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  color: var(--text);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 650;
  outline: none;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.subs__search::placeholder {
  color: var(--text3);
}

.subs__search:focus {
  box-shadow: var(--shadow-sm);
  transform: translate(-1px, -1px);
}

.subs__empty-btn {
  margin-top: 12px;
}

/* ── Grid de cards ─────────────────────────────────────────── */
.subs__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.subs__card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.subs__card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md);
}

.subs__mark {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
}

.subs__info {
  flex: 1;
  min-width: 0;
}

.subs__name {
  overflow: hidden;
  color: var(--text);
  font-size: 13.5px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subs__next {
  margin-top: 2px;
  color: var(--text3);
  font-size: 11px;
}

.subs__tags {
  overflow: hidden;
  margin-top: 2px;
  color: var(--text3);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subs__values {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.subs__amount {
  color: var(--text);
  font-size: 13.5px;
  font-weight: 700;
  white-space: nowrap;
}

.subs__annual {
  margin-top: 2px;
  color: var(--text3);
  font-size: 10px;
  white-space: nowrap;
}

.subs__card-actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
}

.subs__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  background: var(--surface2);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text3);
  cursor: pointer;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.subs__icon-btn:hover {
  box-shadow: var(--shadow-xs);
  transform: translate(-1px, -1px);
}

.subs__icon-btn--danger {
  color: var(--danger);
}

/* ── Formulários / modais ──────────────────────────────────── */
.subs__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.subs__pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.subs__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.subs__label {
  color: var(--text3);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.subs__input {
  box-sizing: border-box;
  width: 100%;
  height: 38px;
  padding: 0 12px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 650;
  outline: none;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.subs__input::placeholder {
  color: var(--text3);
}

.subs__input:focus {
  box-shadow: var(--shadow-sm);
  transform: translate(-1px, -1px);
}

.subs__error {
  padding: 10px 14px;
  background: var(--danger-light);
  border: var(--border-width) solid var(--border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--shadow-xs);
  color: var(--danger);
  font-size: 13px;
  font-weight: 700;
}

.subs__confirm {
  color: var(--text2);
  font-size: 13px;
  line-height: 1.6;
}

.subs__form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* ── Responsivo ────────────────────────────────────────────── */
@media (max-width: 700px) {
  .subs__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .subs {
    gap: 14px;
  }

  .subs__totals {
    gap: 8px;
  }

  .subs__total {
    padding: 11px 13px;
    box-shadow: var(--shadow-xs);
  }

  .subs__total-value {
    font-size: 16px;
  }

  .subs__actions {
    width: 100%;
  }

  .subs__search {
    flex: 1;
    min-width: 0;
  }

  .subs__card {
    gap: 11px;
    padding: 12px 14px;
  }

  .subs__mark {
    width: 34px;
    height: 34px;
  }

  .subs__pair {
    grid-template-columns: 1fr;
  }
}
</style>

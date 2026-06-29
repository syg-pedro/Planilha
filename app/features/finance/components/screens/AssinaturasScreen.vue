<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- KPIs -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px">
      <BaseKpiCard icon="subscription" label="Mensal total"   :value="fmt(summary.monthly)"  color="var(--primary)" :sub="`${summary.count} ativa(s)`" />
      <BaseKpiCard icon="reports"      label="Anual estimado" :value="fmt(summary.annual)"    color="var(--warning)" sub="Todas as assinaturas" />
      <BaseKpiCard icon="calendar"     label="Próx. 7 dias"   :value="fmt(summary.next7)"     color="var(--danger)"  sub="Vencimentos" />
    </div>

    <!-- Actions bar -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px">
      <input
        v-model="search"
        placeholder="Buscar assinatura..."
        style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 34px; font-size: 12px; color: var(--text); font-family: inherit; outline: none; min-width: 200px"
      />
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff"
        @click="openModal(null)"
      >
        <BaseIcon name="plus" :size="14" color="#fff" /> Nova assinatura
      </button>
    </div>

    <!-- Empty state -->
    <BaseEmptyState v-if="subscriptionRows.length === 0" icon="subscription" title="Nenhuma assinatura" body="Adicione assinaturas e serviços recorrentes para acompanhar seus gastos mensais.">
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff; margin-top: 12px"
        @click="openModal(null)"
      >
        <BaseIcon name="plus" :size="14" color="#fff" /> Adicionar
      </button>
    </BaseEmptyState>

    <!-- Table -->
    <div v-else class="neo-panel">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px">
        <thead>
          <tr style="background: var(--surface2); border-bottom: 1px solid var(--border)">
            <th style="text-align: left; padding: 10px 18px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Serviço</th>
            <th style="text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Categoria</th>
            <th style="text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Conta</th>
            <th style="text-align: right; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Mensal</th>
            <th style="text-align: right; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Anual</th>
            <th style="text-align: center; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em">Venc.</th>
            <th style="padding: 10px 14px"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in visibleRows"
            :key="row.rule.id"
            style="border-bottom: 1px solid var(--border)"
          >
            <td style="padding: 10px 18px">
              <p style="font-weight: 600; color: var(--text)">{{ row.rule.title }}</p>
              <p v-if="row.rule.description" style="font-size: 11px; color: var(--text3)">{{ row.rule.description }}</p>
            </td>
            <td style="padding: 10px 14px">
              <span v-if="row.catName" style="font-size: 12px; color: var(--text2)">{{ row.catName }}</span>
              <span v-else style="font-size: 12px; color: var(--text3)">—</span>
            </td>
            <td style="padding: 10px 14px; font-size: 12px; color: var(--text2)">{{ row.accountName }}</td>
            <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: var(--danger)">{{ fmt(row.rule.amount) }}</td>
            <td style="padding: 10px 14px; text-align: right; font-size: 12px; color: var(--text3)">{{ fmt(row.rule.amount * 12) }}</td>
            <td style="padding: 10px 14px; text-align: center; font-size: 12px; color: var(--text2)">
              {{ row.rule.dueDay ? `Dia ${row.rule.dueDay}` : '—' }}
            </td>
            <td style="padding: 10px 14px; text-align: right">
              <div style="display: flex; gap: 4px; justify-content: flex-end">
                <button style="background: none; border: none; cursor: pointer; color: var(--text3); padding: 4px" @click="openModal(row.rule)">
                  <BaseIcon name="settings" :size="14" />
                </button>
                <button style="background: none; border: none; cursor: pointer; color: var(--danger); padding: 4px" @click="deleteRule(row.rule)">
                  <BaseIcon name="close" :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: criar/editar assinatura -->
    <BaseModal :open="showModal" :title="editingRule ? 'Editar assinatura' : 'Nova assinatura'" @close="closeModal">
      <div style="display: flex; flex-direction: column; gap: 14px">

        <!-- Nome -->
        <div>
          <label :style="labelStyle">Nome do serviço</label>
          <input v-model="form.title" placeholder="Ex: Netflix, Spotify…" :style="inputStyle" />
        </div>

        <!-- Descrição -->
        <div>
          <label :style="labelStyle">Descrição (opcional)</label>
          <input v-model="form.description" placeholder="Ex: Parcela fixa mensal" :style="inputStyle" />
        </div>

        <!-- Valor + Vencimento -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
          <div>
            <label :style="labelStyle">Valor (R$)</label>
            <input v-model.number="form.amount" type="number" min="0" step="0.01" :style="inputStyle" />
          </div>
          <div>
            <label :style="labelStyle">Dia de vencimento</label>
            <input v-model.number="form.dueDay" type="number" min="1" max="31" placeholder="Ex: 5" :style="inputStyle" />
          </div>
        </div>

        <!-- Categoria + Conta -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
          <div>
            <label :style="labelStyle">Categoria</label>
            <BaseDropdown v-model="form.categoryId" :height="36">
              <option value="">Sem categoria</option>
              <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </BaseDropdown>
          </div>
          <div>
            <label :style="labelStyle">Conta</label>
            <BaseDropdown v-model="form.accountId" :height="36">
              <option value="">Sem conta</option>
              <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </BaseDropdown>
          </div>
        </div>

        <!-- Erro -->
        <div
          v-if="errorMsg"
          style="padding: 10px 14px; border-radius: 8px; background: var(--danger-light); border: 1px solid var(--danger); font-size: 13px; color: var(--danger); font-weight: 600"
        >{{ errorMsg }}</div>

        <div style="display: flex; gap: 10px; justify-content: flex-end">
          <button :style="btnCancelStyle" @click="closeModal">Cancelar</button>
          <button
            :disabled="!form.title.trim() || form.amount <= 0 || saving"
            :style="{ ...btnSaveStyle, opacity: (!form.title.trim() || form.amount <= 0 || saving) ? 0.5 : 1 }"
            @click="saveSubscription"
          >
            <svg v-if="saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            {{ saving ? 'Salvando...' : (editingRule ? 'Salvar' : 'Criar') }}
          </button>
        </div>
      </div>
    </BaseModal>

    <!-- Modal: confirmar exclusão -->
    <BaseModal :open="deleteConfirm.open" title="Excluir assinatura" @close="deleteConfirm.open = false">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <p style="font-size: 13px; color: var(--text2); line-height: 1.6">
          Excluir <strong>{{ deleteConfirm.title }}</strong>? Esta ação remove a regra e todos os lançamentos automáticos futuros associados.
        </p>
        <div style="display: flex; gap: 10px; justify-content: flex-end">
          <button :style="btnCancelStyle" @click="deleteConfirm.open = false">Cancelar</button>
          <button
            :style="{ ...btnSaveStyle, background: 'var(--danger)' }"
            :disabled="deleting"
            @click="confirmDelete"
          >{{ deleting ? 'Excluindo...' : 'Excluir' }}</button>
        </div>
      </div>
    </BaseModal>

  </div>
</template>
<style scoped>
@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
</style>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { makeId } from '#shared/id'
import type { FinanceRule } from '#shared/types'
import BaseKpiCard    from '~/components/base/BaseKpiCard.vue'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseModal      from '~/components/base/BaseModal.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)

const search = ref('')

const subscriptionRows = computed(() =>
  store.rules
    .filter(r => r.frequency === 'monthly' && r.kind === 'expense')
    .map(rule => ({
      rule,
      catName:     rule.categoryId ? (store.categoryMap.get(rule.categoryId)?.name ?? '') : '',
      accountName: rule.accountId  ? (store.accountMap.get(rule.accountId)?.name  ?? '—') : '—'
    }))
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

// Style constants
const labelStyle     = { display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px' }
const inputStyle     = { width: '100%', boxSizing: 'border-box' as const, background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '0 10px', height: '36px', fontSize: '13px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }
const btnCancelStyle = { padding: '9px 16px', fontSize: '13px', fontWeight: '600', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)' }
const btnSaveStyle   = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '13px', fontWeight: '700', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: 'none', background: 'var(--primary)', color: '#fff' }
</script>

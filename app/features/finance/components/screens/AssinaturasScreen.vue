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
    <div v-else style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden">
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
                <button style="background: none; border: none; cursor: pointer; color: var(--danger); padding: 4px" @click="deleteRule(row.rule.id)">
                  <BaseIcon name="close" :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <BaseModal v-model="showModal" :title="editingRule ? 'Editar assinatura' : 'Nova assinatura'">
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Nome do serviço</label>
          <input
            v-model="form.title"
            placeholder="Ex: Netflix, Spotify…"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
          />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Valor (R$)</label>
            <input
              v-model.number="form.amount"
              type="number" min="0" step="0.01"
              style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
            />
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Dia de vencimento</label>
            <input
              v-model.number="form.dueDay"
              type="number" min="1" max="31"
              style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
            />
          </div>
        </div>
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Categoria</label>
          <select
            v-model="form.categoryId"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none"
          >
            <option value="">Sem categoria</option>
            <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Conta</label>
          <select
            v-model="form.accountId"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none"
          >
            <option value="">Sem conta</option>
            <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
          </select>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end">
          <button
            style="padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)"
            @click="showModal = false"
          >Cancelar</button>
          <button
            :disabled="!form.title || !form.amount || saving"
            style="padding: 8px 18px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff"
            @click="saveSubscription"
          >{{ editingRule ? 'Salvar' : 'Criar' }}</button>
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
  const rows   = subscriptionRows.value
  const monthly = rows.reduce((s, r) => s + r.rule.amount, 0)
  const today   = new Date()
  const todayDay = today.getUTCDate()
  const in7     = todayDay + 7
  const next7   = rows
    .filter(r => r.rule.dueDay != null && r.rule.dueDay >= todayDay && r.rule.dueDay <= in7)
    .reduce((s, r) => s + r.rule.amount, 0)
  return { count: rows.length, monthly, annual: monthly * 12, next7 }
})

// Modal
const showModal  = ref(false)
const editingRule = ref<FinanceRule | null>(null)
const saving     = ref(false)
const form       = ref({ title: '', amount: 0, dueDay: null as number | null, categoryId: '', accountId: '' })

const openModal = (rule: FinanceRule | null) => {
  editingRule.value = rule
  form.value = {
    title:      rule?.title       ?? '',
    amount:     rule?.amount      ?? 0,
    dueDay:     rule?.dueDay      ?? null,
    categoryId: rule?.categoryId  ?? '',
    accountId:  rule?.accountId   ?? ''
  }
  showModal.value = true
}

const saveSubscription = async () => {
  if (!form.value.title || !form.value.amount) return
  saving.value = true
  try {
    const now = new Date().toISOString().slice(0, 10)
    const upsert: Partial<FinanceRule> = {
      id:           editingRule.value?.id ?? makeId('rule'),
      title:        form.value.title,
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
    showModal.value = false
  } finally {
    saving.value = false
  }
}

const deleteRule = async (id: string) => {
  await store.saveRules([], [id])
}
</script>

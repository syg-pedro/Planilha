<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- Summary bar -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 16px 20px; display: flex; flex-wrap: wrap; gap: 16px; align-items: center">
      <div style="flex: 1; min-width: 160px">
        <p style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Mês de referência</p>
        <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px">
          <select
            v-model="monthRef"
            style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 34px; font-size: 13px; font-weight: 700; color: var(--text); font-family: inherit; outline: none"
          >
            <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
        </div>
      </div>
      <div style="flex: 1; min-width: 130px">
        <p style="font-size: 11px; color: var(--text3)">Orçado total</p>
        <p style="font-size: 18px; font-weight: 700; color: var(--text)">{{ fmt(summary.totalLimit) }}</p>
      </div>
      <div style="flex: 1; min-width: 130px">
        <p style="font-size: 11px; color: var(--text3)">Gasto até agora</p>
        <p style="font-size: 18px; font-weight: 700; color: var(--danger)">{{ fmt(summary.totalSpent) }}</p>
      </div>
      <div style="flex: 1; min-width: 130px">
        <p style="font-size: 11px; color: var(--text3)">Restante</p>
        <p style="font-size: 18px; font-weight: 700" :style="{ color: summary.remaining >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(summary.remaining) }}</p>
      </div>
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff; white-space: nowrap"
        @click="openModal(null)"
      >
        <BaseIcon name="plus" :size="14" color="#fff" />
        Novo orçamento
      </button>
    </div>

    <!-- Empty state -->
    <BaseEmptyState v-if="budgetRows.length === 0" icon="budget" title="Nenhum orçamento" body="Defina limites de gasto por categoria para controlar suas finanças.">
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff; margin-top: 12px"
        @click="openModal(null)"
      >
        <BaseIcon name="plus" :size="14" color="#fff" /> Criar orçamento
      </button>
    </BaseEmptyState>

    <!-- Budget cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px">
      <div
        v-for="row in budgetRows"
        :key="row.budget.id"
        style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; position: relative; overflow: hidden"
        :style="row.pct >= 100 ? { borderColor: 'var(--danger)' } : row.pct >= 80 ? { borderColor: 'var(--warning)' } : {}"
      >
        <!-- Top row -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start">
          <div>
            <div style="display: flex; align-items: center; gap: 8px">
              <span
                :style="{
                  display: 'inline-block', width: '10px', height: '10px',
                  borderRadius: '50%', background: row.catColor, flexShrink: 0
                }"
              />
              <p style="font-size: 14px; font-weight: 700; color: var(--text)">{{ row.catName }}</p>
            </div>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">
              {{ fmt(row.spent) }} de {{ fmt(row.budget.amount) }}
            </p>
          </div>
          <div style="display: flex; gap: 4px">
            <button
              style="background: none; border: none; cursor: pointer; color: var(--text3); padding: 4px"
              title="Editar"
              @click="openModal(row.budget)"
            >
              <BaseIcon name="settings" :size="14" />
            </button>
            <button
              style="background: none; border: none; cursor: pointer; color: var(--danger); padding: 4px"
              title="Excluir"
              @click="deleteBudget(row.budget.id)"
            >
              <BaseIcon name="close" :size="14" />
            </button>
          </div>
        </div>

        <!-- Progress bar -->
        <div>
          <div style="height: 8px; background: var(--bg2); border-radius: 99px; overflow: hidden">
            <div
              :style="{
                width: `${Math.min(100, row.pct)}%`,
                height: '100%',
                borderRadius: '99px',
                background: row.pct >= 100 ? 'var(--danger)' : row.pct >= 80 ? 'var(--warning)' : row.catColor,
                transition: 'width 0.6s',
                boxShadow: row.pct >= 90 ? `0 0 6px ${row.pct >= 100 ? 'var(--danger)' : 'var(--warning)'}` : ''
              }"
            />
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 5px">
            <span
              style="font-size: 12px; font-weight: 700"
              :style="{ color: row.pct >= 100 ? 'var(--danger)' : row.pct >= 80 ? 'var(--warning)' : 'var(--text3)' }"
            >{{ row.pct.toFixed(0) }}% utilizado</span>
            <span style="font-size: 12px; color: var(--text3)">
              Restam {{ fmt(Math.max(0, row.budget.amount - row.spent)) }}
            </span>
          </div>
        </div>

        <!-- Warning strip -->
        <div
          v-if="row.pct >= 80"
          :style="{
            background: row.pct >= 100 ? 'color-mix(in srgb, var(--danger) 10%, transparent)' : 'color-mix(in srgb, var(--warning) 10%, transparent)',
            borderRadius: 'var(--radius-xs)',
            padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: '6px'
          }"
        >
          <BaseIcon name="warning" :size="13" :color="row.pct >= 100 ? 'var(--danger)' : 'var(--warning)'" />
          <span style="font-size: 11px; font-weight: 600" :style="{ color: row.pct >= 100 ? 'var(--danger)' : 'var(--warning)' }">
            {{ row.pct >= 100 ? 'Limite ultrapassado!' : 'Atenção: perto do limite' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Modal: create / edit budget -->
    <BaseModal v-model="showModal" :title="editing ? 'Editar orçamento' : 'Novo orçamento'">
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Categoria</label>
          <select
            v-model="form.categoryId"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none"
          >
            <option value="">Selecione uma categoria</option>
            <option v-for="cat in expenseCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Limite (R$)</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
          />
        </div>
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Mês de referência</label>
          <input
            v-model="form.monthRef"
            type="month"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
          />
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end">
          <button
            style="padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)"
            @click="showModal = false"
          >Cancelar</button>
          <button
            :disabled="!form.categoryId || !form.amount || saving"
            style="padding: 8px 18px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff"
            @click="saveBudget"
          >{{ editing ? 'Salvar' : 'Criar' }}</button>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { makeId } from '#shared/id'
import type { Budget } from '#shared/types'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseModal      from '~/components/base/BaseModal.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)

const now = new Date()
const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

const monthRef = ref(currentMonthKey)

const monthOptions = computed(() => {
  const options = []
  for (let i = -3; i <= 3; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1))
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    options.push({ value: key, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return options
})

const expenseCategories = computed(() =>
  store.categories.filter(c => c.kind === 'expense')
)

const budgetRows = computed(() => {
  const buds = store.budgets.filter(b => b.monthRef === monthRef.value || b.monthRef.startsWith(monthRef.value))
  return buds.map(budget => {
    const cat   = store.categoryMap.get(budget.categoryId)
    const spent = store.entries
      .filter(e => e.kind === 'expense' && e.categoryId === budget.categoryId && e.dueDate.startsWith(monthRef.value))
      .reduce((s, e) => s + e.amount, 0)
    return {
      budget,
      catName:  cat?.name  ?? 'Sem categoria',
      catColor: cat?.color ?? 'var(--primary)',
      spent,
      pct: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
    }
  }).sort((a, b) => b.pct - a.pct)
})

const summary = computed(() => {
  const totalLimit = budgetRows.value.reduce((s, r) => s + r.budget.amount, 0)
  const totalSpent = budgetRows.value.reduce((s, r) => s + r.spent, 0)
  return { totalLimit, totalSpent, remaining: totalLimit - totalSpent }
})

// Modal
const showModal = ref(false)
const editing   = ref<Budget | null>(null)
const saving    = ref(false)
const form      = ref({ categoryId: '', amount: 0, monthRef: currentMonthKey })

const openModal = (budget: Budget | null) => {
  editing.value   = budget
  form.value      = {
    categoryId: budget?.categoryId ?? '',
    amount:     budget?.amount     ?? 0,
    monthRef:   budget?.monthRef   ?? monthRef.value
  }
  showModal.value = true
}

const saveBudget = async () => {
  if (!form.value.categoryId || !form.value.amount) return
  saving.value = true
  try {
    const upsert: Partial<Budget> = {
      id:         editing.value?.id ?? makeId('budget'),
      categoryId: form.value.categoryId,
      amount:     form.value.amount,
      monthRef:   form.value.monthRef
    }
    await store.saveBudgets([upsert], [])
    showModal.value = false
  } finally {
    saving.value = false
  }
}

const deleteBudget = async (id: string) => {
  await store.saveBudgets([], [id])
}
</script>

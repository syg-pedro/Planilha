<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px">
      <div>
        <h2 style="font-size: 16px; font-weight: 800; color: var(--text)">Minhas metas</h2>
        <p style="font-size: 12px; color: var(--text3); margin-top: 2px">{{ store.goals.length }} meta(s) cadastrada(s)</p>
      </div>
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff"
        @click="openModal(null)"
      >
        <BaseIcon name="plus" :size="14" color="#fff" /> Nova meta
      </button>
    </div>

    <!-- Summary KPIs -->
    <div v-if="store.goals.length > 0" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px">
      <BaseKpiCard icon="goal"    label="Total almejado"  :value="fmt(totalTarget)"  color="var(--primary)" />
      <BaseKpiCard icon="income"  label="Total acumulado" :value="fmt(totalCurrent)" color="var(--success)" />
      <BaseKpiCard icon="balance" label="Ainda faltam"    :value="fmt(totalTarget - totalCurrent)" :color="totalTarget > totalCurrent ? 'var(--warning)' : 'var(--success)'" />
    </div>

    <!-- Empty state -->
    <BaseEmptyState v-if="store.goals.length === 0" icon="goal" title="Nenhuma meta ainda" body="Defina objetivos financeiros e acompanhe o progresso até conquistá-los.">
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff; margin-top: 12px"
        @click="openModal(null)"
      >
        <BaseIcon name="plus" :size="14" color="#fff" /> Criar meta
      </button>
    </BaseEmptyState>

    <!-- Goal cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px">
      <div
        v-for="goal in store.goals"
        :key="goal.id"
        style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 18px; display: flex; flex-direction: column; gap: 12px"
      >
        <!-- Title row -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start">
          <p style="font-size: 14px; font-weight: 700; color: var(--text); flex: 1">{{ goal.name }}</p>
          <div style="display: flex; gap: 2px; flex-shrink: 0">
            <button style="background: none; border: none; cursor: pointer; color: var(--text3); padding: 3px" @click="openContribute(goal)">
              <BaseIcon name="plus" :size="14" />
            </button>
            <button style="background: none; border: none; cursor: pointer; color: var(--text3); padding: 3px" @click="openModal(goal)">
              <BaseIcon name="settings" :size="14" />
            </button>
            <button style="background: none; border: none; cursor: pointer; color: var(--danger); padding: 3px" @click="deleteGoal(goal.id)">
              <BaseIcon name="close" :size="14" />
            </button>
          </div>
        </div>

        <!-- Donut + values -->
        <div style="display: flex; align-items: center; gap: 14px">
          <BaseDonutRing :percent="goalPct(goal)" :color="goal.color" :size="64" :stroke="7" :label="`${goalPct(goal).toFixed(0)}%`" />
          <div style="flex: 1">
            <p style="font-size: 15px; font-weight: 800; color: var(--text)">{{ fmt(goal.currentAmount) }}</p>
            <p style="font-size: 12px; color: var(--text3)">de {{ fmt(goal.targetAmount) }}</p>
            <p v-if="goal.deadline" style="font-size: 11px; color: var(--text3); margin-top: 2px">Prazo: {{ fmtDate(goal.deadline) }}</p>
          </div>
        </div>

        <!-- Progress bar -->
        <div>
          <div style="height: 6px; background: var(--bg2); border-radius: 99px; overflow: hidden">
            <div
              :style="{
                width: `${Math.min(100, goalPct(goal))}%`,
                height: '100%',
                borderRadius: '99px',
                background: goal.color,
                transition: 'width 0.6s'
              }"
            />
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px">
            <span style="font-size: 11px; color: var(--text3)">Faltam {{ fmt(Math.max(0, goal.targetAmount - goal.currentAmount)) }}</span>
            <span v-if="goal.deadline" style="font-size: 11px; color: var(--text3)">{{ monthsLeft(goal.deadline) }} meses</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: create / edit goal -->
    <BaseModal v-model="showModal" :title="editingGoal ? 'Editar meta' : 'Nova meta'">
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Nome da meta</label>
          <input
            v-model="form.name"
            placeholder="Ex: Reserva de emergência, Viagem…"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
          />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Valor alvo (R$)</label>
            <input
              v-model.number="form.targetAmount"
              type="number" min="0" step="0.01"
              style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
            />
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Já guardado (R$)</label>
            <input
              v-model.number="form.currentAmount"
              type="number" min="0" step="0.01"
              style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
            />
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Prazo (opcional)</label>
            <input
              v-model="form.deadline"
              type="date"
              style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
            />
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Cor</label>
            <select
              v-model="form.color"
              style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none"
            >
              <option value="var(--primary)">Azul</option>
              <option value="var(--success)">Verde</option>
              <option value="var(--accent)">Roxo</option>
              <option value="var(--warning)">Amarelo</option>
              <option value="var(--danger)">Vermelho</option>
            </select>
          </div>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end">
          <button
            style="padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)"
            @click="showModal = false"
          >Cancelar</button>
          <button
            :disabled="!form.name || !form.targetAmount || saving"
            style="padding: 8px 18px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--primary); color: #fff"
            @click="saveGoal"
          >{{ editingGoal ? 'Salvar' : 'Criar' }}</button>
        </div>
      </div>
    </BaseModal>

    <!-- Modal: contribute -->
    <BaseModal v-model="showContribute" title="Registrar aporte">
      <div v-if="contributingGoal" style="display: flex; flex-direction: column; gap: 14px">
        <p style="font-size: 13px; color: var(--text2)">Meta: <strong>{{ contributingGoal.name }}</strong></p>
        <p style="font-size: 12px; color: var(--text3)">Atual: {{ fmt(contributingGoal.currentAmount) }} / {{ fmt(contributingGoal.targetAmount) }}</p>
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text2); display: block; margin-bottom: 5px">Valor do aporte (R$)</label>
          <input
            v-model.number="contributeAmount"
            type="number" min="0" step="0.01"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
          />
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end">
          <button
            style="padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)"
            @click="showContribute = false"
          >Cancelar</button>
          <button
            :disabled="!contributeAmount || saving"
            style="padding: 8px 18px; font-size: 13px; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; border: none; background: var(--success); color: #fff"
            @click="confirmContribute"
          >Confirmar aporte</button>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useDateFormat } from '~/composables/useDateFormat'
import { makeId } from '#shared/id'
import type { FinanceGoal } from '#shared/types'
import BaseKpiCard    from '~/components/base/BaseKpiCard.vue'
import BaseDonutRing  from '~/components/base/BaseDonutRing.vue'
import BaseIcon       from '~/components/base/BaseIcon.vue'
import BaseModal      from '~/components/base/BaseModal.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'

const store    = useFinanceStore()
const currency = useCurrency()
const { formatDate } = useDateFormat()
const fmt      = (v: number) => currency.format(v)
const fmtDate  = (d: string | null) => d ? formatDate(d) : ''

const totalTarget  = computed(() => store.goals.reduce((s, g) => s + g.targetAmount, 0))
const totalCurrent = computed(() => store.goals.reduce((s, g) => s + g.currentAmount, 0))

const goalPct = (goal: FinanceGoal) =>
  goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0

const monthsLeft = (deadline: string) => {
  const now  = new Date()
  const due  = new Date(deadline)
  return Math.max(0, (due.getFullYear() - now.getFullYear()) * 12 + (due.getMonth() - now.getMonth()))
}

// Create/edit modal
const showModal   = ref(false)
const editingGoal = ref<FinanceGoal | null>(null)
const saving      = ref(false)
const form        = ref({ name: '', targetAmount: 0, currentAmount: 0, deadline: '', color: 'var(--primary)' })

const openModal = (goal: FinanceGoal | null) => {
  editingGoal.value = goal
  form.value = {
    name:          goal?.name          ?? '',
    targetAmount:  goal?.targetAmount  ?? 0,
    currentAmount: goal?.currentAmount ?? 0,
    deadline:      goal?.deadline      ?? '',
    color:         goal?.color         ?? 'var(--primary)'
  }
  showModal.value = true
}

const saveGoal = async () => {
  if (!form.value.name || !form.value.targetAmount) return
  saving.value = true
  try {
    const upsert: Partial<FinanceGoal> = {
      id:            editingGoal.value?.id ?? makeId('goal'),
      name:          form.value.name,
      targetAmount:  form.value.targetAmount,
      currentAmount: form.value.currentAmount,
      deadline:      form.value.deadline || null,
      color:         form.value.color
    }
    await store.saveGoals([upsert], [])
    showModal.value = false
  } finally {
    saving.value = false
  }
}

const deleteGoal = async (id: string) => {
  await store.saveGoals([], [id])
}

// Contribute modal
const showContribute    = ref(false)
const contributingGoal  = ref<FinanceGoal | null>(null)
const contributeAmount  = ref(0)

const openContribute = (goal: FinanceGoal) => {
  contributingGoal.value = goal
  contributeAmount.value = 0
  showContribute.value   = true
}

const confirmContribute = async () => {
  if (!contributingGoal.value || !contributeAmount.value) return
  saving.value = true
  try {
    const goal    = contributingGoal.value
    const newAmt  = Math.min(goal.targetAmount, goal.currentAmount + contributeAmount.value)
    await store.saveGoals([{ id: goal.id, currentAmount: newAmt }], [])
    showContribute.value = false
  } finally {
    saving.value = false
  }
}
</script>

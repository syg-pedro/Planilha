<template>
  <div style="display: flex; flex-direction: column; gap: 16px">

    <!-- Simulator panel -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 20px 22px">
      <h3 style="font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px">Simulador de cenários</h3>
      <p style="font-size: 11px; color: var(--text3); margin-bottom: 20px">Ajuste renda e despesa para visualizar o impacto no saldo projetado</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px">
        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.06em">Renda mensal (R$)</label>
          <input
            v-model.number="sim.income"
            type="number" min="0" step="100"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 14px; font-weight: 700; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
          />
        </div>
        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.06em">Despesa fixa (R$)</label>
          <input
            v-model.number="sim.expense"
            type="number" min="0" step="100"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 14px; font-weight: 700; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
          />
        </div>
        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.06em">Aporte mensal (R$)</label>
          <input
            v-model.number="sim.savings"
            type="number" min="0" step="50"
            style="width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 38px; font-size: 14px; font-weight: 700; color: var(--text); font-family: inherit; outline: none; box-sizing: border-box"
          />
        </div>
        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.06em">Meses ({{ sim.months }})</label>
          <input
            v-model.number="sim.months"
            type="range" min="1" max="60"
            style="width: 100%; accent-color: var(--primary); margin-top: 10px"
          />
        </div>
      </div>

      <!-- Projection result -->
      <div style="display: flex; gap: 20px; margin-top: 18px; flex-wrap: wrap">
        <div>
          <p style="font-size: 11px; color: var(--text3)">Saldo líquido / mês</p>
          <p style="font-size: 20px; font-weight: 800" :style="{ color: simResult.netPerMonth >= 0 ? 'var(--success)' : 'var(--danger)' }">
            {{ fmt(simResult.netPerMonth) }}
          </p>
        </div>
        <div>
          <p style="font-size: 11px; color: var(--text3)">Acumulado em {{ sim.months }} meses</p>
          <p style="font-size: 20px; font-weight: 800" :style="{ color: simResult.accumulated >= 0 ? 'var(--primary)' : 'var(--danger)' }">
            {{ fmt(simResult.accumulated) }}
          </p>
        </div>
        <div>
          <p style="font-size: 11px; color: var(--text3)">Taxa de poupança</p>
          <p style="font-size: 20px; font-weight: 800" :style="{ color: simResult.savingsRate >= 20 ? 'var(--success)' : simResult.savingsRate >= 10 ? 'var(--warning)' : 'var(--danger)' }">
            {{ simResult.savingsRate.toFixed(1) }}%
          </p>
        </div>
      </div>

      <!-- Projection chart -->
      <div style="margin-top: 16px">
        <BaseLineChart :data="simResult.chartData" :height="100" color="var(--primary)" />
      </div>

      <!-- Save scenario button -->
      <div style="display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; align-items: center">
        <input
          v-model="scenarioName"
          placeholder="Nome do cenário (opcional)"
          style="flex: 1; min-width: 180px; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 10px; height: 36px; font-size: 13px; color: var(--text); font-family: inherit; outline: none"
        />
        <button
          style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; border: 1px solid var(--primary); background: var(--primary-dim); color: var(--primary)"
          @click="saveScenario"
        >
          <BaseIcon name="plus" :size="13" color="var(--primary)" /> Salvar cenário
        </button>
        <button
          style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; border: 1px solid var(--border); background: transparent; color: var(--text2)"
          @click="loadFromCurrent"
        >
          <BaseIcon name="grid" :size="13" /> Usar dados atuais
        </button>
      </div>
    </div>

    <!-- Saved scenarios -->
    <div v-if="savedScenarios.length > 0" style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden">
      <div style="padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center">
        <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Cenários salvos</h3>
        <button
          style="font-size: 12px; color: var(--danger); background: none; border: none; cursor: pointer; font-weight: 600"
          @click="clearAll"
        >Limpar todos</button>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px">
        <thead>
          <tr style="background: var(--surface2)">
            <th style="text-align: left; padding: 8px 18px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">Nome</th>
            <th style="text-align: right; padding: 8px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">Renda</th>
            <th style="text-align: right; padding: 8px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">Despesa</th>
            <th style="text-align: right; padding: 8px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">Acumulado</th>
            <th style="text-align: center; padding: 8px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">Meses</th>
            <th style="padding: 8px 14px"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="sc in savedScenarios"
            :key="sc.id"
            style="border-bottom: 1px solid var(--border)"
          >
            <td style="padding: 10px 18px; font-weight: 600; color: var(--text)">{{ sc.name }}</td>
            <td style="padding: 10px 14px; text-align: right; color: var(--success); font-weight: 600">{{ fmt(sc.income) }}</td>
            <td style="padding: 10px 14px; text-align: right; color: var(--danger); font-weight: 600">{{ fmt(sc.expense) }}</td>
            <td style="padding: 10px 14px; text-align: right; font-weight: 700" :style="{ color: sc.accumulated >= 0 ? 'var(--primary)' : 'var(--danger)' }">{{ fmt(sc.accumulated) }}</td>
            <td style="padding: 10px 14px; text-align: center; color: var(--text2)">{{ sc.months }}</td>
            <td style="padding: 10px 14px; text-align: right">
              <div style="display: flex; gap: 4px; justify-content: flex-end">
                <button
                  style="background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 600; color: var(--primary); padding: 4px 8px; border-radius: var(--radius-xs); border: 1px solid var(--primary)"
                  @click="loadScenario(sc)"
                >Carregar</button>
                <button
                  style="background: none; border: none; cursor: pointer; color: var(--danger); padding: 4px"
                  @click="deleteScenario(sc.id)"
                >
                  <BaseIcon name="close" :size="13" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import BaseLineChart from '~/components/base/BaseLineChart.vue'
import BaseIcon      from '~/components/base/BaseIcon.vue'

const store    = useFinanceStore()
const currency = useCurrency()
const fmt      = (v: number) => currency.format(v)

// ── Simulator state ──────────────────────────────────────────
const sim = ref({ income: 3900, expense: 3200, savings: 400, months: 24 })

const loadFromCurrent = () => {
  sim.value.income  = Math.round(store.kpis.totalIncome)
  sim.value.expense = Math.round(store.kpis.totalExpense)
  sim.value.savings = Math.max(0, Math.round(store.kpis.net))
}

const simResult = computed(() => {
  const netPerMonth  = sim.value.income - sim.value.expense
  const savingsRate  = sim.value.income > 0 ? (netPerMonth / sim.value.income) * 100 : 0
  const chartData    = Array.from({ length: sim.value.months }, (_, i) =>
    (netPerMonth + sim.value.savings) * (i + 1)
  )
  const accumulated  = chartData[chartData.length - 1] ?? 0
  return { netPerMonth, savingsRate, accumulated, chartData }
})

// ── Saved scenarios ──────────────────────────────────────────
interface SavedScenario {
  id:          string
  name:        string
  income:      number
  expense:     number
  savings:     number
  months:      number
  accumulated: number
  savedAt:     string
}

const STORAGE_KEY = 'ff-scenarios'
const savedScenarios = ref<SavedScenario[]>([])

const loadFromStorage = () => {
  if (!process.client) return
  try {
    savedScenarios.value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    savedScenarios.value = []
  }
}

const persist = () => {
  if (!process.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedScenarios.value))
}

if (process.client) loadFromStorage()

const scenarioName = ref('')

const saveScenario = () => {
  const sc: SavedScenario = {
    id:          crypto.randomUUID(),
    name:        scenarioName.value.trim() || `Cenário ${savedScenarios.value.length + 1}`,
    income:      sim.value.income,
    expense:     sim.value.expense,
    savings:     sim.value.savings,
    months:      sim.value.months,
    accumulated: simResult.value.accumulated,
    savedAt:     new Date().toISOString()
  }
  savedScenarios.value.unshift(sc)
  persist()
  scenarioName.value = ''
}

const loadScenario = (sc: SavedScenario) => {
  sim.value = { income: sc.income, expense: sc.expense, savings: sc.savings, months: sc.months }
}

const deleteScenario = (id: string) => {
  savedScenarios.value = savedScenarios.value.filter(s => s.id !== id)
  persist()
}

const clearAll = () => {
  savedScenarios.value = []
  persist()
}
</script>

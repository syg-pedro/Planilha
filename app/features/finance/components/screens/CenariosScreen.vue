<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); padding: 20px 22px">
      <h3 style="font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px">Simulador de cenários</h3>
      <p style="font-size: 11px; color: var(--text3); margin-bottom: 20px">Ajuste renda e despesa para visualizar o impacto no saldo projetado</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px">
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Receita mensal (R$)</label>
          <div style="display: flex; align-items: center; gap: 6px; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px">
            <span style="color: var(--text3); font-size: 13px">R$</span>
            <input v-model.number="income" type="number" style="flex: 1; background: transparent; border: none; outline: none; font-size: 13px; color: var(--text); font-family: inherit; min-width: 0" />
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Despesa mensal (R$)</label>
          <div style="display: flex; align-items: center; gap: 6px; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px">
            <span style="color: var(--text3); font-size: 13px">R$</span>
            <input v-model.number="expense" type="number" style="flex: 1; background: transparent; border: none; outline: none; font-size: 13px; color: var(--text); font-family: inherit; min-width: 0" />
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Projeção (meses)</label>
          <div style="display: flex; align-items: center; gap: 6px; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px">
            <input v-model.number="months" type="number" min="1" max="60" style="flex: 1; background: transparent; border: none; outline: none; font-size: 13px; color: var(--text); font-family: inherit; min-width: 0" />
            <span style="color: var(--text3); font-size: 13px">meses</span>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 20px">
        <div style="background: var(--success-light); border: 1px solid var(--success); border-radius: var(--radius-sm); padding: 10px 14px">
          <p style="font-size: 10px; color: var(--success); font-weight: 700; text-transform: uppercase">Poupança/mês</p>
          <p style="font-size: 18px; font-weight: 800; color: var(--success)">{{ fmt(income - expense) }}</p>
        </div>
        <div
          style="border-radius: var(--radius-sm); padding: 10px 14px"
          :style="lastBalance >= 0 ? { background: 'var(--primary-dim)', border: '1px solid var(--primary)' } : { background: 'var(--danger-light)', border: '1px solid var(--danger)' }"
        >
          <p style="font-size: 10px; font-weight: 700; text-transform: uppercase" :style="{ color: lastBalance >= 0 ? 'var(--primary)' : 'var(--danger)' }">Saldo em {{ months }}m</p>
          <p style="font-size: 18px; font-weight: 800" :style="{ color: lastBalance >= 0 ? 'var(--primary)' : 'var(--danger)' }">{{ fmt(lastBalance) }}</p>
        </div>
        <div style="background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px">
          <p style="font-size: 10px; color: var(--text3); font-weight: 700; text-transform: uppercase">Taxa de poupança</p>
          <p style="font-size: 18px; font-weight: 800; color: var(--text)">{{ income > 0 ? (((income - expense) / income) * 100).toFixed(1) : 0 }}%</p>
        </div>
      </div>

      <p style="font-size: 12px; font-weight: 700; color: var(--text2); margin-bottom: 8px">Projeção acumulada</p>
      <BaseLineChart :data="projected" :height="140" :color="lastBalance >= 0 ? 'var(--primary)' : 'var(--danger)'" :fill="true" />
    </div>

    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border)">
        <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Cenários salvos</h3>
        <button style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary); color: #fff">
          <BaseIcon name="plus" :size="13" color="#fff" />Salvar cenário atual
        </button>
      </div>
      <BaseEmptyState icon="scenario" title="Nenhum cenário salvo" body="Ajuste os valores acima e salve para comparar diferentes simulações." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseLineChart from '~/components/base/BaseLineChart.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'

const currency = useCurrency()
const fmt = (v: number) => currency.format(v)

const income = ref(3900)
const expense = ref(3280)
const months = ref(12)

const projected = computed(() => {
  const list: number[] = []
  let bal = 0
  for (let i = 0; i < months.value; i++) {
    bal += income.value - expense.value
    list.push(Math.round(bal))
  }
  return list
})

const lastBalance = computed(() => projected.value[projected.value.length - 1] ?? 0)
</script>

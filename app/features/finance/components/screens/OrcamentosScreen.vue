<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <!-- Summary bar -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 16px 20px; display: flex; flex-wrap: wrap; gap: 16px; align-items: center">
      <div style="flex: 1; min-width: 160px">
        <p style="font-size: 11px; color: var(--text3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em">Total do mês</p>
        <p style="font-size: 22px; font-weight: 800; margin-top: 2px" :style="{ color: totalPct >= 90 ? 'var(--danger)' : 'var(--text)' }">
          {{ fmt(total.spent) }} <span style="font-size: 13px; color: var(--text3); font-weight: 500">/ {{ fmt(total.limit) }}</span>
        </p>
      </div>
      <div style="flex: 2; min-width: 200px">
        <BaseProgressBar :value="total.spent" :max="total.limit" :height="10" />
        <div style="display: flex; justify-content: space-between; margin-top: 4px">
          <span style="font-size: 11px; color: var(--text3)">Consumido: {{ totalPct.toFixed(1) }}%</span>
          <span style="font-size: 11px; color: var(--text3)">Disponível: {{ fmt(total.limit - total.spent) }}</span>
        </div>
      </div>
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary); color: #fff"
        @click="modalOpen = true"
      >
        <BaseIcon name="plus" :size="15" color="#fff" />Novo orçamento
      </button>
    </div>

    <!-- Budget cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px">
      <div
        v-for="b in BUDGET_DATA"
        :key="b.id"
        style="background: var(--surface); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px"
        :style="{ border: bPct(b) >= 90 ? '1px solid var(--danger)' : bPct(b) >= 70 ? '1px solid var(--warning)' : '1px solid var(--border)' }"
      >
        <div style="display: flex; align-items: center; justify-content: space-between">
          <div style="display: flex; align-items: center; gap: 10px">
            <div style="width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center" :style="{ background: b.color + '20' }">
              <BaseIcon :name="b.icon" :size="17" :color="b.color" />
            </div>
            <div>
              <p style="font-size: 14px; font-weight: 700; color: var(--text)">{{ b.cat }}</p>
              <p style="font-size: 11px; color: var(--text3)">Limite: {{ fmt(b.limit) }}</p>
            </div>
          </div>
          <span
            style="display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; white-space: nowrap"
            :style="bPct(b) >= 100 ? { background: 'var(--danger-light)', color: 'var(--danger)' } : bPct(b) >= 90 ? { background: 'var(--danger-light)', color: 'var(--danger)' } : bPct(b) >= 70 ? { background: 'var(--warning-light)', color: 'var(--warning)' } : { background: 'var(--success-light)', color: 'var(--success)' }"
          >{{ bPct(b) >= 100 ? 'Limite atingido' : bPct(b) >= 90 ? 'Crítico' : bPct(b) >= 70 ? 'Atenção' : 'Saudável' }}</span>
        </div>
        <BaseProgressBar :value="b.spent" :max="b.limit" :color="b.color" :height="8" />
        <div style="display: flex; justify-content: space-between">
          <div>
            <p style="font-size: 10px; color: var(--text3)">Gasto</p>
            <p style="font-size: 14px; font-weight: 800" :style="{ color: bPct(b) >= 90 ? 'var(--danger)' : 'var(--text)' }">{{ fmt(b.spent) }}</p>
          </div>
          <div style="text-align: right">
            <p style="font-size: 10px; color: var(--text3)">Disponível</p>
            <p style="font-size: 14px; font-weight: 800" :style="{ color: b.limit - b.spent < 0 ? 'var(--danger)' : 'var(--success)' }">{{ fmt(Math.max(0, b.limit - b.spent)) }}</p>
          </div>
          <div style="text-align: right">
            <p style="font-size: 10px; color: var(--text3)">%</p>
            <p style="font-size: 14px; font-weight: 800" :style="{ color: bPct(b) >= 90 ? 'var(--danger)' : bPct(b) >= 70 ? 'var(--warning)' : 'var(--text)' }">{{ bPct(b).toFixed(0) }}%</p>
          </div>
        </div>
        <div
          v-if="bPct(b) >= 70"
          style="border-radius: var(--radius-xs); padding: 6px 10px; display: flex; align-items: center; gap: 6px"
          :style="{ background: bPct(b) >= 90 ? 'var(--danger-light)' : 'var(--warning-light)' }"
        >
          <BaseIcon name="warning" :size="13" :color="bPct(b) >= 90 ? 'var(--danger)' : 'var(--warning)'" />
          <span style="font-size: 11px; font-weight: 600" :style="{ color: bPct(b) >= 90 ? 'var(--danger)' : 'var(--warning)' }">
            {{ bPct(b) >= 100 ? 'Orçamento esgotado' : `${bPct(b) >= 90 ? 'Alerta' : 'Atenção'}: ${(100 - bPct(b)).toFixed(0)}% restante` }}
          </span>
        </div>
      </div>
    </div>

    <!-- New budget modal -->
    <BaseModal :open="modalOpen" title="Novo orçamento" subtitle="Defina um limite mensal por categoria" @close="modalOpen = false">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
        <div style="display: flex; flex-direction: column; gap: 5px; grid-column: span 2">
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Categoria</label>
          <select style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none">
            <option value="">Selecionar</option>
            <option v-for="b in BUDGET_DATA" :key="b.id" :value="b.id">{{ b.cat }}</option>
          </select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Limite mensal (R$)</label>
          <input type="number" placeholder="0,00" style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; width: 100%" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Alerta em</label>
          <select style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none">
            <option value="70">70%</option>
            <option value="90">90%</option>
            <option value="100">100%</option>
          </select>
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px">
        <button style="display: inline-flex; align-items: center; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)" @click="modalOpen = false">Cancelar</button>
        <button style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary); color: #fff" @click="modalOpen = false">
          <BaseIcon name="check" :size="15" color="#fff" />Criar orçamento
        </button>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseProgressBar from '~/components/base/BaseProgressBar.vue'
import BaseModal from '~/components/base/BaseModal.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'

const currency = useCurrency()
const fmt = (v: number) => currency.format(v)
const modalOpen = ref(false)

const BUDGET_DATA = [
  { id: 'b1', cat: 'Moradia',    icon: 'patrimony',    spent: 1700, limit: 1700, color: '#dc2626' },
  { id: 'b2', cat: 'Cartões',    icon: 'card',         spent: 1654, limit: 1750, color: '#0ea5e9' },
  { id: 'b3', cat: 'Serviços',   icon: 'subscription', spent: 99,   limit: 200,  color: '#f97316' },
  { id: 'b4', cat: 'Educação',   icon: 'goal',         spent: 171,  limit: 300,  color: '#8b5cf6' },
  { id: 'b5', cat: 'Alimentação',icon: 'tag',          spent: 420,  limit: 700,  color: '#16a34a' },
  { id: 'b6', cat: 'Saúde',      icon: 'alerts',       spent: 80,   limit: 300,  color: '#ec4899' },
]

const total = computed(() => ({
  spent: BUDGET_DATA.reduce((s, b) => s + b.spent, 0),
  limit: BUDGET_DATA.reduce((s, b) => s + b.limit, 0),
}))
const totalPct = computed(() => (total.value.spent / total.value.limit) * 100)

function bPct(b: { spent: number; limit: number }) {
  return Math.min(100, (b.spent / b.limit) * 100)
}
</script>

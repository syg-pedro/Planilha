<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px">
      <BaseKpiCard icon="income"  label="Total de ativos"    :value="fmt(totalA)" color="var(--success)" />
      <BaseKpiCard icon="expense" label="Total de passivos"  :value="fmt(totalL)" color="var(--danger)"  />
      <BaseKpiCard icon="balance" label="Patrimônio líquido" :value="fmt(net)"    color="var(--primary)" :sub="net >= 0 ? 'Positivo' : 'Negativo'" />
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
      <!-- Assets -->
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border)">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Ativos</h3>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Total: {{ fmt(totalA) }}</p>
          </div>
          <button style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary-dim); color: var(--primary)">
            <BaseIcon name="plus" :size="13" color="var(--primary)" />Adicionar
          </button>
        </div>
        <div>
          <div v-for="(a, i) in ASSETS" :key="i" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border)">
            <div>
              <p style="font-size: 13px; font-weight: 600; color: var(--text)">{{ a.name }}</p>
              <p style="font-size: 11px; color: var(--text3)">{{ a.type }}</p>
            </div>
            <p style="font-size: 13px; font-weight: 800; color: var(--success)">{{ fmt(a.value) }}</p>
          </div>
          <div style="padding: 10px 16px; display: flex; justify-content: space-between">
            <span style="font-size: 12px; font-weight: 700; color: var(--text)">Total</span>
            <span style="font-size: 14px; font-weight: 800; color: var(--success)">{{ fmt(totalA) }}</span>
          </div>
        </div>
      </div>

      <!-- Liabilities -->
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border)">
          <div>
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Passivos</h3>
            <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Total: {{ fmt(totalL) }}</p>
          </div>
          <button style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary-dim); color: var(--primary)">
            <BaseIcon name="plus" :size="13" color="var(--primary)" />Adicionar
          </button>
        </div>
        <div>
          <div v-for="(l, i) in LIABILITIES" :key="i" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border)">
            <div>
              <p style="font-size: 13px; font-weight: 600; color: var(--text)">{{ l.name }}</p>
              <p style="font-size: 11px; color: var(--text3)">{{ l.type }}</p>
            </div>
            <p style="font-size: 13px; font-weight: 800; color: var(--danger)">{{ fmt(l.value) }}</p>
          </div>
          <div style="padding: 10px 16px; display: flex; justify-content: space-between">
            <span style="font-size: 12px; font-weight: 700; color: var(--text)">Total</span>
            <span style="font-size: 14px; font-weight: 800; color: var(--danger)">{{ fmt(totalL) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)">
        <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Evolução do patrimônio líquido</h3>
        <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Últimos 12 meses</p>
      </div>
      <div style="padding: 16px 18px">
        <BaseLineChart :data="[12000,13200,14100,13800,15600,16200,14200,18000,19200,20100,22400,14200]" :height="120" color="var(--primary)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseKpiCard from '~/components/base/BaseKpiCard.vue'
import BaseLineChart from '~/components/base/BaseLineChart.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'

const currency = useCurrency()
const fmt = (v: number) => currency.format(v)

const ASSETS = [
  { name: 'Conta Pedro (saldo)',   value: 2400, type: 'Conta corrente' },
  { name: 'Conta Juli (saldo)',    value: 1800, type: 'Conta corrente' },
  { name: 'Flash VR acumulado',    value: 800,  type: 'Benefício'       },
  { name: 'Reserva de Emergência', value: 6200, type: 'Poupança/Invest.' },
  { name: 'Moto (bem móvel)',      value: 8000, type: 'Bem'             },
  { name: 'Eletrodomésticos',      value: 4200, type: 'Bem'             },
  { name: 'Investimentos',         value: 5000, type: 'Renda fixa'      },
]

const LIABILITIES = [
  { name: 'Dívida Cartões (total)', value: 3488, type: 'Cartão de crédito' },
  { name: 'Bicicleta (parcelas)',   value: 1854, type: 'Parcelamento'       },
  { name: 'Will Pedro',             value: 460,  type: 'Parcelamento'       },
]

const totalA = computed(() => ASSETS.reduce((s, a) => s + a.value, 0))
const totalL = computed(() => LIABILITIES.reduce((s, a) => s + a.value, 0))
const net = computed(() => totalA.value - totalL.value)
</script>

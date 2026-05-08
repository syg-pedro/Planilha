<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">
      <select v-model="period" style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; min-width: 160px">
        <option value="month">Este mês</option>
        <option value="quarter">Trimestre</option>
        <option value="year">Este ano</option>
        <option value="custom">Personalizado</option>
      </select>
      <button style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)">
        <BaseIcon name="export" :size="14" />Exportar PDF
      </button>
      <button style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)">
        <BaseIcon name="export" :size="14" />Exportar CSV
      </button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px">
      <BaseKpiCard icon="income"  label="Total receitas" :value="fmt(3900)"  color="var(--success)" :trend="0"  />
      <BaseKpiCard icon="expense" label="Total despesas" :value="fmt(3280)"  color="var(--danger)"  :trend="24" />
      <BaseKpiCard icon="balance" label="Saldo período"  :value="fmt(620)"   color="var(--primary)" />
      <BaseKpiCard icon="goal"    label="Taxa poupança"  value="15.9%"        color="var(--warning)" sub="Meta: 20%" />
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px">
      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Despesas por categoria</h3>
        </div>
        <div style="padding: 16px 18px">
          <div v-for="c in CATEGORIES" :key="c.name" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px">
            <span style="font-size: 12px; color: var(--text2); min-width: 90px">{{ c.name }}</span>
            <div style="flex: 1; height: 7px; background: var(--bg2); border-radius: 99px; overflow: hidden">
              <div :style="{ width: `${c.pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '99px' }" />
            </div>
            <span style="font-size: 12px; font-weight: 700; color: var(--text); min-width: 70px; text-align: right">{{ fmt(c.v) }}</span>
          </div>
        </div>
      </div>

      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Comparativo mensal</h3>
        </div>
        <div style="padding: 16px 18px">
          <BaseBarChart :data="[{month:'Mar',income:3900,expense:3150,current:false},{month:'Abr',income:3900,expense:2640,current:false},{month:'Mai',income:3900,expense:3280,current:true}]" :height="140" />
        </div>
      </div>

      <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
        <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Por pessoa</h3>
          <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Pedro vs. Juli</p>
        </div>
        <div style="padding: 16px 18px">
          <div v-for="p in PERSONS" :key="p.name" style="margin-bottom: 14px">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px">
              <span style="font-size: 13px; font-weight: 700; color: var(--text)">{{ p.name }}</span>
              <span style="font-size: 12px; font-weight: 700" :style="{ color: (p.income - p.expense) >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(p.income - p.expense) }}</span>
            </div>
            <div style="height: 7px; background: var(--bg2); border-radius: 99px; overflow: hidden">
              <div :style="{ width: `${Math.min(100, (p.expense / p.income) * 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: '99px' }" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseKpiCard from '~/components/base/BaseKpiCard.vue'
import BaseBarChart from '~/components/base/BaseBarChart.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'

const currency = useCurrency()
const fmt = (v: number) => currency.format(v)
const period = ref('month')

const CATEGORIES = [
  { name: 'Cartões',    pct: 50, v: 1654 },
  { name: 'Moradia',   pct: 52, v: 1700 },
  { name: 'Educação',  pct: 5,  v: 171  },
  { name: 'Serviços',  pct: 3,  v: 99   },
  { name: 'Alimentação', pct: 13, v: 420 },
]

const PERSONS = [
  { name: 'Pedro', income: 2800, expense: 2900 },
  { name: 'Juli',  income: 1100, expense: 380  },
]
</script>

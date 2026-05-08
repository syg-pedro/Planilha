<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <div style="display: flex; gap: 12px; flex-wrap: wrap">
      <BaseKpiCard icon="planning" label="Receita anual projetada" :value="fmt(3900 * 12)" color="var(--success)" style="flex: 1; min-width: 180px" />
      <BaseKpiCard icon="expense"  label="Despesa anual projetada" :value="fmt(annualExpense)" color="var(--warning)" style="flex: 1; min-width: 180px" />
      <BaseKpiCard icon="warning"  label="Meses de risco"         :value="`${riskMonths} meses`" color="var(--danger)" style="flex: 1; min-width: 180px" />
    </div>

    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)">
        <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Visão anual — 2026</h3>
        <p style="font-size: 11px; color: var(--text3); margin-top: 2px">Receita vs despesa projetada por mês</p>
      </div>
      <div style="overflow-x: auto">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px">
          <thead>
            <tr style="background: var(--surface2); border-bottom: 1px solid var(--border)">
              <th style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">Mês</th>
              <th style="padding: 10px 14px; text-align: right; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">Receita</th>
              <th style="padding: 10px 14px; text-align: right; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">Despesa</th>
              <th style="padding: 10px 14px; text-align: right; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">Saldo</th>
              <th style="padding: 10px 14px; text-align: center; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">Status</th>
              <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">Barra</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(d, i) in DATA"
              :key="i"
              style="border-bottom: 1px solid var(--border)"
              :style="{ background: i === curM ? 'var(--primary-dim)' : d.risk ? 'var(--danger-light)' : 'transparent' }"
            >
              <td style="padding: 10px 14px; font-weight: 700; white-space: nowrap" :style="{ color: i === curM ? 'var(--primary)' : 'var(--text)' }">
                {{ MONTHS[i] }}
                <span v-if="i === curM" style="display: inline-flex; margin-left: 6px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--primary-dim); color: var(--primary)">Atual</span>
              </td>
              <td style="padding: 10px 14px; text-align: right; color: var(--success); font-weight: 600">{{ fmt(d.income) }}</td>
              <td style="padding: 10px 14px; text-align: right; color: var(--danger); font-weight: 600">{{ fmt(d.expense) }}</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: 800" :style="{ color: (d.income - d.expense) >= 0 ? 'var(--success)' : 'var(--danger)' }">{{ fmt(d.income - d.expense) }}</td>
              <td style="padding: 10px 14px; text-align: center">
                <span
                  style="display: inline-flex; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700"
                  :style="d.risk ? { background: 'var(--danger-light)', color: 'var(--danger)' } : (d.income - d.expense) >= 0 ? { background: 'var(--success-light)', color: 'var(--success)' } : { background: 'var(--warning-light)', color: 'var(--warning)' }"
                >{{ d.risk ? '⚠ Risco' : (d.income - d.expense) >= 0 ? 'OK' : 'Atenção' }}</span>
              </td>
              <td style="padding: 10px 14px; min-width: 120px">
                <div style="height: 6px; background: var(--bg2); border-radius: 99px; overflow: hidden">
                  <div :style="{ width: `${Math.min(100, (d.expense / d.income) * 100)}%`, height: '100%', borderRadius: '99px', background: d.risk ? 'var(--danger)' : 'var(--primary)' }" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseKpiCard from '~/components/base/BaseKpiCard.vue'

const currency = useCurrency()
const fmt = (v: number) => currency.format(v)
const curM = new Date().getMonth()

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const DATA = [
  { income: 3900, expense: 2780, risk: false },
  { income: 3900, expense: 3150, risk: false },
  { income: 3900, expense: 2640, risk: false },
  { income: 3900, expense: 2610, risk: false },
  { income: 3900, expense: 3280, risk: true  },
  { income: 3900, expense: 2950, risk: false },
  { income: 3900, expense: 2800, risk: false },
  { income: 3900, expense: 4200, risk: true  },
  { income: 3900, expense: 2900, risk: false },
  { income: 3900, expense: 3100, risk: false },
  { income: 3900, expense: 3600, risk: true  },
  { income: 3900, expense: 4800, risk: true  },
]

const annualExpense = computed(() => DATA.reduce((s, d) => s + d.expense, 0))
const riskMonths = computed(() => DATA.filter(d => d.risk).length)
</script>

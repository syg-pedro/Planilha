<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px">
      <BaseKpiCard icon="debt"     label="Saldo devedor total"  :value="fmt(totalDebt)"      color="var(--danger)"  :sub="`${DEBTS_DATA.length} compromissos`" />
      <BaseKpiCard icon="calendar" label="Parcelas este mês"    :value="fmt(monthlyTotal)"    color="var(--warning)" sub="Vencimento maio" />
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px">
      <div
        v-for="(d, i) in DEBTS_DATA"
        :key="i"
        style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 16px; box-shadow: var(--shadow-sm); cursor: pointer; transition: box-shadow 0.15s"
        @click="selected = selected === i ? null : i"
        @mouseenter="($event.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'"
        @mouseleave="($event.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'"
      >
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px">
          <div>
            <p style="font-size: 14px; font-weight: 700; color: var(--text)">{{ d.name }}</p>
            <p style="font-size: 11px; color: var(--text3)">{{ d.paid }}/{{ d.total }} parcelas pagas</p>
          </div>
          <div style="text-align: right">
            <p style="font-size: 16px; font-weight: 800; color: var(--danger)">{{ fmt(d.balance) }}</p>
            <p style="font-size: 11px; color: var(--text3)">saldo devedor</p>
          </div>
        </div>
        <BaseProgressBar :value="d.paid" :max="d.total" :color="d.color" :height="6" />
        <div style="display: flex; justify-content: space-between; margin-top: 6px">
          <span style="font-size: 11px; color: var(--text3)">{{ d.total - d.paid }} restantes</span>
          <span v-if="d.rate > 0" style="display: inline-flex; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--warning-light); color: var(--warning)">Juros {{ d.rate }}% a.m.</span>
        </div>

        <!-- Expanded installment schedule -->
        <div v-if="selected === i" style="margin-top: 14px; border-top: 1px solid var(--border); padding-top: 12px">
          <p style="font-size: 12px; font-weight: 700; color: var(--text2); margin-bottom: 8px">Cronograma de parcelas</p>
          <div style="display: flex; gap: 4px; flex-wrap: wrap">
            <div
              v-for="(v, j) in d.installments"
              :key="j"
              style="border-radius: 6px; padding: 4px 8px; text-align: center; min-width: 52px"
              :style="{
                background: j < d.paid ? 'var(--success-light)' : 'var(--surface2)',
                border: j < d.paid ? '1px solid var(--success)' : j === d.paid ? `1px solid ${d.color}` : '1px solid var(--border)',
              }"
            >
              <p style="font-size: 9px; color: var(--text3); font-weight: 700">{{ j + 1 }}/{{ d.total }}</p>
              <p style="font-size: 11px; font-weight: 700" :style="{ color: j < d.paid ? 'var(--success)' : j === d.paid ? d.color : 'var(--text)' }">{{ fmt(v) }}</p>
            </div>
          </div>
          <div style="margin-top: 12px; display: flex; gap: 8px">
            <button style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary-dim); color: var(--primary)">
              <BaseIcon name="scenario" :size="13" color="var(--primary)" />Simular antecipação
            </button>
            <button style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary); color: #fff">
              <BaseIcon name="check" :size="13" color="#fff" />Marcar como pago
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseKpiCard from '~/components/base/BaseKpiCard.vue'
import BaseProgressBar from '~/components/base/BaseProgressBar.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'

const currency = useCurrency()
const fmt = (v: number) => currency.format(v)
const selected = ref<number | null>(null)

const DEBTS_DATA = [
  { name: 'Sicredi Pedro',   balance: 284.82,  rate: 0,   installments: [484.75, 47.82, 47.82, 47.82, 47.82, 47.82],                   total: 6,  paid: 0, color: 'var(--primary)' },
  { name: 'Itaú Pedro',      balance: 1820.62, rate: 0,   installments: [297.54, ...Array(8).fill(231.18)],                              total: 9,  paid: 0, color: 'var(--warning)' },
  { name: 'Nubank Pedro',    balance: 1068.70, rate: 0,   installments: [589.90, 102.60, ...Array(10).fill(102.60)],                     total: 12, paid: 0, color: 'var(--danger)'  },
  { name: 'Bicicleta (tia)', balance: 1854,    rate: 0,   installments: Array(10).fill(206),                                            total: 10, paid: 0, color: 'var(--accent)'  },
  { name: 'Will Pedro',      balance: 460.25,  rate: 2.5, installments: [281.89, 281.89, 79.81, 48.66, 48.66, 48.66],                   total: 7,  paid: 1, color: '#94a3b8'        },
]

const totalDebt = computed(() => DEBTS_DATA.reduce((s, d) => s + d.balance, 0))
const monthlyTotal = computed(() => DEBTS_DATA.reduce((s, d) => s + (d.installments[d.paid] ?? 0), 0))
</script>

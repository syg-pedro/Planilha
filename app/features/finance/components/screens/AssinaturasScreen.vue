<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px">
      <BaseKpiCard icon="subscription" label="Mensal total"   :value="fmt(monthlyTotal)"  color="var(--primary)" :sub="`${activeCount} ativas`" />
      <BaseKpiCard icon="reports"      label="Anual estimado" :value="fmt(annualTotal)"    color="var(--warning)" sub="Todas as assinaturas" />
      <BaseKpiCard icon="alerts"       label="Próx. 7 dias"   :value="fmt(next7Total)"     color="var(--danger)"  sub="A vencer" />
    </div>

    <!-- Table -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border)">
        <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Todas as assinaturas</h3>
        <button style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary); color: #fff">
          <BaseIcon name="plus" :size="13" color="#fff" />Adicionar
        </button>
      </div>
      <div style="overflow-x: auto">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px">
          <thead>
            <tr style="background: var(--surface2); border-bottom: 1px solid var(--border)">
              <th v-for="h in ['Serviço', 'Ciclo', 'Próx. cobrança', 'Valor', 'Variação', 'Status', '']" :key="h" style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(s, i) in SUBS_DATA"
              :key="i"
              style="border-bottom: 1px solid var(--border); transition: background 0.1s"
              :style="{ opacity: s.status === 'paused' ? 0.6 : 1 }"
              @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--surface2)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
            >
              <td style="padding: 12px 14px; font-weight: 700; color: var(--text)">{{ s.name }}</td>
              <td style="padding: 12px 14px"><span style="display: inline-flex; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--surface2); color: var(--text2)">{{ s.cycle }}</span></td>
              <td style="padding: 12px 14px; color: var(--text2)">{{ fmtDate(s.nextDate) }}</td>
              <td style="padding: 12px 14px; font-weight: 800; color: var(--text)">{{ fmt(s.amount) }}</td>
              <td style="padding: 12px 14px">
                <span v-if="s.variation" style="display: inline-flex; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--warning-light); color: var(--warning)">↑ {{ s.variation }}%</span>
                <span v-else style="color: var(--text3)">—</span>
              </td>
              <td style="padding: 12px 14px">
                <span
                  style="display: inline-flex; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700"
                  :style="s.status === 'active' ? { background: 'var(--success-light)', color: 'var(--success)' } : { background: 'var(--surface2)', color: 'var(--text2)' }"
                >{{ s.status === 'active' ? 'Ativa' : 'Pausada' }}</span>
              </td>
              <td style="padding: 12px 14px">
                <div style="display: flex; gap: 6px">
                  <button style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)">
                    <BaseIcon name="edit" :size="12" />Editar
                  </button>
                  <button style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)">
                    <BaseIcon name="close" :size="12" />Cancelar
                  </button>
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
import BaseIcon from '~/components/base/BaseIcon.vue'

const currency = useCurrency()
const fmt = (v: number) => currency.format(v)
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

const SUBS_DATA = [
  { name: 'Netflix',    amount: 55.90,  cycle: 'mensal', nextDate: '2026-05-15', status: 'active', variation: null },
  { name: 'Spotify',    amount: 21.90,  cycle: 'mensal', nextDate: '2026-05-18', status: 'active', variation: null },
  { name: 'Faculdade',  amount: 170.73, cycle: 'mensal', nextDate: '2026-05-08', status: 'active', variation: 2.1  },
  { name: 'iCloud+',    amount: 16.90,  cycle: 'mensal', nextDate: '2026-05-20', status: 'active', variation: null },
  { name: 'Office 365', amount: 37.90,  cycle: 'anual',  nextDate: '2026-11-01', status: 'active', variation: null },
  { name: 'Antivírus',  amount: 89.90,  cycle: 'anual',  nextDate: '2026-09-15', status: 'paused', variation: null },
]

const monthlyTotal = computed(() => SUBS_DATA.filter(s => s.status === 'active' && s.cycle === 'mensal').reduce((s, a) => s + a.amount, 0))
const annualTotal = computed(() => SUBS_DATA.filter(s => s.status === 'active').reduce((s, a) => s + (a.cycle === 'anual' ? a.amount : a.amount * 12), 0))
const activeCount = computed(() => SUBS_DATA.filter(s => s.status === 'active').length)
const next7Total = computed(() => {
  const now = new Date()
  const in7 = new Date()
  in7.setDate(now.getDate() + 7)
  return SUBS_DATA.filter(s => { const d = new Date(s.nextDate); return d >= now && d <= in7 }).reduce((s, a) => s + a.amount, 0)
})
</script>

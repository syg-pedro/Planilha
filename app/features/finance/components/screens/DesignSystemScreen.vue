<template>
  <div style="display: flex; flex-direction: column; gap: 20px">
    <div>
      <h2 style="font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 4px">Design System — Financeiro Familiar v2</h2>
      <p style="font-size: 13px; color: var(--text3)">Referência de componentes, tokens de cor, tipografia e espaçamento.</p>
    </div>

    <!-- Colors -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)"><h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Paleta de cores</h3></div>
      <div style="padding: 16px 18px; display: flex; flex-wrap: wrap; gap: 10px">
        <div v-for="c in COLORS" :key="c.name" style="display: flex; flex-direction: column; gap: 6px; align-items: center">
          <div :style="{ width: '52px', height: '52px', borderRadius: 'var(--radius-sm)', background: `var(${c.var})`, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }" />
          <span style="font-size: 10px; font-weight: 700; color: var(--text2)">{{ c.name }}</span>
        </div>
      </div>
    </div>

    <!-- Typography -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)"><h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Tipografia — Plus Jakarta Sans</h3></div>
      <div style="padding: 16px 18px">
        <div v-for="t in TYPOGRAPHY" :key="t.label" style="padding: 10px 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 16px">
          <span style="font-size: 10px; color: var(--text3); font-weight: 700; min-width: 180px">{{ t.label }}</span>
          <span :style="{ fontSize: `${t.size}px`, fontWeight: t.weight, color: 'var(--text)', flex: 1 }">{{ t.text }}</span>
        </div>
      </div>
    </div>

    <!-- Badges -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)"><h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Badges</h3></div>
      <div style="padding: 16px 18px; display: flex; flex-wrap: wrap; gap: 8px">
        <span style="display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--success-light); color: var(--success)">Pago</span>
        <span style="display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--danger-light); color: var(--danger)">Urgente</span>
        <span style="display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--warning-light); color: var(--warning)">Atenção</span>
        <span style="display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--primary-dim); color: var(--primary)">Ativo</span>
        <span style="display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--surface2); color: var(--text2)">Neutro</span>
        <span style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--success-light); color: var(--success)"><span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor" />Com dot</span>
        <span style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--danger-light); color: var(--danger)"><span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor" />Crítico</span>
      </div>
    </div>

    <!-- KPI Cards -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)"><h3 style="font-size: 14px; font-weight: 700; color: var(--text)">KPI Cards</h3></div>
      <div style="padding: 16px 18px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px">
        <BaseKpiCard icon="income"  label="Receitas" value="R$ 3.900"  color="var(--success)" :trend="3" />
        <BaseKpiCard icon="expense" label="Despesas" value="R$ 3.280"  color="var(--danger)"  :trend="-8" />
        <BaseKpiCard icon="balance" label="Saldo"    value="R$ 620"    color="var(--primary)" />
        <BaseKpiCard icon="alerts"  label="Alertas"  value="3 ativos"  color="var(--warning)" :alert="true" />
      </div>
    </div>

    <!-- Progress Bars -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)"><h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Barras de progresso</h3></div>
      <div style="padding: 16px 18px; display: flex; flex-direction: column; gap: 12px">
        <div v-for="pb in PROGRESS_BARS" :key="pb.label">
          <p style="font-size: 12px; color: var(--text3); margin-bottom: 6px">{{ pb.label }}</p>
          <BaseProgressBar :value="pb.value" />
        </div>
      </div>
    </div>

    <!-- Donut Rings -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)"><h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Donut Rings</h3></div>
      <div style="padding: 16px 18px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center">
        <div v-for="dr in DONUTS" :key="dr.label" style="display: flex; flex-direction: column; align-items: center; gap: 6px">
          <BaseDonutRing :percent="dr.value" :color="dr.color" :size="64" :stroke="7" :label="`${dr.value}%`" />
          <span style="font-size: 11px; color: var(--text3)">{{ dr.label }}</span>
        </div>
      </div>
    </div>

    <!-- Icons -->
    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)"><h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Ícones</h3></div>
      <div style="padding: 16px 18px; display: flex; flex-wrap: wrap; gap: 16px">
        <div v-for="ic in ICONS" :key="ic" style="display: flex; flex-direction: column; align-items: center; gap: 6px">
          <BaseIcon :name="ic" :size="24" color="var(--primary)" />
          <span style="font-size: 9px; color: var(--text3)">{{ ic }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseKpiCard from '~/components/base/BaseKpiCard.vue'
import BaseProgressBar from '~/components/base/BaseProgressBar.vue'
import BaseDonutRing from '~/components/base/BaseDonutRing.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'

const COLORS = [
  { name: 'Primary',   var: '--primary'   },
  { name: 'Success',   var: '--success'   },
  { name: 'Danger',    var: '--danger'    },
  { name: 'Warning',   var: '--warning'   },
  { name: 'Accent',    var: '--accent'    },
  { name: 'Surface',   var: '--surface'   },
  { name: 'Surface 2', var: '--surface2'  },
  { name: 'BG',        var: '--bg'        },
]

const TYPOGRAPHY = [
  { label: 'Display / 800 / 28px', size: 28, weight: 800, text: 'Financeiro Familiar' },
  { label: 'H1 / 700 / 22px',      size: 22, weight: 700, text: 'Dashboard mensal'    },
  { label: 'H2 / 700 / 18px',      size: 18, weight: 700, text: 'Orçamentos do mês'  },
  { label: 'H3 / 700 / 15px',      size: 15, weight: 700, text: 'Cartão Nubank'       },
  { label: 'Body / 500 / 13px',    size: 13, weight: 500, text: 'Lançamento recorrente mensal' },
  { label: 'Caption / 600 / 11px', size: 11, weight: 600, text: 'CATEGORIA · DESPESA' },
]

const PROGRESS_BARS = [
  { label: 'Saudável (40%)',  value: 40  },
  { label: 'Atenção (72%)',   value: 72  },
  { label: 'Crítico (92%)',   value: 92  },
  { label: 'Esgotado (100%)', value: 100 },
]

const DONUTS = [
  { label: 'Saudável',  value: 62,  color: 'var(--success)' },
  { label: 'Atenção',   value: 78,  color: 'var(--warning)' },
  { label: 'Crítico',   value: 94,  color: 'var(--danger)'  },
  { label: 'Esgotado',  value: 100, color: 'var(--danger)'  },
]

const ICONS = ['dashboard','grid','calendar','settings','budget','goal','subscription','debt','patrimony','planning','scenario','reports','reconcile','alerts','income','expense','balance','pending','card','plus','close','check','edit','export','refresh','warning','info','sparkle','menu','chevron_down','chevron_left','arrow_up_right','lock','user']
</script>

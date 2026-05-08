<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <div style="display: flex; justify-content: space-between; align-items: center">
      <div>
        <h2 style="font-size: 16px; font-weight: 800; color: var(--text)">Alertas inteligentes</h2>
        <p style="font-size: 12px; color: var(--text3)">{{ visible.length }} alertas ativos</p>
      </div>
      <button
        style="display: inline-flex; align-items: center; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)"
        @click="dismissAll"
      >Limpar todos</button>
    </div>

    <BaseEmptyState v-if="visible.length === 0" icon="check" title="Tudo em ordem!" body="Nenhum alerta ativo no momento." />

    <div v-else style="display: flex; flex-direction: column; gap: 10px">
      <div
        v-for="(a, i) in visible"
        :key="i"
        style="border-radius: var(--radius); padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start"
        :style="{ background: bgMap[a.tone], border: `1px solid ${borderMap[a.tone]}` }"
      >
        <div
          style="width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px"
          :style="{ background: borderMap[a.tone] + '22' }"
        >
          <BaseIcon :name="a.icon" :size="18" :color="borderMap[a.tone]" />
        </div>
        <div style="flex: 1; min-width: 0">
          <p style="font-size: 14px; font-weight: 700; color: var(--text)">{{ a.title }}</p>
          <p style="font-size: 12px; color: var(--text2); margin-top: 3px">{{ a.body }}</p>
          <button v-if="a.action" style="margin-top: 8px; font-size: 12px; font-weight: 700; background: none; border: none; cursor: pointer; padding: 0" :style="{ color: borderMap[a.tone] }">{{ a.action }} →</button>
        </div>
        <button
          style="background: none; border: none; cursor: pointer; color: var(--text3); padding: 4px; border-radius: 6px; display: flex"
          @click="dismiss(i)"
        >
          <BaseIcon name="close" :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'

const dismissed = ref<number[]>([])

const ALL_ALERTS = [
  { tone: 'danger',  icon: 'card',    title: 'Nubank vence em 3 dias',         body: 'Fatura de R$ 589,90 ainda não paga. Risco de juros.',  action: 'Marcar como pago' },
  { tone: 'warning', icon: 'budget',  title: 'Orçamento de Cartões em 94%',     body: 'Você usou R$ 1.654 de R$ 1.750. Evite novos gastos.', action: 'Ver orçamento'    },
  { tone: 'warning', icon: 'expense', title: 'Gasto fora do padrão detectado',  body: 'Despesa de Alimentação 38% acima da média.',           action: 'Ver lançamentos'  },
  { tone: 'info',    icon: 'goal',    title: 'Meta Reserva: aporte pendente',   body: 'Contribua R$ 400 para ficar no ritmo.',               action: 'Aportar'          },
  { tone: 'success', icon: 'check',   title: 'Salário Pedro creditado',         body: 'R$ 1.000 disponível na Conta Pedro.',                 action: null               },
  { tone: 'info',    icon: 'alerts',  title: 'Will Pedro: banco inativo',       body: 'Parcela de R$ 281,89 vence dia 15. Atenção!',         action: 'Ver dívida'       },
]

const visible = computed(() => ALL_ALERTS.filter((_, i) => !dismissed.value.includes(i)))

const bgMap: Record<string, string> = {
  danger: 'var(--danger-light)', warning: 'var(--warning-light)', info: 'var(--primary-dim)', success: 'var(--success-light)',
}
const borderMap: Record<string, string> = {
  danger: 'var(--danger)', warning: 'var(--warning)', info: 'var(--primary)', success: 'var(--success)',
}

const dismiss = (visibleIdx: number) => {
  const alert = visible.value[visibleIdx]
  const realIdx = ALL_ALERTS.indexOf(alert)
  if (realIdx >= 0) dismissed.value = [...dismissed.value, realIdx]
}

const dismissAll = () => {
  dismissed.value = ALL_ALERTS.map((_, i) => i)
}
</script>

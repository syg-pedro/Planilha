<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <div style="display: flex; justify-content: space-between; align-items: center">
      <div>
        <h2 style="font-size: 16px; font-weight: 800; color: var(--text)">Minhas metas</h2>
        <p style="font-size: 12px; color: var(--text3)">Acompanhe cada objetivo financeiro</p>
      </div>
      <button
        style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary); color: #fff"
        @click="modalOpen = true"
      >
        <BaseIcon name="plus" :size="15" color="#fff" />Nova meta
      </button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px">
      <div
        v-for="g in GOALS_DATA"
        :key="g.id"
        style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 18px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 14px"
      >
        <div style="display: flex; align-items: flex-start; gap: 12px">
          <BaseDonutRing :percent="(g.current / g.target) * 100" :color="g.color" :size="64" :stroke="7" :label="`${Math.round((g.current / g.target) * 100)}%`" />
          <div style="flex: 1; min-width: 0">
            <p style="font-size: 15px; font-weight: 800; color: var(--text)">{{ g.name }}</p>
            <p style="font-size: 12px; color: var(--text3); margin-top: 2px">Previsão: {{ g.deadline }}</p>
            <div style="display: flex; gap: 6px; margin-top: 6px">
              <span style="display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--primary-dim); color: var(--primary)">
                {{ Math.ceil((g.target - g.current) / g.monthly) }} meses restantes
              </span>
            </div>
          </div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px">
            <span style="font-size: 12px; color: var(--text3)">Progresso</span>
            <span style="font-size: 12px; font-weight: 700" :style="{ color: g.color }">{{ fmt(g.current) }} / {{ fmt(g.target) }}</span>
          </div>
          <BaseProgressBar :value="g.current" :max="g.target" :color="g.color" :height="8" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">
          <div style="background: var(--surface2); border-radius: var(--radius-xs); padding: 8px 10px; border: 1px solid var(--border)">
            <p style="font-size: 10px; color: var(--text3); font-weight: 700">Falta</p>
            <p style="font-size: 13px; font-weight: 800; color: var(--text)">{{ fmt(g.target - g.current) }}</p>
          </div>
          <div style="background: var(--surface2); border-radius: var(--radius-xs); padding: 8px 10px; border: 1px solid var(--border)">
            <p style="font-size: 10px; color: var(--text3); font-weight: 700">Aporte sugerido</p>
            <p style="font-size: 13px; font-weight: 800" :style="{ color: g.color }">{{ fmt(g.monthly) }}/mês</p>
          </div>
        </div>
        <div style="display: flex; gap: 8px">
          <button style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary); color: #fff">
            <BaseIcon name="plus" :size="13" color="#fff" />Aportar
          </button>
          <button style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)">
            <BaseIcon name="edit" :size="13" />Editar
          </button>
        </div>
      </div>
    </div>

    <BaseModal :open="modalOpen" title="Nova meta" subtitle="Defina seu objetivo e acompanhe o progresso" @close="modalOpen = false">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
        <div style="display: flex; flex-direction: column; gap: 5px; grid-column: span 2">
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Nome da meta</label>
          <input type="text" placeholder="Ex.: Viagem para Europa" style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; width: 100%" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Valor alvo (R$)</label>
          <input type="number" placeholder="5.000,00" style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; width: 100%" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Saldo atual (R$)</label>
          <input type="number" placeholder="0,00" style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; width: 100%" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Aporte mensal (R$)</label>
          <input type="number" placeholder="300,00" style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; width: 100%" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px">
          <label style="font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em">Prazo desejado</label>
          <input type="month" style="background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-xs); padding: 0 12px; height: 38px; font-size: 13px; color: var(--text); font-family: inherit; outline: none; width: 100%" />
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px">
        <button style="display: inline-flex; align-items: center; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; background: transparent; color: var(--text2); border: 1px solid var(--border)" @click="modalOpen = false">Cancelar</button>
        <button style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary); color: #fff" @click="modalOpen = false">
          <BaseIcon name="check" :size="15" color="#fff" />Criar meta
        </button>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseDonutRing from '~/components/base/BaseDonutRing.vue'
import BaseProgressBar from '~/components/base/BaseProgressBar.vue'
import BaseModal from '~/components/base/BaseModal.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'

const currency = useCurrency()
const fmt = (v: number) => currency.format(v)
const modalOpen = ref(false)

const GOALS_DATA = [
  { id: 'g1', name: 'Reserva de Emergência', current: 6200,  target: 10000, monthly: 400, color: 'var(--success)', icon: 'lock',    deadline: 'Dez 2026' },
  { id: 'g2', name: 'Viagem de Férias',      current: 1800,  target: 5000,  monthly: 320, color: 'var(--primary)', icon: 'planning', deadline: 'Jan 2027' },
  { id: 'g3', name: 'Troca do Celular',      current: 400,   target: 1500,  monthly: 200, color: 'var(--accent)',  icon: 'sparkle',  deadline: 'Set 2026' },
  { id: 'g4', name: 'Entrada do Carro',      current: 3200,  target: 15000, monthly: 600, color: 'var(--warning)', icon: 'scenario', deadline: 'Jun 2028' },
]
</script>

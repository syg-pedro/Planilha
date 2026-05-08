<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
      <span style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--warning-light); color: var(--warning)">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor" />{{ pending.length }} pendentes
      </span>
      <span style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--success-light); color: var(--success)">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor" />{{ matched.length }} conciliados
      </span>
      <span style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--danger-light); color: var(--danger)">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor" />{{ diverged.length }} divergências
      </span>
      <button
        style="display: inline-flex; align-items: center; gap: 6px; margin-left: auto; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer; background: var(--primary); color: #fff"
        @click="confirmAll"
      >
        <BaseIcon name="check" :size="13" color="#fff" />Confirmar todos
      </button>
    </div>

    <div style="background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden">
      <div style="padding: 14px 18px; border-bottom: 1px solid var(--border)">
        <h3 style="font-size: 14px; font-weight: 700; color: var(--text)">Lançamentos para conciliar</h3>
      </div>
      <div style="overflow-x: auto">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px">
          <thead>
            <tr style="background: var(--surface2); border-bottom: 1px solid var(--border)">
              <th v-for="h in ['Data', 'Descrição', 'Valor', 'Status', 'Ação']" :key="h" style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.id"
              style="border-bottom: 1px solid var(--border)"
              :style="{ background: item.matched ? 'var(--success-light)' : item.diverge ? 'var(--danger-light)' : 'transparent' }"
            >
              <td style="padding: 11px 14px; color: var(--text2); white-space: nowrap">{{ fmtDate(item.date) }}</td>
              <td style="padding: 11px 14px; font-weight: 600; color: var(--text)">{{ item.title }}</td>
              <td style="padding: 11px 14px; font-weight: 800; color: var(--text)">{{ fmt(item.amount) }}</td>
              <td style="padding: 11px 14px">
                <span
                  style="display: inline-flex; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700"
                  :style="item.matched ? { background: 'var(--success-light)', color: 'var(--success)' } : item.diverge ? { background: 'var(--danger-light)', color: 'var(--danger)' } : { background: 'var(--warning-light)', color: 'var(--warning)' }"
                >{{ item.matched ? 'Conciliado' : item.diverge ? 'Divergência' : 'Pendente' }}</span>
              </td>
              <td style="padding: 11px 14px">
                <button
                  v-if="!item.matched"
                  style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); border: none; cursor: pointer"
                  :style="item.diverge ? { background: 'var(--danger)', color: '#fff' } : { background: 'var(--primary)', color: '#fff' }"
                  @click="confirm(item.id)"
                >
                  <BaseIcon name="check" :size="13" color="#fff" />{{ item.diverge ? 'Revisar' : 'Confirmar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseIcon from '~/components/base/BaseIcon.vue'

const currency = useCurrency()
const fmt = (v: number) => currency.format(v)
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

const items = ref([
  { id: 1, title: 'Supermercado Extra',  amount: 156.40, date: '2026-05-01', matched: false, diverge: false },
  { id: 2, title: 'Posto Ipiranga',      amount: 180.00, date: '2026-05-02', matched: true,  diverge: false },
  { id: 3, title: 'iFood',               amount: 43.50,  date: '2026-05-03', matched: false, diverge: true  },
  { id: 4, title: 'Farmácia Drogasil',   amount: 67.90,  date: '2026-05-04', matched: true,  diverge: false },
  { id: 5, title: 'Transferência Pedro', amount: 500.00, date: '2026-05-05', matched: false, diverge: false },
])

const pending  = computed(() => items.value.filter(i => !i.matched))
const matched  = computed(() => items.value.filter(i => i.matched))
const diverged = computed(() => items.value.filter(i => i.diverge))

const confirm = (id: number) => {
  items.value = items.value.map(i => i.id === id ? { ...i, matched: true } : i)
}

const confirmAll = () => {
  items.value = items.value.map(i => ({ ...i, matched: true }))
}
</script>

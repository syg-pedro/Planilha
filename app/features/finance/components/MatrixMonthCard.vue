<template>
  <section class="neo-panel mcard">
    <header class="mcard-head">
      <h2>{{ label }}</h2><strong class="ds-money" :class="income - expense >= 0 ? 'positive' : 'negative'">{{ format(income - expense) }}</strong>
      <button type="button" class="mcard-clear" :aria-label="`Apagar valores de ${label}`" :disabled="saving" @click="$emit('clear')">⌫</button>
    </header>
    <template v-for="kind in kinds" :key="kind.value">
      <h3 class="mcard-group">{{ kind.label }}</h3>
      <div v-for="row in rows.filter(row => row.kind === kind.value)" :key="row.key" class="mcard-row">
        <button type="button" class="mcard-edit" :aria-label="`Editar ${row.title}`" :disabled="saving" @click="$emit('edit', row.kind, row.title, $event)">
          <span class="mcard-row-title">{{ row.title }}</span><span class="mcard-row-sub">Vence dia {{ row.day }}</span>
        </button>
        <div class="mcard-row-side">
          <input
v-if="editingKey === row.key" :value="value" class="mcard-input" inputmode="decimal" :aria-label="`Valor de ${row.title}`"
            :disabled="saving" @input="$emit('update:value', ($event.target as HTMLInputElement).value)"
            @blur="$emit('save', row.kind, row.title)" @keydown.enter.prevent="$emit('save', row.kind, row.title)" @keydown.escape.prevent="$emit('cancel')" />
          <template v-else>
            <span class="mcard-amount ds-money">{{ format(row.amount) }}<small v-if="row.count > 1"> ({{ row.count }})</small></span>
            <button
type="button" class="mcard-status" :disabled="saving" :class="row.status === 'paid' ? 'positive' : 'pending'"
              :aria-label="`${row.status === 'paid' ? 'Marcar como pendente' : 'Marcar como pago'}: ${row.title}`" @click="$emit('toggle', row.kind, row.title)">
              {{ row.status === 'mixed' ? 'Parcial' : row.status === 'paid' ? (row.kind === 'income' ? 'Recebido' : 'Pago') : (row.kind === 'income' ? 'A receber' : 'A pagar') }}
            </button>
          </template>
        </div>
      </div>
      <p v-if="!rows.some(row => row.kind === kind.value)" class="mcard-empty">Nenhum lançamento neste grupo.</p>
    </template>
    <footer class="mcard-foot"><span>Despesas <b class="negative">{{ format(expense) }}</b></span><span>Receitas <b class="positive">{{ format(income) }}</b></span></footer>
  </section>
</template>
<script setup lang="ts">
import type { EntryKind } from '#shared/types'
defineProps<{ label: string; rows: { key: string; kind: EntryKind; title: string; day: number; amount: number; count: number; status: 'paid' | 'pending' | 'mixed' | null }[]; income: number; expense: number; editingKey: string | null; value: string; saving: boolean; format: (value: number) => string }>()
defineEmits<{ clear: []; edit: [kind: EntryKind, title: string, event: MouseEvent]; save: [kind: EntryKind, title: string]; cancel: []; toggle: [kind: EntryKind, title: string]; 'update:value': [value: string] }>()
const kinds = [{ value: 'expense', label: 'Despesas' }, { value: 'income', label: 'Receitas' }] as const
</script>
<style scoped>
.mcard { overflow: hidden; }
.mcard-head { display: flex; align-items: center; gap: 8px; padding: 12px; border-bottom: 2px solid var(--border); flex-wrap: wrap; }
.mcard-head h2 { flex: 1; font-size: 14px; font-weight: 800; }
.mcard-head strong { font-size: 14px; }
.mcard-clear { width: 44px; height: 44px; border: 2px solid var(--border); border-radius: var(--radius-sm); background: var(--surface2); }
.mcard-group { padding: 14px 12px 6px; font-size: 13px; font-weight: 800; color: var(--text2); }
.mcard-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--border); }
.mcard-edit { flex: 1; min-width: 0; text-align: left; min-height: 48px; color: var(--text); background: none; border: 0; }
.mcard-row-title { display: block; overflow-wrap: anywhere; font-size: 14px; font-weight: 700; }
.mcard-row-sub { display: block; font-size: 12px; color: var(--text2); margin-top: 4px; }
.mcard-row-side { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; max-width: 50%; }
.mcard-amount { font-size: 14px; overflow-wrap: anywhere; text-align: right; }
.mcard-status { min-height: 44px; padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface2); font-size: 13px; font-weight: 700; }
.mcard-input { width: 100%; max-width: 130px; min-height: 44px; font-size: 16px; color: var(--text); background: var(--surface2); border: 2px solid var(--primary); padding: 6px; }
.positive { color: var(--success); }.negative { color: color-mix(in srgb, var(--danger) 70%, var(--text)); }.pending { color: var(--text); }
.mcard-empty { padding: 12px; color: var(--text2); }
.mcard-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; background: var(--surface2); padding: 12px; font-size: 13px; }
.mcard-foot b { display: block; }
button { cursor: pointer; } button:focus-visible, input:focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; }
button:disabled { opacity: .6; cursor: wait; }
</style>

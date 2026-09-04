<template>
  <header class="finance-topbar">
    <button v-if="mobile" type="button" class="topbar-button" aria-label="Abrir menu" :aria-expanded="drawerOpen" @click="$emit('menu')"><BaseIcon name="menu" :size="20" /></button>
    <div class="topbar-heading">
      <h1>{{ title }}</h1>
      <span v-if="isHomol" class="homol-label">{{ sharedDatabase ? 'Homologação · dados de produção' : 'Homologação' }}</span>
      <p v-if="!mobile">{{ period }}</p>
    </div>
    <div class="topbar-actions">
      <span v-if="!mobile" class="topbar-summary">↑ {{ income }} &nbsp; ↓ {{ expense }}</span>
      <button type="button" class="topbar-button" aria-label="Ajuda desta tela" :aria-expanded="helpOpen" @click="$emit('help')"><BaseIcon name="help" :size="20" /></button>
      <button type="button" class="topbar-button" :aria-label="`Alertas: ${alertCount} pendentes`" @click="$emit('alerts')">
        <BaseIcon name="alerts" :size="20" /><span v-if="alertCount" class="topbar-badge">{{ alertCount }}</span>
      </button>
      <span v-if="!mobile" class="topbar-balance ds-money">{{ balance }}</span>
    </div>
  </header>
</template>
<script setup lang="ts">
import BaseIcon from '~/components/base/BaseIcon.vue'
const isHomol = useRuntimeConfig().public.appEnvironment === 'homol'
const sharedDatabase = useRuntimeConfig().public.sharedProductionDatabase
defineProps<{ mobile: boolean; drawerOpen: boolean; title: string; period: string; income: string; expense: string; balance: string; helpOpen: boolean; alertCount: number }>()
defineEmits<{ menu: []; help: []; alerts: [] }>()
</script>
<style scoped>
.finance-topbar { min-height: 58px; display: flex; align-items: center; gap: 12px; padding: 8px 20px; border-bottom: 3px solid var(--border); background: var(--surface); box-shadow: var(--shadow-bar-down); position: sticky; top: 0; z-index: 90; flex-shrink: 0; }
.topbar-heading { flex: 1; min-width: 0; }
.topbar-heading h1 { font-size: 16px; font-weight: 800; line-height: 1.3; color: var(--text); overflow-wrap: anywhere; }
.homol-label { display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: 800; color: var(--text); border: 1px solid var(--text); border-radius: var(--radius-sm); }
.topbar-heading p, .topbar-summary { font-size: 12px; color: var(--text2); }
.topbar-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.topbar-button { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; background: var(--surface2); color: var(--text); border: 2px solid var(--border); border-radius: var(--radius-sm); box-shadow: var(--shadow-xs); cursor: pointer; touch-action: manipulation; }
.topbar-button:focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; }
.topbar-button[aria-expanded="true"] { color: var(--primary); }
.topbar-balance { padding: 6px 12px; color: var(--primary); background: var(--primary-dim); border-radius: var(--radius-pill); font-size: 12px; }
.topbar-badge { position: absolute; top: 3px; right: 2px; min-width: 18px; height: 18px; font-size: 11px; font-weight: 800; background: var(--danger); color: var(--on-danger); border-radius: 50%; }
@media (max-width: 767px) { .finance-topbar { padding: 8px 10px; gap: 8px; } }
</style>

<template>
  <div
    class="min-h-dvh"
    style="padding-bottom: env(safe-area-inset-bottom, 0px)"
  >
    <header
      class="sticky top-0 border-b backdrop-blur-md"
      :style="{
        zIndex: 'var(--ds-z-header)',
        borderColor: 'var(--ds-color-border-default)',
        background: 'color-mix(in srgb, var(--ds-color-surface-card) 92%, transparent)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        boxShadow: 'var(--ds-shadow-sm)'
      }"
    >
      <div class="mx-auto flex h-[58px] max-w-7xl items-center gap-4 px-5">
        <!-- Logo -->
        <div class="mr-2 flex shrink-0 items-center gap-2.5">
          <div
            class="flex items-center justify-center rounded-[9px]"
            style="width: 32px; height: 32px; background: var(--ds-color-brand-primary)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div class="leading-none">
            <p class="text-[11px] font-semibold uppercase tracking-[0.08em]" style="color: var(--ds-color-text-muted); line-height: 1">Financeiro</p>
            <p class="text-sm font-extrabold" style="color: var(--ds-color-text-primary); line-height: 1.2">Familiar</p>
          </div>
        </div>

        <!-- Nav tabs (desktop) -->
        <nav class="hidden flex-1 gap-1 sm:flex">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="flex items-center gap-1.5 rounded-md border-none px-3.5 py-1.5 text-[13px] font-semibold transition-all"
            :style="activeTab === tab.id
              ? { background: 'var(--ds-color-brand-primary-dim)', color: 'var(--ds-color-brand-primary)' }
              : { background: 'transparent', color: 'var(--ds-color-text-secondary)' }"
            @click="activeTab = tab.id"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = activeTab === tab.id ? 'var(--ds-color-brand-primary-dim)' : 'var(--ds-color-surface-card-soft)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = activeTab === tab.id ? 'var(--ds-color-brand-primary-dim)' : 'transparent'"
          >
            <svg v-if="tab.id === 'dashboard'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <svg v-else-if="tab.id === 'planilha'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            <svg v-else-if="tab.id === 'calendario'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <svg v-else-if="tab.id === 'config'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            {{ tab.label }}
          </button>
        </nav>

        <!-- Right side: month indicator + net balance -->
        <div class="ml-auto flex shrink-0 items-center gap-2.5">
          <span
            class="hidden items-center gap-1.5 text-xs font-semibold sm:flex"
            style="color: var(--ds-color-text-muted)"
          >
            <span
              class="inline-block rounded-full"
              style="width: 7px; height: 7px; background: var(--ds-color-state-success)"
            />
            {{ currentMonthLabel }}
          </span>
          <div
            v-if="store.entries.length > 0"
            class="rounded-full px-2.5 py-1 text-xs font-bold"
            style="background: var(--ds-color-brand-primary-dim); color: var(--ds-color-brand-primary)"
          >
            {{ currency.format(store.kpis.net) }}
          </div>

          <!-- Key toggle (hidden by default, show on hover) -->
          <div class="relative" @mouseenter="showKeyInput = true" @mouseleave="showKeyInput = false">
            <button
              class="rounded-md border p-1.5 transition-colors"
              :style="{ borderColor: 'var(--ds-color-border-default)', color: 'var(--ds-color-text-muted)', background: 'var(--ds-color-surface-card-soft)' }"
              title="Chave de acesso"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </button>
            <div
              v-if="showKeyInput"
              class="absolute right-0 top-full z-50 mt-1 flex gap-1 rounded-xl border p-2 shadow-md"
              style="background: var(--ds-color-surface-card); border-color: var(--ds-color-border-default); box-shadow: var(--ds-shadow-md); min-width: 220px"
            >
              <input
                v-model="keyDraft"
                type="password"
                placeholder="edit key"
                class="ds-field flex-1"
                style="height: 30px; font-size: 12px"
                @keyup.enter="applyKey"
              />
              <button
                class="rounded-lg px-2.5 text-xs font-semibold transition-all"
                style="background: var(--ds-color-brand-primary); color: #fff; border: none; height: 30px; cursor: pointer"
                @click="applyKey"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile nav tabs (below header) -->
      <div
        class="flex gap-1 overflow-x-auto border-t px-4 pb-1 pt-1 sm:hidden [&::-webkit-scrollbar]:hidden"
        style="border-color: var(--ds-color-border-default)"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-all"
          :style="activeTab === tab.id
            ? { background: 'var(--ds-color-brand-primary-dim)', color: 'var(--ds-color-brand-primary)' }
            : { background: 'transparent', color: 'var(--ds-color-text-muted)' }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </header>

    <main
      class="mx-auto max-w-7xl px-5 py-5"
      style="padding-left: max(1.25rem, env(safe-area-inset-left)); padding-right: max(1.25rem, env(safe-area-inset-right))"
    >
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { FINANCE_TABS } from '~/features/finance/constants/ui'

const store = useFinanceStore()
const currency = useCurrency()
const activeTab = useState('finance-tab', () => 'dashboard')
const keyDraft = ref(store.editKey)
const showKeyInput = ref(false)

const tabs = FINANCE_TABS

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const currentMonthLabel = computed(() => {
  const now = new Date()
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
})

const applyKey = async () => {
  store.setEditKey(keyDraft.value)
  await store.bootstrap()
  showKeyInput.value = false
}
</script>

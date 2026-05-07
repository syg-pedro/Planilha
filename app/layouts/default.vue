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
        background: 'color-mix(in srgb, var(--ds-color-surface-card) 94%, transparent)',
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }"
    >
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <div class="mr-auto min-w-0">
          <p class="text-xs uppercase tracking-[0.2em] ds-text-muted">Financeiro Familiar</p>
          <h1 class="text-lg font-semibold leading-tight">Dashboard e Planilha</h1>
        </div>

        <BaseBadge :tone="online ? 'success' : 'warning'">
          {{ online ? 'Online' : 'Offline' }}
        </BaseBadge>

        <div class="flex w-full items-end gap-2 sm:w-auto">
          <BaseInput v-model="keyDraft" class="flex-1 sm:w-44 sm:flex-none" type="password" placeholder="edit key" />
          <BaseButton variant="secondary" size="sm" @click="applyKey">Aplicar</BaseButton>
          <BaseButton variant="primary" size="sm" @click="refresh">Atualizar</BaseButton>
        </div>
      </div>
    </header>

    <main
      class="mx-auto max-w-7xl px-4 py-5"
      style="padding-left: max(1rem, env(safe-area-inset-left)); padding-right: max(1rem, env(safe-area-inset-right))"
    >
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'

const store = useFinanceStore()
const keyDraft = ref(store.editKey)
const online = ref(process.client ? navigator.onLine : true)

if (process.client) {
  window.addEventListener('online', () => { online.value = true })
  window.addEventListener('offline', () => { online.value = false })
}

const applyKey = async () => {
  store.setEditKey(keyDraft.value)
  await store.bootstrap()
}

const refresh = async () => {
  await store.bootstrap()
}
</script>

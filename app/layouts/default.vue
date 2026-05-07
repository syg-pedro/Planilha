<template>
  <div class="min-h-screen pb-8">
    <header
      class="sticky top-0 border-b backdrop-blur-md"
      :style="{
        zIndex: 'var(--ds-z-header)',
        borderColor: 'var(--ds-color-border-default)',
        background: 'color-mix(in srgb, var(--ds-color-surface-card) 94%, transparent)'
      }"
    >
      <div class="mx-auto flex max-w-7xl flex-wrap items-start gap-3 px-3 py-3 sm:items-center sm:px-4">
        <div class="mr-auto">
          <p class="text-xs uppercase tracking-[0.2em] ds-text-muted">Financeiro Familiar</p>
          <h1 class="text-base font-semibold sm:text-lg">Dashboard e Planilha</h1>
        </div>

        <BaseBadge :tone="online ? 'success' : 'warning'">
          {{ online ? 'Online' : 'Offline' }}
        </BaseBadge>

        <div class="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(220px,1fr)_auto_auto] sm:items-end">
          <BaseInput v-model="keyDraft" type="password" placeholder="edit key" />
          <BaseButton class="w-full sm:w-auto" variant="secondary" @click="applyKey">Aplicar chave</BaseButton>
          <BaseButton class="w-full sm:w-auto" variant="primary" @click="refresh">Atualizar</BaseButton>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5">
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
  window.addEventListener('online', () => {
    online.value = true
  })
  window.addEventListener('offline', () => {
    online.value = false
  })
}

const applyKey = async () => {
  store.setEditKey(keyDraft.value)
  await store.bootstrap()
}

const refresh = async () => {
  await store.bootstrap()
}
</script>

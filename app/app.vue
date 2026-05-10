<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <PwaInstallBanner />
</template>

<script setup lang="ts">
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'

const store = useFinanceStore()

onMounted(async () => {
  if (!store.initialized) {
    await store.boot()
    await store.requestNotifications()
    store.notifyUpcoming()
  }

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (store.settings.themeMode === 'system') {
      store.applyTheme()
    }
  })
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
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
})
</script>

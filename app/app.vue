<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <PwaInstallBanner />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'

const store = useFinanceStore()
const { user } = useAuth()

// Ao trocar de conta: resetar store e recarregar dados do novo usuário
watch(user, async (newUser, oldUser) => {
  const changedUser = newUser?.id !== oldUser?.id
  if (!changedUser) return

  store.resetState()

  if (newUser) {
    await store.boot()
    await store.requestNotifications()
    store.notifyUpcoming()
  }
}, { immediate: false })

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

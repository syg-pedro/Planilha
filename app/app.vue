<template>
  <NuxtLayout :key="layoutName" :name="layoutName">
    <NuxtPage />
  </NuxtLayout>
  <PwaInstallBanner v-if="!isNativePlatform" />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'

const store = useFinanceStore()
const { user } = useAuth()
const runtime = useRuntimeConfig()
const route = useRoute()
const isNativePlatform = Capacitor.isNativePlatform()
const requiresAuthentication = Boolean(
  runtime.public.supabaseUrl && runtime.public.supabaseAnonKey
)
const layoutName = computed(() => {
  if (route.path === '/login' || route.path === '/signup') {
    return 'auth'
  }
  return typeof route.meta.layout === 'string' ? route.meta.layout : 'default'
})

const notifyNativeBundleReady = () => {
  if (!isNativePlatform) return
  void CapacitorUpdater.notifyAppReady().catch(() => undefined)
}

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
  notifyNativeBundleReady()

  // Com Supabase configurado, os dados financeiros so podem ser carregados
  // depois de uma sessao valida. No modo local sem Supabase, mantemos o demo.
  if (requiresAuthentication && !user.value) {
    return
  }

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

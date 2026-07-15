<template>
  <NuxtLayout :key="layoutName" :name="layoutName">
    <NuxtPage />
  </NuxtLayout>
  <PwaInstallBanner v-if="!isNativePlatform" />

  <Teleport to="body">
    <Transition name="ota-update">
      <div v-if="pendingOtaUpdate" class="ota-update-backdrop" role="presentation">
        <section class="ota-update-dialog" role="dialog" aria-modal="true" aria-labelledby="ota-update-title">
          <p class="ota-update-dialog__eyebrow">ATUALIZAÇÃO PRONTA</p>
          <h2 id="ota-update-title">Novidades da versão {{ pendingOtaUpdate.version }}</h2>
          <ul>
            <li v-for="note in pendingOtaUpdate.notes" :key="note">{{ note }}</li>
          </ul>
          <p class="ota-update-dialog__instruction">Feche e abra o aplicativo para usar esta atualização.</p>
          <div class="ota-update-dialog__actions">
            <button type="button" class="ota-update-dialog__later" @click="dismissOtaUpdate">Depois</button>
            <button type="button" class="ota-update-dialog__apply" @click="closeForOtaUpdate">Fechar para atualizar</button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { App } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'
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
const pendingOtaUpdate = ref<{ version: string; notes: string[] } | null>(null)
const dismissedOtaVersion = ref<string | null>(null)
let otaUpdateListener: PluginListenerHandle | undefined

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

const formatOtaNotes = (comment?: string) => {
  const notes = (comment || '')
    .split(/\r?\n/)
    .map((note) => note
      .replace(/^\s*(?:[-*]|\d+\.)\s*/, '')
      .replace(/^(?:feat|fix|docs|refactor|chore|test)(?:\([^)]*\))?:\s*/i, '')
      .trim())
    .filter(Boolean)
    .slice(0, 4)

  return notes.length > 0 ? notes : ['Melhorias de estabilidade e correções para uma experiência mais fluida.']
}

const fetchOtaNotes = async () => {
  const url = runtime.public.otaNotesUrl as string
  if (!url) return []

  const response = await $fetch<{ notes?: string[] }>(url, { cache: 'no-store' })
  return Array.isArray(response.notes) ? response.notes : []
}

const showOtaUpdate = async (version: string) => {
  if (dismissedOtaVersion.value === version || pendingOtaUpdate.value) return

  let comment: string | undefined
  let notes: string[]
  try {
    comment = (await CapacitorUpdater.getLatest()).comment
  } catch {
    // O pacote já foi baixado; a nota é opcional para o aviso.
  }

  if (comment) {
    notes = formatOtaNotes(comment)
  } else {
    try {
      notes = await fetchOtaNotes()
    } catch {
      notes = []
    }
  }

  pendingOtaUpdate.value = {
    version,
    notes: notes?.length ? notes : formatOtaNotes()
  }
}

const dismissOtaUpdate = () => {
  dismissedOtaVersion.value = pendingOtaUpdate.value?.version ?? null
  pendingOtaUpdate.value = null
}

const closeForOtaUpdate = async () => {
  await App.minimizeApp().catch(() => undefined)
}

const listenForOtaUpdates = async () => {
  otaUpdateListener = await CapacitorUpdater.addListener('updateAvailable', ({ bundle }) => {
    void showOtaUpdate(bundle.version)
  })
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
  if (isNativePlatform) {
    await listenForOtaUpdates()
  }

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

onUnmounted(() => {
  void otaUpdateListener?.remove()
})
</script>

<style>
.ota-update-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: oklch(0% 0 0 / 0.72);
  backdrop-filter: blur(3px);
}

.ota-update-dialog {
  width: min(100%, 420px);
  border: 3px solid var(--border);
  background: var(--surface);
  box-shadow: 8px 8px 0 var(--ds-shadow-color);
  padding: 22px;
}

.ota-update-dialog__eyebrow {
  margin: 0 0 6px;
  color: var(--primary);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.ota-update-dialog h2 {
  margin: 0;
  color: var(--text);
  font-size: 22px;
  line-height: 1.15;
}

.ota-update-dialog ul {
  display: grid;
  gap: 8px;
  margin: 18px 0;
  padding-left: 20px;
  color: var(--text2);
  font-size: 14px;
  line-height: 1.4;
}

.ota-update-dialog__instruction {
  margin: 0;
  border: 1px solid var(--border);
  background: var(--primary-dim);
  color: var(--text);
  padding: 10px;
  font-size: 13px;
  font-weight: 700;
}

.ota-update-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.ota-update-dialog button {
  min-height: 42px;
  border: 2px solid var(--border);
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.ota-update-dialog__later {
  background: var(--surface2);
  color: var(--text2);
}

.ota-update-dialog__apply {
  background: var(--primary);
  color: var(--bg);
  box-shadow: 3px 3px 0 var(--ds-shadow-color);
}

.ota-update-enter-active,
.ota-update-leave-active {
  transition: opacity 0.18s ease;
}

.ota-update-enter-from,
.ota-update-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .ota-update-backdrop { padding: 14px; }
  .ota-update-dialog { padding: 18px; }
  .ota-update-dialog__actions { flex-direction: column-reverse; }
  .ota-update-dialog button { width: 100%; }
}
</style>

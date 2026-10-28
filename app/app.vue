<template>
  <UApp :locale="pt_br" :toaster="{ position: 'top-right' }">
    <NuxtPwaManifest v-if="!javaLab" />
    <main v-if="!appReady" class="app-loading" aria-busy="true" aria-live="polite">
      <UCard class="w-full max-w-xs text-center" :ui="{ body: 'space-y-4 p-6' }">
        <UIcon name="i-lucide-table-2" class="size-8 text-primary" />
        <p class="font-semibold text-highlighted">Planilha</p>
        <UProgress size="xs" aria-label="Preparando sua planilha" />
        <p class="text-sm text-muted">Preparando sua planilha…</p>
      </UCard>
    </main>
    <NuxtLayout v-else :key="layoutName" :name="layoutName"><NuxtPage /></NuxtLayout>
    <span v-if="appReady" data-testid="app-ready" hidden aria-hidden="true" />
    <PwaInstallBanner v-if="!javaLab && !isNativePlatform" />
    <BaseModal :open="Boolean(visibleUpdate)" :title="updateTitle" :subtitle="updateEyebrow" @close="dismissAvailableUpdate">
      <ul class="list-disc space-y-2 pl-5 text-sm text-muted"><li v-for="note in visibleUpdate?.notes" :key="note">{{ note }}</li></ul>
      <UAlert class="mt-4" color="neutral" variant="subtle" icon="i-lucide-info" :description="updateInstruction" />
      <template #footer>
        <UButton color="neutral" variant="ghost" @click="dismissAvailableUpdate">Depois</UButton>
        <UButton v-if="releasePageUrl" :to="releasePageUrl" target="_blank" rel="noopener noreferrer" icon="i-lucide-external-link">Abrir página no GitHub</UButton>
        <UButton v-else icon="i-lucide-refresh-cw" @click="reloadForWebUpdate">Recarregar página</UButton>
      </template>
    </BaseModal>
  </UApp>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { isVersionNewer } from '#shared/version'
import { pt_br } from '@nuxt/ui/locale'

type ApkUpdate = {
  type: 'apk'
  version: string
  notes: string[]
  releaseUrl: string
}

type WebUpdate = {
  type: 'web'
  version: string
  notes: string[]
}

type AndroidReleaseManifest = {
  version: string
  notes?: string
  releaseUrl?: string
}

type AvailableUpdate = ApkUpdate | WebUpdate

const store = useFinanceStore()
const { user } = useAuth()
const runtime = useRuntimeConfig()
const javaLab = Boolean(import.meta.dev && runtime.public.javaLab)
const route = useRoute()
const isNativePlatform = !javaLab && Capacitor.isNativePlatform()
const requiresAuthentication = javaLab || Boolean(
  runtime.public.supabaseUrl && runtime.public.supabaseAnonKey
)
const appReady = ref(false)
const pendingApkUpdate = ref<ApkUpdate | null>(null)
const pendingWebUpdate = ref<WebUpdate | null>(null)
const dismissedApkVersion = ref<string | null>(null)
const dismissedWebVersion = ref<string | null>(null)
const visibleUpdate = computed(() => pendingApkUpdate.value ?? pendingWebUpdate.value)
const isApkUpdate = computed(() => visibleUpdate.value?.type === 'apk')
const releasePageUrl = computed(() => visibleUpdate.value?.type === 'apk' ? visibleUpdate.value.releaseUrl : '')
const updateEyebrow = computed(() => isApkUpdate.value
  ? 'NOVA VERSÃO DO APLICATIVO'
  : 'NOVA VERSÃO DISPONÍVEL')
const updateTitle = computed(() => isApkUpdate.value
  ? `Instale a versão ${visibleUpdate.value?.version}`
  : 'Atualize a página')
const updateInstruction = computed(() => isApkUpdate.value
  ? 'Uma nova versão está disponível. Abra a página no GitHub, baixe o APK e instale por cima da versão atual.'
  : 'Uma versão mais recente está disponível. Recarregue para continuar com as melhorias.')
let webUpdateTimer: number | undefined
const AUTH_ROUTES = new Set(['/login', '/signup'])

const layoutName = computed(() => {
  if (AUTH_ROUTES.has(route.path)) {
    return 'auth'
  }
  return typeof route.meta.layout === 'string' ? route.meta.layout : 'default'
})

const formatReleaseNotes = (comment?: string) => {
  const notes = (comment || '')
    .split(/\r?\n|\\n/)
    .map((note) => note
      .replace(/^\s*(?:[-*]|\d+\.)\s*/, '')
      .replace(/^(?:feat|fix|docs|refactor|chore|test)(?:\([^)]*\))?:\s*/i, '')
      .trim())
    .filter(Boolean)
    .slice(0, 4)

  return notes.length > 0 ? notes : ['Melhorias de estabilidade e correções para uma experiência mais fluida.']
}

const notifyAboutUpdate = async (update: AvailableUpdate | null) => {
  if (javaLab) return
  if (!update) return

  const title = update.type === 'apk' ? 'Novo APK disponível' : 'Atualização disponível'
  const body = update.type === 'apk'
    ? `A versão ${update.version} está disponível no GitHub.`
    : 'Recarregue a página para usar a nova versão.'

  try {
    if (isNativePlatform) {
      const permission = await LocalNotifications.checkPermissions()
      if (permission.display !== 'granted') return
      await LocalNotifications.schedule({
        notifications: [{ id: 701000, title, body, schedule: { at: new Date(Date.now() + 1000) } }]
      })
      return
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192-v2.png' })
    }
  } catch {
    // A notificacao e complementar; o modal continua sendo o aviso principal.
  }
}

const checkForNativeUpdate = async () => {
  if (javaLab) return
  if (!isNativePlatform) return

  const url = runtime.public.updateManifestUrl as string
  if (!url) return

  try {
    const [appInfo, release] = await Promise.all([
      App.getInfo(),
      $fetch<AndroidReleaseManifest>(url, { cache: 'no-store' })
    ])

    if (!isVersionNewer(release.version, appInfo.version)) return
    if (dismissedApkVersion.value === release.version) return

    pendingApkUpdate.value = {
      type: 'apk',
      version: release.version,
      notes: formatReleaseNotes(release.notes),
      releaseUrl: release.releaseUrl || 'https://github.com/syg-pedro/Planilha/releases'
    }
    void notifyAboutUpdate(pendingApkUpdate.value)
  } catch {
    // A verificacao e opcional: manter o app utilizavel mesmo sem conexao.
  }
}

const isRemoteNativeWebShell = () => {
  if (!import.meta.client || !isNativePlatform) return false
  return /^https?:$/.test(window.location.protocol) && !['localhost', '127.0.0.1'].includes(window.location.hostname)
}

const shouldCheckForWebUpdates = () => !javaLab && (!isNativePlatform || isRemoteNativeWebShell())

const checkForWebUpdate = async () => {
  if (!shouldCheckForWebUpdates() || pendingWebUpdate.value) return

  const currentVersion = runtime.public.webBuildVersion as string
  const url = runtime.public.webVersionUrl as string
  if (!currentVersion || !url) return

  try {
    const response = await $fetch<{ version?: string }>(url, { cache: 'no-store' })
    if (!response.version || response.version === currentVersion) return
    if (dismissedWebVersion.value === response.version) return

    pendingWebUpdate.value = {
      type: 'web',
      version: response.version,
      notes: ['Uma nova versão da Planilha está disponível.']
    }
    void notifyAboutUpdate(pendingWebUpdate.value)
  } catch {
    // A checagem não deve impedir o uso quando a conexão estiver indisponível.
  }
}

const dismissAvailableUpdate = () => {
  if (pendingApkUpdate.value) {
    dismissedApkVersion.value = pendingApkUpdate.value.version
    pendingApkUpdate.value = null
    return
  }

  if (pendingWebUpdate.value) {
    dismissedWebVersion.value = pendingWebUpdate.value.version
    pendingWebUpdate.value = null
    return
  }

}

const reloadForWebUpdate = () => {
  window.location.reload()
}

// Ao trocar de conta: resetar store e recarregar dados do novo usuário
watch(() => user.value, async (newUser, oldUser) => {
  const changedUser = newUser?.id !== oldUser?.id
  if (!changedUser) return

  store.resetState()

  if (newUser) {
    await store.boot()
    await store.requestNotifications()
    store.notifyUpcoming()
    void notifyAboutUpdate(visibleUpdate.value)
  }
}, { immediate: false })

onMounted(async () => {
  // O tema padrão precisa ser aplicado no cliente antes de qualquer chamada remota.
  // Assim, uma sincronização do head durante a hidratação não pode exibir os tokens claros.
  store.applyTheme()

  void checkForNativeUpdate()
  void checkForWebUpdate()
  if (shouldCheckForWebUpdates()) {
    webUpdateTimer = window.setInterval(() => void checkForWebUpdate(), 10 * 60 * 1000)
  }

  // Com Supabase configurado, os dados financeiros so podem ser carregados
  // depois de uma sessao valida. No modo local sem Supabase, mantemos o demo.
  if (requiresAuthentication && !user.value) {
    if (!AUTH_ROUTES.has(route.path)) {
      await navigateTo('/login')
    }
    appReady.value = true
    return
  }

  if (!store.initialized) {
    try {
      await store.boot()
      await store.requestNotifications()
      store.notifyUpcoming()
      void notifyAboutUpdate(visibleUpdate.value)
    } catch {
      // O erro já é registrado no store e será mostrado pela página. Nunca deixe
      // a tela inicial bloqueada se a API ou a autenticação falharem.
    } finally {
      appReady.value = true
    }
  }

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (store.settings.themeMode === 'system') {
      store.applyTheme()
    }
  })
  appReady.value = true
})

onUnmounted(() => {
  if (webUpdateTimer) window.clearInterval(webUpdateTimer)
})
</script>

<style>
.app-loading { display: grid; min-height: 100dvh; place-items: center; padding: var(--ds-space-6); background: var(--ui-bg); }
</style>

<template>
  <NuxtLayout :key="layoutName" :name="layoutName">
    <NuxtPage />
  </NuxtLayout>
  <PwaInstallBanner v-if="!isNativePlatform" />

  <Teleport to="body">
    <Transition name="ota-update">
      <div v-if="visibleUpdate" class="ota-update-backdrop" role="presentation">
        <section class="ota-update-dialog" role="dialog" aria-modal="true" aria-labelledby="ota-update-title">
          <p class="ota-update-dialog__eyebrow">{{ updateEyebrow }}</p>
          <h2 id="ota-update-title">{{ updateTitle }}</h2>
          <ul>
            <li v-for="note in visibleUpdate.notes" :key="note">{{ note }}</li>
          </ul>
          <p class="ota-update-dialog__instruction">
            {{ updateInstruction }}
          </p>
          <div class="ota-update-dialog__actions">
            <button type="button" class="ota-update-dialog__later" @click="dismissAvailableUpdate">Depois</button>
            <a
              v-if="apkDownloadUrl"
              :href="apkDownloadUrl"
              class="ota-update-dialog__apply"
              target="_blank"
              rel="noopener noreferrer"
            >Baixar APK</a>
            <button v-else-if="isWebUpdate" type="button" class="ota-update-dialog__apply" @click="reloadForWebUpdate">Recarregar página</button>
            <button v-else type="button" class="ota-update-dialog__apply" @click="closeForOtaUpdate">Fechar para atualizar</button>
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
import { LocalNotifications } from '@capacitor/local-notifications'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { isVersionNewer } from '#shared/version'

type OtaUpdate = {
  type: 'ota'
  version: string
  notes: string[]
}

type ApkUpdate = {
  type: 'apk'
  version: string
  notes: string[]
  apkUrl: string
}

type WebUpdate = {
  type: 'web'
  version: string
  notes: string[]
}

type AndroidReleaseManifest = {
  version: string
  notes?: string
  apkUrl?: string
}

type AvailableUpdate = OtaUpdate | ApkUpdate | WebUpdate

const store = useFinanceStore()
const { user } = useAuth()
const runtime = useRuntimeConfig()
const route = useRoute()
const isNativePlatform = Capacitor.isNativePlatform()
const requiresAuthentication = Boolean(
  runtime.public.supabaseUrl && runtime.public.supabaseAnonKey
)
const pendingOtaUpdate = ref<OtaUpdate | null>(null)
const pendingApkUpdate = ref<ApkUpdate | null>(null)
const pendingWebUpdate = ref<WebUpdate | null>(null)
const dismissedOtaVersion = ref<string | null>(null)
const dismissedApkVersion = ref<string | null>(null)
const dismissedWebVersion = ref<string | null>(null)
const visibleUpdate = computed(() => pendingApkUpdate.value ?? pendingOtaUpdate.value ?? pendingWebUpdate.value)
const isApkUpdate = computed(() => visibleUpdate.value?.type === 'apk')
const isWebUpdate = computed(() => visibleUpdate.value?.type === 'web')
const apkDownloadUrl = computed(() => visibleUpdate.value?.type === 'apk' ? visibleUpdate.value.apkUrl : '')
const updateEyebrow = computed(() => isApkUpdate.value
  ? 'NOVA VERSÃO DO APLICATIVO'
  : isWebUpdate.value ? 'NOVA VERSÃO DISPONÍVEL' : 'ATUALIZAÇÃO PRONTA')
const updateTitle = computed(() => isApkUpdate.value
  ? `Instale a versão ${visibleUpdate.value?.version}`
  : isWebUpdate.value ? 'Atualize a página' : `Novidades da versão ${visibleUpdate.value?.version}`)
const updateInstruction = computed(() => isApkUpdate.value
  ? 'Esta atualização inclui mudanças nativas. Baixe o APK e instale por cima da versão atual.'
  : isWebUpdate.value
    ? 'Uma versão mais recente está disponível. Recarregue para continuar com as melhorias.'
    : 'Feche e abra o aplicativo para usar esta atualização.')
let otaUpdateListener: PluginListenerHandle | undefined
let webUpdateTimer: number | undefined
const activeScreen = useState('finance-screen', () => 'dashboard')

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
    .split(/\r?\n|\\n/)
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

const notifyAboutUpdate = async (update: AvailableUpdate | null) => {
  if (!update) return

  const title = update.type === 'apk'
    ? 'Novo APK disponível'
    : update.type === 'web' ? 'Atualização disponível' : 'Atualização pronta'
  const body = update.type === 'apk'
    ? `A versão ${update.version} precisa ser instalada.`
    : update.type === 'web'
      ? 'Recarregue a página para usar a nova versão.'
      : 'Feche e abra o aplicativo para concluir a atualização.'

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
      new Notification(title, { body })
    }
  } catch {
    // A notificacao e complementar; o modal continua sendo o aviso principal.
  }
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
    type: 'ota',
    version,
    notes: notes?.length ? notes : formatOtaNotes()
  }
  void notifyAboutUpdate(pendingOtaUpdate.value)
}

const dismissOtaUpdate = () => {
  dismissedOtaVersion.value = pendingOtaUpdate.value?.version ?? null
  pendingOtaUpdate.value = null
}

const checkForNativeUpdate = async () => {
  if (!isNativePlatform) return

  const url = runtime.public.updateManifestUrl as string
  if (!url) return

  try {
    const [appInfo, release] = await Promise.all([
      App.getInfo(),
      $fetch<AndroidReleaseManifest>(url, { cache: 'no-store' })
    ])

    if (!release.apkUrl || !isVersionNewer(release.version, appInfo.version)) return
    if (dismissedApkVersion.value === release.version) return

    pendingApkUpdate.value = {
      type: 'apk',
      version: release.version,
      notes: formatOtaNotes(release.notes),
      apkUrl: release.apkUrl
    }
    void notifyAboutUpdate(pendingApkUpdate.value)
  } catch {
    // A verificacao e opcional: manter o app utilizavel mesmo sem conexao.
  }
}

const checkForWebUpdate = async () => {
  if (isNativePlatform || pendingWebUpdate.value) return

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
      notes: ['Uma nova versão do Financeiro Familiar está disponível.']
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

  dismissOtaUpdate()
}

const reloadForWebUpdate = () => {
  window.location.reload()
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
    void notifyAboutUpdate(visibleUpdate.value)
  }
}, { immediate: false })

watch(
  () => `${store.initialized}-${store.settings.onboarding.status}-${store.accounts.length}-${store.categories.length}-${store.rules.length}-${store.entries.length}`,
  () => {
    const isEmptyFinancialSpace = store.accounts.length === 0 && store.categories.length === 0 && store.rules.length === 0 && store.entries.length === 0
    if (store.initialized && store.settings.onboarding.status === 'new' && isEmptyFinancialSpace && activeScreen.value === 'dashboard') {
      activeScreen.value = 'onboarding'
    }
  },
  { immediate: true }
)

onMounted(async () => {
  if (isNativePlatform) {
    await listenForOtaUpdates()
  }

  notifyNativeBundleReady()
  void checkForNativeUpdate()
  void checkForWebUpdate()
  if (!isNativePlatform) {
    webUpdateTimer = window.setInterval(() => void checkForWebUpdate(), 10 * 60 * 1000)
  }

  // Com Supabase configurado, os dados financeiros so podem ser carregados
  // depois de uma sessao valida. No modo local sem Supabase, mantemos o demo.
  if (requiresAuthentication && !user.value) {
    return
  }

  if (!store.initialized) {
    await store.boot()
    await store.requestNotifications()
    store.notifyUpcoming()
    void notifyAboutUpdate(visibleUpdate.value)
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
  if (webUpdateTimer) window.clearInterval(webUpdateTimer)
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

.ota-update-dialog button,
.ota-update-dialog__apply {
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: var(--bg);
  box-shadow: 3px 3px 0 var(--ds-shadow-color);
  text-decoration: none;
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
  .ota-update-dialog button,
  .ota-update-dialog__apply { width: 100%; }
}
</style>

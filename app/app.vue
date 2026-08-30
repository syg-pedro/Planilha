<template>
  <main v-if="!appReady" class="app-loading" aria-busy="true" aria-live="polite">
    <div class="app-loading__content">
      <span class="app-loading__mark" aria-hidden="true">$</span>
      <p class="app-loading__eyebrow">FINANCEIRO FAMILIAR</p>
      <div class="app-loading__bar" aria-hidden="true"><span /></div>
      <p class="app-loading__message">Preparando seu financeiro...</p>
    </div>
  </main>

  <NuxtLayout v-else :key="layoutName" :name="layoutName">
    <NuxtPage />
  </NuxtLayout>
  <span v-if="appReady" data-testid="app-ready" hidden aria-hidden="true" />
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
              v-if="releasePageUrl"
              :href="releasePageUrl"
              class="ota-update-dialog__apply"
              target="_blank"
              rel="noopener noreferrer"
            >Abrir página no GitHub</a>
            <button v-else type="button" class="ota-update-dialog__apply" @click="reloadForWebUpdate">Recarregar página</button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { isVersionNewer } from '#shared/version'

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
const route = useRoute()
const isNativePlatform = Capacitor.isNativePlatform()
const requiresAuthentication = Boolean(
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
const activeScreen = useState('finance-screen', () => 'dashboard')

const layoutName = computed(() => {
  if (route.path === '/login' || route.path === '/signup') {
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
      new Notification(title, { body, icon: '/icon-192.png' })
    }
  } catch {
    // A notificacao e complementar; o modal continua sendo o aviso principal.
  }
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

}

const reloadForWebUpdate = () => {
  window.location.reload()
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
  // O tema padrão precisa ser aplicado no cliente antes de qualquer chamada remota.
  // Assim, uma sincronização do head durante a hidratação não pode exibir os tokens claros.
  store.applyTheme()

  void checkForNativeUpdate()
  void checkForWebUpdate()
  if (!isNativePlatform) {
    webUpdateTimer = window.setInterval(() => void checkForWebUpdate(), 10 * 60 * 1000)
  }

  // Com Supabase configurado, os dados financeiros so podem ser carregados
  // depois de uma sessao valida. No modo local sem Supabase, mantemos o demo.
  if (requiresAuthentication && !user.value) {
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
.app-loading {
  display: grid;
  min-height: 100dvh;
  place-items: center;
  padding: 24px;
  background: var(--bg);
  color: var(--text);
}

.app-loading__content {
  display: grid;
  width: min(100%, 320px);
  justify-items: center;
  gap: 14px;
}

.app-loading__mark {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border: 3px solid var(--border);
  background: var(--primary);
  color: var(--on-primary);
  box-shadow: var(--shadow-md);
  font-family: var(--ds-font-family-mono);
  font-size: 30px;
  font-weight: 900;
}

.app-loading__eyebrow,
.app-loading__message {
  margin: 0;
  text-align: center;
}

.app-loading__eyebrow {
  color: var(--text);
  font-family: var(--ds-font-family-mono);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.app-loading__message {
  color: var(--text2);
  font-size: 14px;
  font-weight: 700;
}

.app-loading__bar {
  width: 100%;
  height: 10px;
  overflow: hidden;
  border: 2px solid var(--border);
  background: var(--surface2);
}

.app-loading__bar span {
  display: block;
  width: 42%;
  height: 100%;
  background: var(--primary);
  animation: app-loading-progress 1s ease-in-out infinite;
}

@keyframes app-loading-progress {
  from { transform: translateX(-105%); }
  to { transform: translateX(340%); }
}

.ota-update-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  padding: 14px;
  padding-top: max(14px, env(safe-area-inset-top, 0px));
  padding-right: max(14px, env(safe-area-inset-right, 0px));
  padding-bottom: max(14px, env(safe-area-inset-bottom, 0px));
  padding-left: max(14px, env(safe-area-inset-left, 0px));
  overflow: hidden;
  background: var(--overlay);
  backdrop-filter: blur(3px);
}

.ota-update-dialog {
  box-sizing: border-box;
  width: calc(100vw - 28px);
  width: min(420px, calc(100dvw - 28px));
  max-width: calc(100vw - 28px);
  max-width: calc(100dvw - 28px);
  max-height: calc(100vh - 28px);
  max-height: calc(100dvh - 28px);
  overflow-y: auto;
  overscroll-behavior: contain;
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
  overflow-wrap: anywhere;
}

.ota-update-dialog__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
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
  min-width: 0;
  background: var(--primary);
  color: var(--bg);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  text-align: center;
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
  .ota-update-dialog { padding: 18px; }
  .ota-update-dialog__actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
  .ota-update-dialog button,
  .ota-update-dialog__apply { width: 100%; }
}
</style>

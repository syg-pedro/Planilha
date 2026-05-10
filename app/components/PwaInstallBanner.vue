<template>
  <Teleport to="body">
    <Transition name="pwa-slide">
      <div v-if="showBanner" class="pwa-banner" role="banner" aria-label="Instalar aplicativo">
        <img src="/icon-192.png" alt="" class="pwa-banner-icon" />
        <div class="pwa-banner-text">
          <p class="pwa-banner-title">Financeiro Familiar</p>
          <p class="pwa-banner-desc">Instale o app para acesso rápido e offline</p>
        </div>
        <button class="pwa-banner-btn pwa-banner-install" @click="install">Instalar</button>
        <button class="pwa-banner-btn pwa-banner-dismiss" aria-label="Fechar" @click="dismiss">✕</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const showBanner = ref(false)
let deferredPrompt: BeforeInstallPromptEvent | null = null

onMounted(() => {
  if (window.matchMedia('(display-mode: standalone)').matches) return
  if (sessionStorage.getItem('pwa-dismissed')) return

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    showBanner.value = true
  })
})

const install = async () => {
  if (!deferredPrompt) return
  await deferredPrompt.prompt()
  await deferredPrompt.userChoice
  deferredPrompt = null
  showBanner.value = false
}

const dismiss = () => {
  sessionStorage.setItem('pwa-dismissed', '1')
  showBanner.value = false
  deferredPrompt = null
}
</script>

<style scoped>
.pwa-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
}

.pwa-banner-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
}

.pwa-banner-text {
  flex: 1;
  min-width: 0;
}

.pwa-banner-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pwa-banner-desc {
  font-size: 12px;
  color: var(--text3);
  margin-top: 1px;
}

.pwa-banner-btn {
  flex-shrink: 0;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  padding: 8px 14px;
  transition: opacity 0.15s;
}

.pwa-banner-btn:active {
  opacity: 0.7;
}

.pwa-banner-install {
  background: var(--primary);
  color: #fff;
}

.pwa-banner-dismiss {
  background: transparent;
  color: var(--text3);
  padding: 8px 6px;
}

.pwa-slide-enter-active,
.pwa-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.pwa-slide-enter-from,
.pwa-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>

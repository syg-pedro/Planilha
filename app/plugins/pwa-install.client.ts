interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default defineNuxtPlugin(() => {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const isInstalled = ref(false)

  if (typeof window !== 'undefined') {
    isInstalled.value = window.matchMedia('(display-mode: standalone)').matches

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e as BeforeInstallPromptEvent
    })

    window.addEventListener('appinstalled', () => {
      isInstalled.value = true
      deferredPrompt.value = null
    })
  }

  return {
    provide: {
      pwaPrompt: deferredPrompt,
      pwaInstalled: isInstalled,
    },
  }
})

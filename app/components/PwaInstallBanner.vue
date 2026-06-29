<template>
  <Teleport to="body">
    <Transition name="pwa-slide">
      <!-- Banner automático quando beforeinstallprompt dispara -->
      <div v-if="showAutoPrompt" class="pwa-banner" role="banner" aria-label="Instalar aplicativo">
        <img src="/icon-192.png" alt="" class="pwa-banner-icon" />
        <div class="pwa-banner-text">
          <p class="pwa-banner-title">Financeiro Familiar</p>
          <p class="pwa-banner-desc">Instale o app para acesso rápido e offline</p>
        </div>
        <button class="pwa-banner-btn pwa-banner-install" @click="install">Instalar</button>
        <button class="pwa-banner-btn pwa-banner-dismiss" aria-label="Fechar" @click="dismiss">✕</button>
      </div>

      <!-- Modal de instruções manuais (iOS ou quando beforeinstallprompt não disparar) -->
      <div v-else-if="showManual" class="pwa-manual-overlay" @click.self="closeManual">
        <div class="pwa-manual">
          <div class="pwa-manual-header">
            <img src="/icon-192.png" alt="" class="pwa-manual-icon" />
            <div>
              <p class="pwa-manual-title">Instalar Financeiro Familiar</p>
              <p class="pwa-manual-sub">Adicione à tela inicial do seu celular</p>
            </div>
            <button class="pwa-manual-close" @click="closeManual">✕</button>
          </div>
          <div class="pwa-manual-steps">
            <div class="pwa-manual-step">
              <span class="pwa-step-num">1</span>
              <p>Abra o menu do seu navegador <strong>(⋮ ou ⋯)</strong> no topo ou na barra de endereço</p>
            </div>
            <div class="pwa-manual-step">
              <span class="pwa-step-num">2</span>
              <p>Toque em <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong></p>
            </div>
            <div class="pwa-manual-step">
              <span class="pwa-step-num">3</span>
              <p>Confirme tocando em <strong>"Adicionar"</strong> ou <strong>"Instalar"</strong></p>
            </div>
          </div>
          <p class="pwa-manual-note">
            ⚠️ Requer acesso via <strong>HTTPS</strong>. Em rede local (HTTP), a instalação não está disponível.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { $pwaPrompt, $pwaInstalled } = useNuxtApp()

const dismissed = ref(false)
const showManual = useState('pwa-show-manual', () => false)

const showAutoPrompt = computed(
  () => !!$pwaPrompt?.value && !dismissed.value && !$pwaInstalled?.value
)

watch($pwaPrompt, (prompt) => {
  if (prompt && sessionStorage.getItem('pwa-dismissed')) {
    dismissed.value = true
  }
})

const install = async () => {
  if (!$pwaPrompt.value) return
  await $pwaPrompt.value.prompt()
  const { outcome } = await $pwaPrompt.value.userChoice
  if (outcome === 'dismissed') {
    sessionStorage.setItem('pwa-dismissed', '1')
    dismissed.value = true
  }
  $pwaPrompt.value = null
}

const dismiss = () => {
  sessionStorage.setItem('pwa-dismissed', '1')
  dismissed.value = true
}

const closeManual = () => { showManual.value = false }
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
  border-top: 3px solid var(--border);
  box-shadow: 0 -4px 0 var(--ds-shadow-color);
}

.pwa-banner-icon {
  width: 44px;
  height: 44px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 3px 3px 0 var(--ds-shadow-color);
  flex-shrink: 0;
}

.pwa-banner-text { flex: 1; min-width: 0 }

.pwa-banner-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pwa-banner-desc { font-size: 12px; color: var(--text3); margin-top: 1px }

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
.pwa-banner-btn:active { opacity: 0.7 }
.pwa-banner-install { background: var(--primary); color: #fff }
.pwa-banner-dismiss { background: transparent; color: var(--text3); padding: 8px 6px }

/* Manual install modal */
.pwa-manual-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgb(0 0 0 / 0.64);
  display: flex;
  align-items: flex-end;
  padding: 16px;
}

.pwa-manual {
  width: 100%;
  background: var(--surface);
  border: 3px solid var(--border);
  border-radius: var(--radius) var(--radius) 0 0;
  box-shadow: 0 -6px 0 var(--ds-shadow-color);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pwa-manual-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pwa-manual-icon {
  width: 48px;
  height: 48px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 3px 3px 0 var(--ds-shadow-color);
  flex-shrink: 0;
}

.pwa-manual-title { font-size: 15px; font-weight: 800; color: var(--text) }
.pwa-manual-sub { font-size: 12px; color: var(--text3); margin-top: 2px }

.pwa-manual-close {
  margin-left: auto;
  background: var(--surface2);
  border: 2px solid var(--border);
  border-radius: var(--radius-xs);
  box-shadow: 2px 2px 0 var(--ds-shadow-color);
  font-size: 16px;
  cursor: pointer;
  color: var(--text3);
  flex-shrink: 0;
  padding: 4px;
}

.pwa-manual-steps { display: flex; flex-direction: column; gap: 12px }

.pwa-manual-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 13px;
  color: var(--text2);
  line-height: 1.5;
}

.pwa-step-num {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-radius: var(--radius-xs);
  box-shadow: 2px 2px 0 var(--ds-shadow-color);
  background: var(--primary);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pwa-manual-note {
  font-size: 11px;
  color: var(--text3);
  background: var(--surface2);
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  line-height: 1.5;
}

.pwa-slide-enter-active,
.pwa-slide-leave-active { transition: transform var(--ds-motion-base) linear, opacity var(--ds-motion-base) linear }
.pwa-slide-enter-from,
.pwa-slide-leave-to { transform: translateY(100%); opacity: 0 }
</style>

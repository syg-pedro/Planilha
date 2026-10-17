<template>
  <UBanner v-if="showAutoPrompt" class="pwa-banner" icon="i-lucide-download" title="Instale a Planilha para acesso rápido" :actions="[{ label: 'Instalar', onClick: install }]" close @close="dismiss" />
  <BaseModal :open="showManual && !showAutoPrompt" title="Instalar Planilha" subtitle="Adicione à tela inicial do seu celular" @close="closeManual">
    <ol class="space-y-4 text-sm text-muted">
      <li class="flex items-start gap-3"><UBadge color="neutral" variant="subtle">1</UBadge><span>Abra o menu do navegador (⋮ ou ⋯), no topo ou na barra de endereço.</span></li>
      <li class="flex items-start gap-3"><UBadge color="neutral" variant="subtle">2</UBadge><span>Toque em “Adicionar à tela inicial” ou “Instalar app”.</span></li>
      <li class="flex items-start gap-3"><UBadge color="neutral" variant="subtle">3</UBadge><span>Confirme tocando em “Adicionar” ou “Instalar”.</span></li>
    </ol>
    <UAlert class="mt-5" color="neutral" variant="subtle" icon="i-lucide-info" description="A instalação depende do navegador. No celular, abra a Planilha por HTTPS para usar os recursos de aplicativo." />
    <template #footer><UButton @click="closeManual">Entendi</UButton></template>
  </BaseModal>
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
.pwa-banner { position: fixed; left: 12px; right: 12px; bottom: calc(var(--app-bottom-offset, 0px) + 12px); z-index: 40; border-radius: var(--radius); }
</style>

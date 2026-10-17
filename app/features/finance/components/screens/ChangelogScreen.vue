<template>
  <div class="space-y-4">
    <UCard :title="`v${installedVersion}`" description="Versão instalada da Planilha"><BaseButton variant="secondary" :loading="checking" @click="checkForUpdates">Verificar atualizações</BaseButton></UCard>
    <UAlert v-if="update" color="info" variant="subtle" :title="`Nova versão do aplicativo: v${update.version}`" :description="update.notes || updateFallbackMessage"><template #actions><UButton :to="update.releaseUrl" target="_blank" rel="noopener" color="neutral" variant="outline">Abrir página no GitHub</UButton></template></UAlert><UAlert v-else-if="checkError" color="error" variant="subtle" :description="checkError" /><UAlert v-else-if="checked" color="success" variant="subtle" description="Você já está na versão mais recente." />
    <UCard v-for="release in releases" :key="release.version" :title="`v${release.version}`" :description="release.date"><ul class="list-disc space-y-2 pl-5 text-sm text-muted"><li v-for="item in release.items" :key="item">{{ item }}</li></ul></UCard>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { isVersionNewer } from '#shared/version'

type AvailableUpdate = {
  version: string
  notes?: string
  releaseUrl: string
}

const config = useRuntimeConfig()
const version = config.public.appVersion as string
const installedVersion = ref(version)
const checked = ref(false)
const checking = ref(false)
const checkError = ref('')
const update = ref<AvailableUpdate | null>(null)
const updateFallbackMessage = computed(() => 'Uma nova versão está pronta para instalação.')

const releases = [
  {
    version,
    date: 'Em desenvolvimento',
    items: [
      'Dashboard com receitas, despesas, saldo, pendências, vencimentos e fluxo de caixa',
      'Planilha em Matriz e Lista, com lançamentos editáveis e indicador do dia de vencimento',
      'Relatórios e planejamento anual para acompanhar os gastos ao longo do tempo',
      'Controle de contas, cartões, limites, assinaturas e compras recorrentes',
      'Dívidas e parcelas com acompanhamento de pagamentos',
      'Lista de desejos para organizar objetivos e compras futuras',
      'Alertas inteligentes, lembretes de vencimento e notificações configuráveis',
      'Login, criação de conta e opção de lembrar o acesso neste aparelho',
      'Aplicativo Android com uso otimizado para telas menores e navegação pelo botão Voltar',
      'Atualizações pelo GitHub: baixe e instale o APK quando houver uma versão nova'
    ]
  }
]

const checkForUpdates = async () => {
  if (checking.value) return

  checking.value = true
  checked.value = false
  checkError.value = ''
  update.value = null

  try {
    const url = config.public.updateManifestUrl as string
    const manifest = url
      ? await $fetch<{ version: string; notes?: string; releaseUrl?: string }>(url, { cache: 'no-store' })
      : null

    if (manifest && isVersionNewer(manifest.version, installedVersion.value)) {
      update.value = {
        version: manifest.version,
        notes: manifest.notes,
        releaseUrl: manifest.releaseUrl || 'https://github.com/syg-pedro/Planilha/releases'
      }
    }
  } catch {
    checkError.value = 'Não foi possível verificar atualizações agora. Confira sua conexão e tente novamente.'
  } finally {
    checking.value = false
    checked.value = true
  }
}

onMounted(async () => {
  if (Capacitor.isNativePlatform()) {
    installedVersion.value = (await App.getInfo()).version
  }

  await checkForUpdates()
})
</script>

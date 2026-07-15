<template>
  <section class="changelog">
    <header class="changelog__hero">
      <span class="changelog__mark">↻</span>
      <div class="changelog__hero-copy">
        <p class="changelog__eyebrow">VERSÃO INSTALADA</p>
        <h2>v{{ installedVersion }}</h2>
        <p>Histórico de melhorias do Financeiro Familiar.</p>
      </div>
      <button
        type="button"
        class="changelog__check"
        :disabled="checking"
        @click="checkForUpdates"
      >
        <span aria-hidden="true">{{ checking ? '…' : '↻' }}</span>
        {{ checking ? 'Verificando...' : 'Verificar atualizações' }}
      </button>
    </header>

    <div v-if="update" class="changelog__update" role="status">
      <strong>{{ update.type === 'apk' ? 'Nova versão do aplicativo' : 'Atualização pronta' }}: v{{ update.version }}</strong>
      <span>{{ update.notes || updateFallbackMessage }}</span>
      <a v-if="update.apkUrl" :href="update.apkUrl" target="_blank" rel="noopener">Baixar atualização</a>
    </div>
    <div v-else-if="checkError" class="changelog__status changelog__status--error" role="status">{{ checkError }}</div>
    <div v-else-if="checked" class="changelog__status" role="status">Você já está na versão mais recente.</div>

    <article v-for="release in releases" :key="release.version" class="changelog__release">
      <div class="changelog__version"><strong>v{{ release.version }}</strong><span>{{ release.date }}</span></div>
      <ul><li v-for="item in release.items" :key="item">{{ item }}</li></ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { isVersionNewer } from '#shared/version'

type AvailableUpdate = {
  type: 'apk' | 'ota'
  version: string
  notes?: string
  apkUrl?: string
}

const config = useRuntimeConfig()
const version = config.public.appVersion as string
const installedVersion = ref(version)
const checked = ref(false)
const checking = ref(false)
const checkError = ref('')
const update = ref<AvailableUpdate | null>(null)
const updateFallbackMessage = computed(() => update.value?.type === 'ota'
  ? 'A atualização será baixada automaticamente. Feche e abra o aplicativo para aplicá-la.'
  : 'Uma nova versão está pronta para instalação.'
)

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
      'Atualizações automáticas e seguras, sem precisar baixar outro APK para melhorias normais'
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
      ? await $fetch<{ version: string; notes?: string; apkUrl?: string }>(url, { cache: 'no-store' })
      : null

    if (manifest && isVersionNewer(manifest.version, installedVersion.value)) {
      update.value = { type: 'apk', ...manifest }
      return
    }

    if (Capacitor.isNativePlatform()) {
      const latestBundle = await CapacitorUpdater.getLatest()
      if (latestBundle.url) {
        update.value = {
          type: 'ota',
          version: latestBundle.version,
          notes: latestBundle.comment
        }
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

<style scoped>
.changelog{max-width:720px;margin:auto;display:grid;gap:14px}.changelog__hero,.changelog__release,.changelog__update,.changelog__status{border:2px solid var(--border);background:var(--surface);box-shadow:3px 3px 0 var(--ds-shadow-color)}.changelog__hero{display:flex;align-items:center;gap:14px;padding:18px}.changelog__mark{width:44px;height:44px;display:grid;place-items:center;flex:0 0 auto;background:var(--primary);color:var(--bg);font-size:28px;font-weight:900;border:2px solid var(--border)}.changelog__hero-copy{min-width:0;flex:1}.changelog__eyebrow{font-size:10px;font-weight:900;letter-spacing:.12em;color:var(--text3)}h2{font-size:24px;font-weight:900}.changelog__hero p:last-child{font-size:13px;color:var(--text3)}.changelog__check{display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:0 0 auto;min-height:38px;border:2px solid var(--border);background:var(--primary);box-shadow:3px 3px 0 var(--ds-shadow-color);color:var(--bg);padding:8px 10px;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.changelog__check:disabled{cursor:wait;opacity:.72}.changelog__release{padding:14px}.changelog__version{display:flex;justify-content:space-between;gap:12px}.changelog__version strong{font-size:16px}.changelog__version span{font-size:12px;color:var(--text3)}ul{margin:10px 0 0;padding-left:18px;display:grid;gap:6px;font-size:13px}.changelog__update{padding:12px;background:var(--primary-dim);display:grid;gap:8px}.changelog__update span,.changelog__status{font-size:13px;color:var(--text2);white-space:pre-line}.changelog__update a{justify-self:start;border:2px solid var(--border);background:var(--surface);box-shadow:2px 2px 0 var(--ds-shadow-color);padding:7px 10px;color:var(--text);font-size:12px;font-weight:900;text-decoration:none}.changelog__status{padding:10px}.changelog__status--error{color:var(--danger);border-color:var(--danger)}
@media (max-width: 600px){.changelog__hero{align-items:flex-start;flex-wrap:wrap}.changelog__check{width:100%}}
</style>

<template>
  <section class="changelog">
    <header class="changelog__hero">
      <span class="changelog__mark">↻</span>
      <div>
        <p class="changelog__eyebrow">VERSÃO INSTALADA</p>
        <h2>v{{ installedVersion }}</h2>
        <p>Histórico de melhorias do Financeiro Familiar.</p>
      </div>
    </header>

    <div v-if="update" class="changelog__update">
      <strong>Atualização do aplicativo: v{{ update.version }}</strong>
      <span>{{ update.notes || 'Uma nova versão está pronta para instalação.' }}</span>
      <a v-if="update.apkUrl" :href="update.apkUrl" target="_blank" rel="noopener">Baixar atualização</a>
    </div>
    <div v-else-if="checked" class="changelog__ok">Você já está na versão mais recente.</div>

    <article v-for="release in releases" :key="release.version" class="changelog__release">
      <div class="changelog__version"><strong>v{{ release.version }}</strong><span>{{ release.date }}</span></div>
      <ul><li v-for="item in release.items" :key="item">{{ item }}</li></ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

const config = useRuntimeConfig()
const version = config.public.appVersion as string
const installedVersion = ref(version)
const checked = ref(false)
const update = ref<{ version: string; notes?: string; apkUrl?: string } | null>(null)
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

const newer = (candidate: string, current: string) => {
  const latest = candidate.split('.').map(Number)
  const installed = current.split('.').map(Number)
  const size = Math.max(latest.length, installed.length)

  for (let index = 0; index < size; index += 1) {
    const difference = (latest[index] || 0) - (installed[index] || 0)
    if (difference !== 0) return difference > 0
  }

  return false
}

onMounted(async () => {
  if (Capacitor.isNativePlatform()) {
    installedVersion.value = (await App.getInfo()).version
  }

  const url = config.public.updateManifestUrl as string
  if (!url) return

  try {
    const manifest = await $fetch<{ version: string; notes?: string; apkUrl?: string }>(url, { cache: 'no-store' })
    if (newer(manifest.version, installedVersion.value)) update.value = manifest
  } finally {
    checked.value = true
  }
})
</script>

<style scoped>
.changelog{max-width:720px;margin:auto;display:grid;gap:14px}.changelog__hero,.changelog__release,.changelog__update,.changelog__ok{border:2px solid var(--border);background:var(--surface);box-shadow:3px 3px 0 var(--ds-shadow-color)}.changelog__hero{display:flex;gap:14px;padding:18px}.changelog__mark{width:44px;height:44px;display:grid;place-items:center;background:var(--primary);color:var(--bg);font-size:28px;font-weight:900;border:2px solid var(--border)}.changelog__eyebrow{font-size:10px;font-weight:900;letter-spacing:.12em;color:var(--text3)}h2{font-size:24px;font-weight:900}.changelog__hero p:last-child{font-size:13px;color:var(--text3)}.changelog__release{padding:14px}.changelog__version{display:flex;justify-content:space-between;gap:12px}.changelog__version strong{font-size:16px}.changelog__version span{font-size:12px;color:var(--text3)}ul{margin:10px 0 0;padding-left:18px;display:grid;gap:6px;font-size:13px}.changelog__update{padding:12px;background:var(--primary-dim);display:grid;gap:8px}.changelog__update span,.changelog__ok{font-size:13px;color:var(--text2);white-space:pre-line}.changelog__update a{justify-self:start;border:2px solid var(--border);background:var(--surface);box-shadow:2px 2px 0 var(--ds-shadow-color);padding:7px 10px;color:var(--text);font-size:12px;font-weight:900;text-decoration:none}.changelog__ok{padding:10px}
</style>

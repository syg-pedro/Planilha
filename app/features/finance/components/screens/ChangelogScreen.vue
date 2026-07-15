<template>
  <section class="changelog">
    <header class="changelog__hero">
      <span class="changelog__mark">↻</span>
      <div><p class="changelog__eyebrow">VERSÃO INSTALADA</p><h2>v{{ version }}</h2><p>Histórico de melhorias do Financeiro Familiar.</p></div>
    </header>
    <div v-if="update" class="changelog__update"><strong>Atualização disponível: v{{ update.version }}</strong><span>{{ update.notes || 'Abra a central de atualizações para instalar.' }}</span></div>
    <div v-else-if="checked" class="changelog__ok">Você já está na versão mais recente.</div>
    <article v-for="release in releases" :key="release.version" class="changelog__release">
      <div class="changelog__version"><strong>v{{ release.version }}</strong><span>{{ release.date }}</span></div>
      <ul><li v-for="item in release.items" :key="item">{{ item }}</li></ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
const config = useRuntimeConfig()
const version = config.public.appVersion as string
const checked = ref(false)
const update = ref<{ version: string; notes?: string } | null>(null)
const releases = [
  { version, date: 'Em desenvolvimento', items: ['Aplicativo Android com Capacitor', 'Lembretes de vencimento em horário configurável', 'Indicador de dia de vencimento na matriz', 'Ajustes de uso em telas menores'] }
]
const newer = (candidate: string) => candidate.split('.').map(Number).some((n, i) => n > (version.split('.').map(Number)[i] || 0) && candidate.split('.').slice(0, i).every((_, p) => Number(candidate.split('.')[p]) === Number(version.split('.')[p])))
onMounted(async () => {
  const url = config.public.updateManifestUrl as string
  if (!url) return
  try { const manifest = await $fetch<{ version: string; notes?: string }>(url, { cache: 'no-store' }); if (newer(manifest.version)) update.value = manifest } finally { checked.value = true }
})
</script>

<style scoped>
.changelog{max-width:720px;margin:auto;display:grid;gap:14px}.changelog__hero,.changelog__release,.changelog__update,.changelog__ok{border:2px solid var(--border);background:var(--surface);box-shadow:3px 3px 0 var(--ds-shadow-color)}.changelog__hero{display:flex;gap:14px;padding:18px}.changelog__mark{width:44px;height:44px;display:grid;place-items:center;background:var(--primary);color:var(--bg);font-size:28px;font-weight:900;border:2px solid var(--border)}.changelog__eyebrow{font-size:10px;font-weight:900;letter-spacing:.12em;color:var(--text3)}h2{font-size:24px;font-weight:900}.changelog__hero p:last-child{font-size:13px;color:var(--text3)}.changelog__release{padding:14px}.changelog__version{display:flex;justify-content:space-between;gap:12px}.changelog__version strong{font-size:16px}.changelog__version span{font-size:12px;color:var(--text3)}ul{margin:10px 0 0;padding-left:18px;display:grid;gap:6px;font-size:13px}.changelog__update{padding:12px;background:var(--primary-dim);display:grid;gap:3px}.changelog__update span,.changelog__ok{font-size:13px;color:var(--text2)}.changelog__ok{padding:10px}
</style>

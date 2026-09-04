<template>
  <div v-if="store.offlineQueue.length || store.syncError" class="ds-alert-warning sync-status" role="status" aria-live="polite">
    <span>{{ store.syncing ? 'Sincronizando…' : `${store.offlineQueue.length} alteração(ões) pendente(s)` }}</span>
    <p v-if="store.syncError" role="alert">{{ store.syncError }}</p>
    <button type="button" :disabled="store.syncing" @click="store.flushOfflineQueue">Tentar sincronizar</button>
    <button v-if="store.offlineQueue.length" type="button" :disabled="store.syncing" @click="discard">Descartar pendências</button>
  </div>
</template>
<script setup lang="ts">
import { useFinanceStore } from '../stores/useFinanceStore'
const store = useFinanceStore()
const discard = async () => {
  if (window.confirm('Descartar as alterações locais que ainda não foram confirmadas pelo servidor?')) await store.discardPendingEntries()
}
</script>
<style scoped>
.sync-status { margin-bottom: 16px; padding: 12px; }
.sync-status button { min-height: 44px; margin-right: 12px; text-decoration: underline; }
</style>

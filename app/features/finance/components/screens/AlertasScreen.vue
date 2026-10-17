<template>
<div class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-base font-semibold text-highlighted">Alertas</h2><p class="mt-1 text-xs text-muted">{{ activeAlerts.length }} alerta(s) ativo(s)</p></div><BaseButton v-if="activeAlerts.length" variant="secondary" size="sm" @click="dismissAll">Dispensar todos</BaseButton></header>
    <BaseEmptyState v-if="!activeAlerts.length" icon="check" title="Nenhum alerta" body="Não há alertas ativos neste momento." />
    <UAlert v-for="alert in activeAlerts" :key="alert.id" :color="alert.tone === 'danger' ? 'error' : alert.tone" variant="subtle" :title="alert.title" :description="alert.body" :icon="alert.tone === 'success' ? appConfig.ui.icons.success : appConfig.ui.icons.warning" :close="true" @update:open="dismiss(alert.id)">
      <template v-if="alert.sub" #description><p>{{ alert.body }}</p><p class="mt-1 text-xs">{{ alert.sub }}</p></template>
      <template v-if="isClickable(alert)" #actions><BaseButton variant="ghost" size="sm" @click="onAlertClick(alert)">{{ alert.entryId ? 'Abrir lançamento →' : 'Ver na Planilha →' }}</BaseButton></template>
    </UAlert>
    <BaseButton v-if="dismissedCount" variant="ghost" @click="restoreAll">Restaurar {{ dismissedCount }} alerta(s) dispensado(s)</BaseButton>
  </div>
</template>

<script setup lang="ts">
import { useFinanceAlerts, type SmartAlert } from '~/features/finance/composables/useFinanceAlerts'
import { useFinanceNavigation } from '~/features/finance/composables/useFinanceNavigation'
import BaseEmptyState          from '~/components/base/BaseEmptyState.vue'
import BaseButton              from '~/components/base/BaseButton.vue'

const emit = defineEmits<{ (e: 'navigate', screen: string): void }>()

const appConfig = useAppConfig()
const { activeAlerts, dismissedCount, dismiss, dismissAll, restoreAll } = useFinanceAlerts()
const { goTo } = useFinanceNavigation()

const isClickable = (alert: SmartAlert) => !!(alert.entryId || alert.navigateTo)

const onAlertClick = (alert: SmartAlert) => {
  if (alert.entryId) { void goTo('planilha', { entry: alert.entryId }); return }
  if (alert.navigateTo) emit('navigate', alert.navigateTo)
}

</script>

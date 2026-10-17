<template>
  <UDropdownMenu :items="items"><UButton :icon="appConfig.ui.icons.ellipsis" color="neutral" variant="ghost" :aria-label="`Opções de ${label}`" class="min-h-10 min-w-10" @click.stop /></UDropdownMenu>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { resolveFinanceIcon } from '#shared/uiThemeIcons'
const appConfig = useAppConfig()
const iconSet = useState<string>('finance-ui-icon-set', () => 'lucide')
const props = defineProps<{ label: string }>()
const emit = defineEmits<{ action: [action: 'view' | 'hide' | 'hidePrevious' | 'clear'] }>()
const items = computed(() => [[{ label: props.label, type: 'label' as const }], [
  { label: 'Ver / editar lançamentos', icon: resolveFinanceIcon('planning', iconSet.value), onSelect: () => emit('action', 'view') },
  { label: 'Ocultar este mês', icon: appConfig.ui.icons.eyeOff, onSelect: () => emit('action', 'hide') },
  { label: 'Ocultar meses anteriores', icon: appConfig.ui.icons.eyeOff, onSelect: () => emit('action', 'hidePrevious') },
], [{ label: 'Apagar valores do mês…', icon: resolveFinanceIcon('trash', iconSet.value), color: 'error' as const, onSelect: () => emit('action', 'clear') }]])
</script>

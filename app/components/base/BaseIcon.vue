<template>
  <UIcon :name="iconName" :size="size" :style="{ color, flexShrink: 0 }" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useAppConfig } from '#imports'
import { resolveFinanceIcon } from '#shared/uiThemeIcons'
const props = withDefaults(
  defineProps<{ name: string; size?: number; color?: string }>(),
  { size: 16, color: 'currentColor' },
)
const appConfig = useAppConfig()
const iconFamilies = [
  ['i-lucide-', 'lucide'],
  ['i-bi-', 'bootstrap'],
  ['i-heroicons-', 'heroicons'],
  ['i-iconoir-', 'iconoir'],
  ['i-material-symbols-', 'material'],
  ['i-ph-', 'phosphor'],
  ['i-ri-', 'remix'],
  ['i-tabler-', 'tabler'],
] as const
// Read the same reactive theme as UIcon, including in standalone Nuxt UI/Vite consumers.
const iconSet = computed(() => {
  const search = appConfig.ui?.icons?.search
  if (typeof search !== 'string') return 'lucide'
  return (
    iconFamilies.find(([prefix]) => search.startsWith(prefix))?.[1] ?? 'lucide'
  )
})
const iconName = computed(() => resolveFinanceIcon(props.name, iconSet.value))
</script>

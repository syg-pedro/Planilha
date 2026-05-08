<template>
  <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" :class="toneClass">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    tone?: 'success' | 'warning' | 'neutral'
  }>(),
  {
    tone: 'neutral'
  }
)

const toneClass = computed(() => {
  if (props.tone === 'success') return 'bg-emerald-100 text-emerald-700'
  if (props.tone === 'warning') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
})
</script>

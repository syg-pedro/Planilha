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
  if (props.tone === 'success') return 'ds-badge ds-badge-success'
  if (props.tone === 'warning') return 'ds-badge ds-badge-warning'
  return 'ds-badge ds-badge-neutral'
})
</script>

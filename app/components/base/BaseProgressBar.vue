<template>
  <UProgress
    :model-value="pct"
    :max="100"
    :color="barColor"
    :style="{ '--base-progress-height': `${height}px` }"
    :ui="{ base: 'h-(--base-progress-height)', indicator: 'transition-none' }"
  />
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{
    value: number
    max?: number
    color?: string
    height?: number
    animate?: boolean
  }>(),
  { max: 100, color: 'var(--primary)', height: 8, animate: false },
)
const pct = computed(() =>
  props.max > 0 && Number.isFinite(props.value)
    ? Math.min(100, Math.max(0, (props.value / props.max) * 100))
    : 0,
)
const barColor = computed(() =>
  pct.value >= 90 ? 'error' : pct.value >= 70 ? 'warning' : props.color,
)
</script>

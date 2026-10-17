<template>
  <UChart
    type="donut"
    :data="slices"
    index="label"
    :categories="['value']"
    :colors="[ringColor, 'var(--ui-bg-accented)']"
    :width="size"
    :height="size"
    :thickness="stroke"
    :legend="false"
    :tooltip="false"
    :ui="{ base: 'transition-none', center: 'transition-none' }"
    :aria-label="`${label || 'Proporção'}: ${Math.round(progress)}%`"
  >
    <template v-if="label" #center
      ><span
        class="text-xs leading-none font-semibold"
        :style="{ color: ringColor }"
        >{{ label }}</span
      ><span v-if="sublabel" class="mt-1 text-[10px] text-muted">{{
        sublabel
      }}</span></template
    >
  </UChart>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{
    percent: number
    color?: string
    size?: number
    stroke?: number
    label?: string
    sublabel?: string
  }>(),
  { color: 'var(--primary)', size: 80, stroke: 10, label: '', sublabel: '' },
)
const progress = computed(() =>
  Math.max(
    0,
    Math.min(100, Number.isFinite(props.percent) ? props.percent : 0),
  ),
)
const slices = computed(() => [
  { label: 'Utilizado', value: progress.value },
  { label: 'Disponível', value: 100 - progress.value },
])
const ringColor = computed(() =>
  props.percent >= 90
    ? 'var(--danger)'
    : props.percent >= 70
      ? 'var(--warning)'
      : props.color,
)
</script>

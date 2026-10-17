<template>
  <UChart
    :type="fill ? 'area' : 'line'"
    :data="rows"
    index="point"
    :categories="[{ key: 'value', label: 'Valor', color }]"
    :height="height"
    :x-axis="false"
    :y-axis="false"
    :grid="false"
    :legend="false"
    :ui="{ base: 'transition-none' }"
    aria-label="Evolução dos valores"
  />
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{
    data: number[]
    height?: number
    color?: string
    fill?: boolean
  }>(),
  { height: 100, color: 'var(--primary)', fill: true },
)
const rows = computed(() =>
  props.data.map((value, index) => ({ point: index + 1, value })),
)
</script>

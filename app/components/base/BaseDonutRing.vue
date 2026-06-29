<template>
  <div :style="{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }">
    <svg :width="size" :height="size" style="transform: rotate(-90deg)">
    <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" stroke="var(--border)" :stroke-width="stroke + 3" />
    <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" stroke="var(--bg2)" :stroke-width="stroke" />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        :stroke="ringColor"
        :stroke-width="stroke"
        :stroke-dasharray="circ"
        :stroke-dashoffset="offset"
      style="transition: stroke-dashoffset 0.45s steps(8, end)"
      />
    </svg>
    <div
      v-if="label"
      style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center"
    >
      <span :style="{ fontSize: size > 60 ? '13px' : '11px', fontWeight: 800, color: ringColor, lineHeight: 1 }">{{ label }}</span>
      <span v-if="sublabel" style="font-size: 9px; color: var(--text3); margin-top: 1px">{{ sublabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  percent: number
  color?: string
  size?: number
  stroke?: number
  label?: string
  sublabel?: string
}>(), {
  color: 'var(--primary)',
  size: 80,
  stroke: 10,
  label: '',
  sublabel: '',
})

const r = computed(() => (props.size - props.stroke) / 2)
const circ = computed(() => 2 * Math.PI * r.value)
const offset = computed(() => circ.value * (1 - Math.min(1, props.percent / 100)))
const ringColor = computed(() => {
  if (props.percent >= 100) return 'var(--danger)'
  if (props.percent >= 90) return 'var(--danger)'
  if (props.percent >= 70) return 'var(--warning)'
  return props.color
})
</script>

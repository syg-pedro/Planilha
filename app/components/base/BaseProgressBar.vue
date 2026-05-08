<template>
  <div style="width: 100%">
    <div :style="{ height: `${height}px`, background: 'var(--bg2)', borderRadius: '99px', overflow: 'hidden' }">
      <div
        :style="{
          width: `${pct}%`,
          height: '100%',
          background: barColor,
          borderRadius: '99px',
          transition: animate ? 'width 0.6s cubic-bezier(.4,0,.2,1)' : 'none',
          boxShadow: pct >= 90 ? `0 0 8px ${barColor}` : pct >= 70 ? `0 0 4px ${barColor}` : 'none',
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  value: number
  max?: number
  color?: string
  height?: number
  animate?: boolean
}>(), {
  max: 100,
  color: 'var(--primary)',
  height: 8,
  animate: true,
})

const pct = computed(() => Math.min(100, Math.max(0, (props.value / props.max) * 100)))
const barColor = computed(() => {
  if (pct.value >= 100) return 'var(--danger)'
  if (pct.value >= 90) return 'var(--danger)'
  if (pct.value >= 70) return 'var(--warning)'
  return props.color
})
</script>

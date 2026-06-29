<template>
  <div class="base-progress">
    <div class="base-progress__track" :style="{ height: `${height}px` }">
      <div
        class="base-progress__fill"
        :style="{
          width: `${pct}%`,
          background: barColor,
          transition: animate ? 'width 0.45s steps(8, end)' : 'none',
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

<style scoped>
.base-progress {
  width: 100%;
}

.base-progress__track {
  min-height: 8px;
  overflow: hidden;
  background: var(--bg2);
  border: 2px solid var(--border);
  border-radius: var(--radius-xs);
}

.base-progress__fill {
  height: 100%;
  border-right: 2px solid var(--border);
}
</style>

<template>
  <div ref="containerRef" :style="{ width: '100%', height: `${height}px` }">
    <svg v-if="data.length" width="100%" :height="height" style="overflow: visible">
      <path v-if="fill" :d="fillPath" :fill="color" opacity="0.12" />
      <polyline :points="ptsStr" fill="none" :stroke="color" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle
        v-if="pts.length"
        :cx="pts[pts.length - 1]![0]"
        :cy="pts[pts.length - 1]![1]"
        r="4"
        :fill="color"
        stroke="var(--surface)"
        stroke-width="2"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  data: number[]
  height?: number
  color?: string
  fill?: boolean
}>(), {
  height: 100,
  color: 'var(--primary)',
  fill: true,
})

const containerRef = ref<HTMLDivElement | null>(null)
const w = ref(300)

const updateWidth = () => {
  if (containerRef.value) w.value = containerRef.value.offsetWidth || 300
}

onMounted(() => {
  updateWidth()
  window.addEventListener('resize', updateWidth)
})

onUnmounted(() => window.removeEventListener('resize', updateWidth))

const pts = computed(() => {
  if (!props.data.length) return []
  const max = Math.max(...props.data)
  const min = Math.min(...props.data)
  const range = max - min || 1
  return props.data.map((v, i) => [
    (i / (props.data.length - 1)) * w.value,
    props.height - ((v - min) / range) * (props.height - 8) - 4,
  ])
})

const ptsStr = computed(() => pts.value.map(([x, y]) => `${x},${y}`).join(' '))

const fillPath = computed(() => {
  if (!pts.value.length) return ''
  const first = pts.value[0]!
  const rest  = pts.value.slice(1)
  const pathPts = rest.map(([x, y]) => `${x},${y}`).join(' ')
  return `M ${first[0]},${first[1]} ${pathPts} L ${w.value},${props.height} L 0,${props.height} Z`
})
</script>

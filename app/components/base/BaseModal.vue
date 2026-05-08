<template>
  <Teleport to="body">
    <div
      v-if="open"
      style="position: fixed; inset: 0; z-index: 300; display: flex; align-items: center; justify-content: center; padding: 16px; background: oklch(0% 0 0 / 0.5); backdrop-filter: blur(4px)"
      @click.self="$emit('close')"
    >
      <div
        :style="{
          background: 'var(--surface)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: `${maxWidth}px`,
          maxHeight: '92dvh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }"
      >
        <div style="padding: 18px 22px 14px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border); gap: 12px">
          <div>
            <h2 style="font-size: 16px; font-weight: 800; color: var(--text)">{{ title }}</h2>
            <p v-if="subtitle" style="font-size: 12px; color: var(--text3); margin-top: 3px">{{ subtitle }}</p>
          </div>
          <button
            style="background: none; border: none; cursor: pointer; color: var(--text3); display: flex; padding: 4px; border-radius: 8px"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--surface2)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
            @click="$emit('close')"
          >
            <BaseIcon name="close" :size="18" />
          </button>
        </div>
        <div style="padding: 20px 22px">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import BaseIcon from './BaseIcon.vue'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  subtitle?: string
  maxWidth?: number
}>(), {
  maxWidth: 580,
})

defineEmits<{ close: [] }>()

watch(() => props.open, (val) => {
  if (process.client) document.body.style.overflow = val ? 'hidden' : ''
}, { immediate: true })
</script>

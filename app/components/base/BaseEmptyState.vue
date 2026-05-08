<template>
  <div style="text-align: center; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px">
    <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--surface2); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border)">
      <BaseIcon :name="icon" :size="24" color="var(--text3)" />
    </div>
    <div>
      <p style="font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 4px">{{ title }}</p>
      <p v-if="body" style="font-size: 13px; color: var(--text3); max-width: 280px; margin: 0 auto">{{ body }}</p>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import BaseIcon from './BaseIcon.vue'

withDefaults(defineProps<{
  icon?: string
  title: string
  body?: string
}>(), {
  icon: 'info',
})
</script>

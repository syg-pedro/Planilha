<template>
  <div
    v-if="current"
    :style="{
      background: bgMap[current.tone ?? 'info'],
      border: `1px solid ${borderMap[current.tone ?? 'info']}`,
      borderRadius: 'var(--radius-sm)',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }"
  >
    <BaseIcon
      :name="current.tone === 'danger' || current.tone === 'warning' ? 'warning' : 'info'"
      :size="16"
      :color="borderMap[current.tone ?? 'info']"
    />
    <div style="flex: 1; min-width: 0">
      <p style="font-size: 13px; font-weight: 700; color: var(--text)">{{ current.title }}</p>
      <p v-if="current.body" style="font-size: 12px; color: var(--text2); margin-top: 1px">{{ current.body }}</p>
    </div>
    <span
      v-if="remaining > 0"
      style="display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--surface2); color: var(--text2); white-space: nowrap"
    >+{{ remaining }}</span>
    <button
      style="background: none; border: none; cursor: pointer; color: var(--text3); display: flex; padding: 4px; border-radius: 6px"
      @click="dismiss"
    >
      <BaseIcon name="close" :size="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseIcon from './BaseIcon.vue'

interface AlertItem {
  tone?: 'danger' | 'warning' | 'info' | 'success'
  title: string
  body?: string
}

const props = defineProps<{ alerts: AlertItem[] }>()

const dismissed = ref<number[]>([])

const visible = computed(() => props.alerts.filter((_, i) => !dismissed.value.includes(i)))
const current = computed(() => visible.value[0] ?? null)
const remaining = computed(() => visible.value.length - 1)

const bgMap: Record<string, string> = {
  danger: 'var(--danger-light)',
  warning: 'var(--warning-light)',
  info: 'var(--primary-dim)',
  success: 'var(--success-light)',
}

const borderMap: Record<string, string> = {
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--primary)',
  success: 'var(--success)',
}

const dismiss = () => {
  const idx = props.alerts.indexOf(current.value!)
  if (idx >= 0) dismissed.value = [...dismissed.value, idx]
}
</script>

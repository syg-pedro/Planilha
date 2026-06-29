<template>
  <div
    v-if="current"
    class="base-alert"
    :style="{
      background: bgMap[current.tone ?? 'info'],
      '--alert-color': borderMap[current.tone ?? 'info'],
    }"
  >
    <BaseIcon
      :name="current.tone === 'danger' || current.tone === 'warning' ? 'warning' : 'info'"
      :size="16"
      :color="borderMap[current.tone ?? 'info']"
    />
    <div class="base-alert__content">
      <p class="base-alert__title">{{ current.title }}</p>
      <p v-if="current.body" class="base-alert__body">{{ current.body }}</p>
    </div>
    <span
      v-if="remaining > 0"
      class="base-alert__count"
    >+{{ remaining }}</span>
    <button
      class="base-alert__close"
      type="button"
      aria-label="Dispensar alerta"
      @click="dismiss"
    >
      <BaseIcon name="close" :size="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseIcon from '../../design-system/components/BaseIcon.vue'

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

<style scoped>
.base-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border: var(--border-width) solid var(--border);
  border-left: 8px solid var(--alert-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}

.base-alert__content {
  flex: 1;
  min-width: 0;
}

.base-alert__title {
  color: var(--text);
  font-size: 13px;
  font-weight: 800;
}

.base-alert__body {
  margin-top: 1px;
  color: var(--text2);
  font-size: 12px;
  font-weight: 600;
}

.base-alert__count {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  color: var(--text2);
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.base-alert__close {
  display: flex;
  padding: 5px;
  color: var(--text);
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius-xs);
  cursor: pointer;
}
</style>

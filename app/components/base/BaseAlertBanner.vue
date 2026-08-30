<template>
  <div v-if="visible.length > 0" class="base-alert-stack">
    <div
      v-for="item in visible"
      :key="item.index"
      class="base-alert"
      :style="{ background: bgMap[item.tone ?? 'info'] }"
    >
      <BaseIcon
        :name="item.tone === 'danger' || item.tone === 'warning' ? 'warning' : 'info'"
        :size="17"
        :color="toneMap[item.tone ?? 'info']"
        class="base-alert__icon"
      />
      <div class="base-alert__content">
        <p class="base-alert__title">{{ item.title }}</p>
        <p v-if="item.body" class="base-alert__body">{{ item.body }}</p>
      </div>
      <button
        class="base-alert__close"
        type="button"
        aria-label="Dispensar alerta"
        @click="dismiss(item.index)"
      >
        <BaseIcon name="close" :size="13" />
      </button>
    </div>
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

const visible = computed(() =>
  props.alerts
    .map((alert, index) => ({ ...alert, index }))
    .filter(item => !dismissed.value.includes(item.index))
)

const bgMap: Record<string, string> = {
  danger: 'var(--danger-light)',
  warning: 'var(--warning-light)',
  info: 'var(--primary-dim)',
  success: 'var(--success-light)',
}

const toneMap: Record<string, string> = {
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--primary)',
  success: 'var(--success)',
}

const dismiss = (index: number) => {
  dismissed.value = [...dismissed.value, index]
}
</script>

<style scoped>
.base-alert-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.base-alert {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border: var(--border-width) solid var(--border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--shadow-sm);
}

.base-alert__icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.base-alert__content {
  flex: 1;
  min-width: 0;
}

.base-alert__title {
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
}

.base-alert__body {
  margin-top: 2px;
  color: var(--text3);
  font-size: 11.5px;
  font-weight: 600;
}

.base-alert__close {
  display: flex;
  align-self: flex-start;
  padding: 4px;
  color: var(--text3);
  background: transparent;
  border: none;
  cursor: pointer;
}

.base-alert__close:hover {
  color: var(--text);
}

@media (max-width: 640px) {
  .base-alert {
    gap: 9px;
    padding: 10px 12px;
    box-shadow: var(--shadow-xs);
  }

  .base-alert__title {
    font-size: 12.5px;
  }

  .base-alert__body {
    font-size: 11px;
  }
}
</style>

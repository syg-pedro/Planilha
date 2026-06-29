<template>
  <span class="base-badge" :class="toneClass">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    tone?: 'success' | 'warning' | 'neutral'
  }>(),
  {
    tone: 'neutral'
  }
)

const toneClass = computed(() => {
  return `base-badge--${props.tone}`
})
</script>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border: 2px solid var(--border);
  border-radius: var(--radius-xs);
  box-shadow: 2px 2px 0 var(--ds-shadow-color);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
}

.base-badge--success {
  background: var(--success-light);
  color: var(--success);
}

.base-badge--warning {
  background: var(--warning-light);
  color: var(--warning);
}

.base-badge--neutral {
  background: var(--surface2);
  color: var(--text2);
}
</style>

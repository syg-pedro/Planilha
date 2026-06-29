<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClass"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="base-button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: Variant
    size?: Size
    block?: boolean
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    type: 'button',
    variant: 'secondary',
    size: 'md',
    block: false,
    loading: false,
    disabled: false
  }
)

const buttonClass = computed(() => {
  return [
    'base-button',
    `base-button--${props.variant}`,
    `base-button--${props.size}`,
    { 'base-button--block': props.block },
  ]
})
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 3px 3px 0 var(--ds-shadow-color);
  color: var(--text);
  font-weight: 750;
  line-height: 1.1;
  cursor: pointer;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.base-button:not(:disabled):hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--ds-shadow-color);
}

.base-button:not(:disabled):active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ds-shadow-color);
}

.base-button:disabled {
  cursor: not-allowed;
  filter: grayscale(0.45);
  opacity: 0.58;
}

.base-button--primary {
  background: var(--primary);
  color: #ffffff;
}

.base-button--secondary {
  background: var(--surface);
}

.base-button--ghost {
  background: var(--surface2);
  color: var(--text2);
  box-shadow: none;
}

.base-button--danger {
  background: var(--danger);
  color: #ffffff;
}

.base-button--sm {
  min-height: 32px;
  padding: 6px 10px;
  font-size: 12px;
}

.base-button--md {
  min-height: 40px;
  padding: 9px 14px;
  font-size: 14px;
}

.base-button--block {
  width: 100%;
}

.base-button__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: base-button-spin 0.65s linear infinite;
}

@keyframes base-button-spin {
  to { transform: rotate(360deg); }
}
</style>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClass"
    :style="buttonStyle"
  >
    <span v-if="loading" class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
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

const variants: Record<Variant, string> = {
  primary: 'text-white border-transparent',
  secondary: 'border',
  ghost: 'border-transparent',
  danger: 'text-white border-transparent'
}

const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm'
}

const buttonClass = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60'
  const sizeClass = sizes[props.size]
  const variantClass = variants[props.variant]
  return [base, sizeClass, variantClass, props.block ? 'w-full' : '']
})

const buttonStyle = computed(() => {
  if (props.variant === 'primary') {
    return { background: 'var(--ds-color-brand-primary)' }
  }
  if (props.variant === 'danger') {
    return { background: 'var(--ds-color-state-danger)' }
  }
  if (props.variant === 'ghost') {
    return {
      background: 'transparent',
      color: 'var(--ds-color-text-muted)'
    }
  }
  return {
    background: 'color-mix(in srgb, var(--ds-color-surface-card) 98%, transparent)',
    borderColor: 'var(--ds-color-border-strong)',
    color: 'var(--ds-color-text-primary)'
  }
})
</script>

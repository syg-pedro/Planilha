<template>
  <UButton
    :type="type"
    :color="
      variant === 'danger'
        ? 'error'
        : variant === 'primary'
          ? 'primary'
          : 'neutral'
    "
    :variant="variant === 'primary' ? undefined : uiVariant"
    :size="size"
    :block="block"
    :loading="loading"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    class="finance-control"
    :class="{ 'finance-control--small': size === 'sm' }"
    ><slot
  /></UButton>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    block?: boolean
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    size: undefined,
    block: false,
    loading: false,
    disabled: false,
  },
)
const uiVariant = computed(() =>
  props.variant === 'secondary'
    ? 'outline'
    : props.variant === 'ghost'
      ? 'ghost'
      : 'solid',
)
</script>

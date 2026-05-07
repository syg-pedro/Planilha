<template>
  <label class="flex flex-col gap-1 text-sm">
    <span v-if="label" class="font-medium ds-text-muted">{{ label }}</span>
    <select
      :value="modelValue"
      class="ds-field ds-select"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <slot />
    </select>
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    label?: string
  }>(),
  {
    label: ''
  }
)

defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

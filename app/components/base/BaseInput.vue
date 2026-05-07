<template>
  <label class="flex flex-col gap-1 text-sm">
    <span v-if="label" class="font-medium ds-text-muted">{{ label }}</span>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      class="ds-field"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    type?: string
  }>(),
  {
    label: '',
    placeholder: '',
    type: 'text'
  }
)

defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

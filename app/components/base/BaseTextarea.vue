<template>
  <label class="flex flex-col gap-1 text-sm">
    <span v-if="label" class="font-medium ds-text-muted">{{ label }}</span>
    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      class="ds-field"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    rows?: number
  }>(),
  {
    label: '',
    placeholder: '',
    rows: 6
  }
)

defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

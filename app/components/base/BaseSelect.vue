<template>
  <BaseDropdown
    v-bind="$attrs"
    :model-value="modelValue"
    :label="label"
    :placeholder="placeholder"
    @update:model-value="$emit('update:modelValue', $event)"
    ><slot
  /></BaseDropdown>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })
withDefaults(
  defineProps<{ modelValue: string; label?: string; placeholder?: string }>(),
  { label: '', placeholder: 'Selecionar…' },
)
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

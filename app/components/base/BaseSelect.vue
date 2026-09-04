<template>
  <label class="flex flex-col gap-1 text-sm" :for="fieldId">
    <span v-if="label" class="font-medium ds-text-muted">{{ label }}</span>
    <select :id="fieldId" v-bind="$attrs" :value="modelValue" class="ds-field" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <slot />
    </select>
  </label>
</template>
<script setup lang="ts">
import { computed, useId } from 'vue'
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{ modelValue: string; label?: string; placeholder?: string; id?: string }>(), { label: '', placeholder: 'Selecionar...' })
defineEmits<{ (e: 'update:modelValue', value: string): void }>()
const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)
</script>

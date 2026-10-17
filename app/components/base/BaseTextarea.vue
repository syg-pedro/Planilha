<template>
  <UFormField
    :label="label || undefined"
    :help="hint || undefined"
    :error="error || undefined"
    :name="typeof $attrs.name === 'string' ? $attrs.name : undefined"
    :required="isRequired"
    class="base-field w-full"
  >
    <UTextarea
      :id="fieldId"
      ref="control"
      v-bind="$attrs"
      :model-value="modelValue ?? ''"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      :readonly="readonly"
      class="w-full"
      :ui="{ base: 'finance-control finance-textarea' }"
      @update:model-value="$emit('update:modelValue', String($event ?? ''))"
    />
  </UFormField>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, useId } from 'vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    modelValue: string | null
    id?: string
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    rows?: number
    disabled?: boolean
    readonly?: boolean
  }>(),
  {
    label: '',
    hint: '',
    error: '',
    placeholder: '',
    rows: 3,
    disabled: false,
    readonly: false,
    id: undefined,
  },
)
defineEmits<{ 'update:modelValue': [value: string] }>()
const attrs = useAttrs()
const generatedId = useId()
const fieldId = computed(() => props.id || `field-${generatedId}`)
const control = ref<{ textareaRef: HTMLTextAreaElement | null } | null>(null)
const input = computed(() => control.value?.textareaRef ?? null)
const isRequired = computed(
  () => attrs.required !== undefined && attrs.required !== false,
)
defineExpose({ focus: () => input.value?.focus(), input })
</script>

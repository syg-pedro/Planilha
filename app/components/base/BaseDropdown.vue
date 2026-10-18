<template>
  <UFormField
    :label="label || undefined"
    :help="hint || undefined"
    :error="error || undefined"
    :name="typeof $attrs.name === 'string' ? $attrs.name : undefined"
    class="base-field base-dropdown"
    :class="$attrs.class"
    :style="$attrs.style as any"
  >
    <USelect
      :id="fieldId"
      ref="control"
      v-bind="controlAttrs"
      :model-value="selectedValue"
      :open="open"
      :items="items"
      value-key="value"
      label-key="label"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-readonly="readonly || undefined"
      :aria-label="ariaLabel || undefined"
      :style="height ? { height: `${height}px` } : undefined"
      class="bd-trigger base-select__trigger w-full"
      :ui="{
        base: 'finance-control',
        content: 'base-select-menu',
        item: 'base-select-option',
        itemLabel: 'overflow-visible text-clip whitespace-normal break-words',
        value: wrap ? 'overflow-visible text-clip whitespace-normal break-words text-start' : undefined,
      }"
      :content="{ position: 'popper', sideOffset: 4, collisionPadding: 8 }"
      @update:model-value="updateValue"
      @update:open="updateOpen"
    />
  </UFormField>
</template>

<script setup lang="ts" generic="T extends string = string">
import {
  computed,
  onBeforeUnmount,
  onDeactivated,
  ref,
  useAttrs,
  useId,
  useSlots,
  watch,
} from 'vue'

defineOptions({ inheritAttrs: false })
interface Option {
  value: T
  label: string
  disabled?: boolean
}
const props = withDefaults(
  defineProps<{
    modelValue: T
    options?: Option[]
    id?: string
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    height?: number
    ariaLabel?: string
    disabled?: boolean
    readonly?: boolean
    wrap?: boolean
  }>(),
  {
    options: undefined,
    id: undefined,
    label: '',
    hint: '',
    error: '',
    placeholder: 'Selecionar…',
    height: undefined,
    ariaLabel: undefined,
    disabled: false,
    readonly: false,
    wrap: false,
  },
)
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
const attrs = useAttrs()
const slots = useSlots()
const generatedId = useId()
const fieldId = computed(() => props.id || `select-${generatedId}`)
// Reka Select reserves an empty string for clearing. Keep the legacy empty option contract at this boundary.
const emptyValue = `base-empty-${generatedId}`
const control = ref<{ triggerRef: HTMLButtonElement | null } | null>(null)
const open = ref(false)
const controlAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'),
  ),
)
function text(children: unknown): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(text).join('')
  if (children && typeof children === 'object' && 'children' in children)
    return text(children.children)
  return ''
}
function optionsFromSlot(nodes: unknown[]): Option[] {
  return nodes.flatMap((node) => {
    if (!node || typeof node !== 'object') return []
    if (Array.isArray(node)) return optionsFromSlot(node)
    const vnode = node as {
      type?: unknown
      children?: unknown
      props?: Record<string, unknown>
    }
    if (vnode.type === 'option')
      return [
        {
          value: String(vnode.props?.value ?? '') as T,
          label: text(vnode.children) || String(vnode.props?.value ?? ''),
          disabled:
            vnode.props?.disabled === '' || vnode.props?.disabled === true,
        },
      ]
    return Array.isArray(vnode.children) ? optionsFromSlot(vnode.children) : []
  })
}
const items = computed(() =>
  (props.options ?? optionsFromSlot(slots.default?.() ?? [])).map((option) => ({
    ...option,
    value: option.value === '' ? emptyValue : option.value,
  })),
)
const selectedValue = computed(() =>
  props.modelValue === '' ? emptyValue : props.modelValue,
)
function updateValue(value: string | undefined) {
  if (!props.readonly && !props.disabled)
    emit('update:modelValue', (value === emptyValue ? '' : (value ?? '')) as T)
}
function updateOpen(value: boolean) {
  open.value = !props.readonly && !props.disabled && value
}
function close() {
  open.value = false
  removeBackListeners()
}
function onBack(event: Event) {
  if (!open.value || event.defaultPrevented) return
  event.preventDefault()
  event.stopImmediatePropagation()
  close()
}
function removeBackListeners() {
  if (!import.meta.client) return
  window.removeEventListener('finance:back', onBack, true)
  window.removeEventListener('finance:close-popup', onBack, true)
}
watch(open, (value) => {
  removeBackListeners()
  if (value && import.meta.client) {
    window.addEventListener('finance:back', onBack, true)
    window.addEventListener('finance:close-popup', onBack, true)
  }
})
watch(
  () => props.disabled || props.readonly,
  (value) => {
    if (value) close()
  },
)
onDeactivated(close)
onBeforeUnmount(removeBackListeners)
defineExpose({ focus: () => control.value?.triggerRef?.focus(), close })
</script>

<template>
  <label class="flex flex-col gap-1 text-sm">
    <span v-if="label" class="font-medium ds-text-muted">{{ label }}</span>
    <div ref="containerRef" class="relative select-none">
      <!-- Trigger -->
      <div
        class="flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 text-sm transition"
        style="height: 38px; background: var(--ds-color-surface-card-soft)"
        :style="open
          ? { borderColor: 'var(--ds-color-brand-primary)', boxShadow: '0 0 0 3px var(--ds-color-brand-primary-dim)', borderBottomLeftRadius: '0', borderBottomRightRadius: '0' }
          : { borderColor: 'var(--ds-color-border-default)' }"
        @click="toggle"
      >
        <span
          class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
          :style="selectedOption ? { color: 'var(--ds-color-text-primary)' } : { color: 'var(--ds-color-text-muted)' }"
        >
          {{ selectedOption?.label ?? placeholder }}
        </span>
        <svg
          class="shrink-0 transition-transform duration-200"
          style="color: var(--ds-color-text-muted)"
          :style="{ transform: open ? 'rotate(180deg)' : 'none' }"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      <!-- Dropdown -->
      <div
        v-if="open"
        class="absolute left-0 right-0 z-50 overflow-y-auto border border-t-0"
        style="max-height: 220px; background: var(--ds-color-surface-card); border-color: var(--ds-color-brand-primary); border-radius: 0 0 var(--ds-radius-sm) var(--ds-radius-sm); box-shadow: var(--ds-shadow-md)"
      >
        <div
          v-for="opt in options"
          :key="opt.value"
          class="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors"
          :style="String(opt.value) === String(modelValue)
            ? { color: 'var(--ds-color-brand-primary)', background: 'var(--ds-color-brand-primary-dim)' }
            : { color: 'var(--ds-color-text-primary)' }"
          @mousedown.prevent="select(opt.value)"
          @mouseenter="onOptHover($event, opt.value, true)"
          @mouseleave="onOptHover($event, opt.value, false)"
        >
          <span>{{ opt.label }}</span>
          <svg
            v-if="String(opt.value) === String(modelValue)"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
    </div>
  </label>
</template>

<script setup lang="ts">
import { ref, computed, useSlots, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
  }>(),
  {
    label: '',
    placeholder: 'Selecionar...'
  }
)

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const slots = useSlots()
const containerRef = ref<HTMLElement | null>(null)
const open = ref(false)

interface Option {
  value: string
  label: string
}

const getTextFromChildren = (children: unknown): string => {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(getTextFromChildren).join('')
  if (children && typeof children === 'object' && 'children' in (children as object)) {
    return getTextFromChildren((children as { children: unknown }).children)
  }
  return ''
}

const flattenVNodes = (nodes: unknown[]): unknown[] => {
  const result: unknown[] = []
  for (const node of nodes) {
    if (!node) continue
    if (Array.isArray(node)) {
      result.push(...flattenVNodes(node))
    } else if (node && typeof node === 'object') {
      const vn = node as { type?: unknown; children?: unknown }
      if (vn.type === 'option') {
        result.push(vn)
      } else if (Array.isArray(vn.children)) {
        result.push(...flattenVNodes(vn.children))
      }
    }
  }
  return result
}

const options = computed<Option[]>(() => {
  const slotContent = slots.default?.()
  if (!slotContent) return []
  const flat = flattenVNodes(slotContent)
  return flat
    .filter((v): v is { type: string; props: Record<string, unknown>; children: unknown } =>
      !!v && typeof v === 'object' && (v as { type?: unknown }).type === 'option'
    )
    .map((v) => ({
      value: String(v.props?.value ?? ''),
      label: getTextFromChildren(v.children) || String(v.props?.value ?? '')
    }))
})

const selectedOption = computed(() =>
  options.value.find((o) => String(o.value) === String(props.modelValue))
)

const toggle = () => {
  open.value = !open.value
}

const select = (value: string) => {
  emit('update:modelValue', value)
  open.value = false
}

const onOptHover = (e: MouseEvent, value: string, entering: boolean) => {
  if (String(value) === String(props.modelValue)) return
  const el = e.currentTarget as HTMLElement
  el.style.background = entering ? 'var(--ds-color-surface-card-soft)' : 'transparent'
}

const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

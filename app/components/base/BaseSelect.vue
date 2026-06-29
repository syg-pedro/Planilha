<template>
  <label class="flex flex-col gap-1 text-sm">
    <span v-if="label" class="font-medium ds-text-muted">{{ label }}</span>
    <div ref="containerRef" class="relative select-none">
      <!-- Trigger -->
      <div
        class="base-select__trigger"
        :class="{ 'base-select__trigger--open': open }"
        role="combobox"
        tabindex="0"
        :aria-expanded="open"
        @click="toggle"
        @keydown.enter.prevent="toggle"
        @keydown.space.prevent="toggle"
        @keydown.esc="open = false"
      >
        <span
          class="base-select__value"
          :class="{ 'base-select__value--placeholder': !selectedOption }"
        >
          {{ selectedOption?.label ?? placeholder }}
        </span>
        <svg
          class="base-select__caret"
          :style="{ transform: open ? 'rotate(180deg)' : 'none' }"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      <!-- Dropdown -->
      <div
        v-if="open"
        class="base-select__menu"
        role="listbox"
      >
        <div
          v-for="opt in options"
          :key="opt.value"
          class="base-select__option"
          :class="{ 'base-select__option--active': String(opt.value) === String(modelValue) }"
          role="option"
          :aria-selected="String(opt.value) === String(modelValue)"
          @mousedown.prevent="select(opt.value)"
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

const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<style scoped>
.base-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 42px;
  padding: 0 12px;
  color: var(--text);
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 2px 2px 0 var(--ds-shadow-color);
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.base-select__trigger--open {
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
  box-shadow: 3px 3px 0 var(--primary);
}

.base-select__value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-select__value--placeholder {
  color: var(--text3);
}

.base-select__caret {
  flex-shrink: 0;
  color: var(--text);
  transition: transform var(--ds-motion-base) linear;
}

.base-select__menu {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 50;
  max-height: 220px;
  overflow-y: auto;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-top: 0;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  box-shadow: var(--shadow-md);
}

.base-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
}

.base-select__option:last-child {
  border-bottom: 0;
}

.base-select__option:hover {
  background: var(--surface2);
}

.base-select__option--active {
  color: var(--text);
  background: var(--primary-dim);
  font-weight: 800;
}
</style>

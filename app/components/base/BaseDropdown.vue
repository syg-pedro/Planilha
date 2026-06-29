<template>
  <div
    ref="triggerRef"
    class="bd-trigger"
    :class="{ 'bd-trigger--open': open }"
    :style="{ height: height + 'px' }"
    role="button"
    tabindex="0"
    @click="toggle"
    @keydown.enter.prevent="onEnter"
    @keydown.space.prevent="toggle"
    @keydown.down.prevent="open ? move(1) : openMenu()"
    @keydown.up.prevent="open && move(-1)"
    @keydown.esc="open = false"
  >
    <span class="bd-value" :class="{ 'bd-value--placeholder': !selectedLabel }">
      {{ selectedLabel || placeholder }}
    </span>
    <svg
      class="bd-caret"
      :style="{ transform: open ? 'rotate(180deg)' : 'none' }"
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>

  <Teleport to="body">
    <Transition name="bd-pop">
      <ul
        v-if="open"
        ref="listRef"
        class="bd-list"
        :style="listStyle"
        role="listbox"
      >
        <li
          v-for="(opt, i) in normalizedOptions"
          :key="opt.value"
          class="bd-opt"
          :class="{ 'bd-opt--active': String(opt.value) === String(modelValue), 'bd-opt--cursor': i === cursor }"
          role="option"
          :aria-selected="String(opt.value) === String(modelValue)"
          @click="select(opt.value)"
          @mouseenter="cursor = i"
        >
          <span class="bd-opt-label">{{ opt.label }}</span>
          <svg
            v-if="String(opt.value) === String(modelValue)"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </li>
      </ul>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts" generic="T extends string = string">
import { ref, computed, useSlots, nextTick, onBeforeUnmount, watchEffect } from 'vue'

interface Option { value: T; label: string }

const props = withDefaults(defineProps<{
  modelValue: T
  options?: Option[]
  placeholder?: string
  height?: number
}>(), {
  options: undefined,
  placeholder: 'Selecionar...',
  height: 44,
})

const emit = defineEmits<{ (e: 'update:modelValue', value: T): void }>()

const slots = useSlots()
const triggerRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const open = ref(false)
const cursor = ref(-1)
const pos = ref({ left: 0, top: 0, width: 0, maxH: 280 })

// ── Opções: via prop `options` ou parseando <option> do slot ──────────────────
const getText = (children: unknown): string => {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(getText).join('')
  if (children && typeof children === 'object' && 'children' in (children as object)) {
    return getText((children as { children: unknown }).children)
  }
  return ''
}
const flatten = (nodes: unknown[]): unknown[] => {
  const out: unknown[] = []
  for (const node of nodes) {
    if (!node) continue
    if (Array.isArray(node)) { out.push(...flatten(node)); continue }
    if (typeof node === 'object') {
      const vn = node as { type?: unknown; children?: unknown }
      if (vn.type === 'option') out.push(vn)
      else if (Array.isArray(vn.children)) out.push(...flatten(vn.children))
    }
  }
  return out
}
const slotOptions = computed<Option[]>(() => {
  const content = slots.default?.()
  if (!content) return []
  return flatten(content)
    .map((v) => {
      const vn = v as { props?: Record<string, unknown>; children?: unknown }
      return {
        value: String(vn.props?.value ?? '') as T,
        label: getText(vn.children) || String(vn.props?.value ?? ''),
      }
    })
})
const normalizedOptions = computed<Option[]>(() => props.options ?? slotOptions.value)

const selectedLabel = computed(() =>
  normalizedOptions.value.find((o) => String(o.value) === String(props.modelValue))?.label ?? ''
)

const listStyle = computed(() => ({
  position: 'fixed' as const,
  left: pos.value.left + 'px',
  top: pos.value.top + 'px',
  width: pos.value.width + 'px',
  maxHeight: pos.value.maxH + 'px',
}))

const place = () => {
  const el = triggerRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const desired = Math.min(280, normalizedOptions.value.length * 42 + 8)
  const spaceBelow = window.innerHeight - r.bottom
  const openUp = spaceBelow < desired + 12 && r.top > spaceBelow
  pos.value = {
    left: r.left,
    width: r.width,
    top: openUp ? Math.max(8, r.top - Math.min(desired, r.top - 12) - 6) : r.bottom + 6,
    maxH: openUp ? Math.min(desired, r.top - 14) : Math.min(desired, spaceBelow - 14),
  }
}

const onScroll = () => place()
const onDocPointer = (e: MouseEvent) => {
  const t = e.target as Node
  if (triggerRef.value?.contains(t) || listRef.value?.contains(t)) return
  open.value = false
}

const addListeners = () => {
  document.addEventListener('mousedown', onDocPointer)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)
}
const removeListeners = () => {
  document.removeEventListener('mousedown', onDocPointer)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
}

const openMenu = () => {
  if (open.value) return
  place()
  open.value = true
  cursor.value = normalizedOptions.value.findIndex((o) => String(o.value) === String(props.modelValue))
  nextTick(() => { place(); addListeners() })
}
const toggle = () => {
  if (open.value) open.value = false
  else openMenu()
}

const select = (value: T) => {
  emit('update:modelValue', value)
  open.value = false
}

const move = (delta: number) => {
  const n = normalizedOptions.value.length
  if (!n) return
  cursor.value = (cursor.value + delta + n) % n
}

const onEnter = () => {
  if (!open.value) { openMenu(); return }
  const opt = normalizedOptions.value[cursor.value]
  if (opt) select(opt.value)
  else open.value = false
}

watchEffect(() => { if (!open.value) removeListeners() })
onBeforeUnmount(removeListeners)
</script>

<style scoped>
.bd-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 12px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 2px 2px 0 var(--ds-shadow-color);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  color: var(--text);
  outline: none;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
  user-select: none;
}
.bd-trigger:focus-visible,
.bd-trigger--open {
  border-color: var(--border);
  box-shadow: 3px 3px 0 var(--primary);
  transform: translate(-1px, -1px);
}
.bd-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 650;
}
.bd-value--placeholder { color: var(--text3); }
.bd-caret {
  flex-shrink: 0;
  color: var(--text3);
  transition: transform 0.2s;
}
</style>

<style>
/* Lista teleportada para o body (não-scoped) */
.bd-list {
  z-index: 1000;
  margin: 0;
  padding: 4px;
  list-style: none;
  overflow-y: auto;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
}
.bd-opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 11px;
  border: 2px solid transparent;
  border-radius: var(--radius-xs);
  font-size: 14px;
  font-weight: 650;
  color: var(--text);
  cursor: pointer;
}
.bd-opt-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bd-opt--cursor {
  background: var(--surface2);
  border-color: var(--border);
}
.bd-opt--active {
  color: var(--text);
  background: var(--primary-dim);
  border-color: var(--border);
  font-weight: 700;
}
.bd-pop-enter-active,
.bd-pop-leave-active { transition: opacity var(--ds-motion-base) linear, transform var(--ds-motion-base) linear; }
.bd-pop-enter-from,
.bd-pop-leave-to { opacity: 0; transform: translate(4px, 4px); }
</style>

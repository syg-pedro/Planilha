<template>
  <UModal
    v-if="componentActive"
    :open="open"
    :title="title"
    :description="subtitle || undefined"
    :dismissible="!busy"
    :close="{ disabled: busy }"
    :content="contentProps"
    :ui="modalUi"
    @update:open="updateOpen"
  >
    <template #body
      ><div ref="body"><slot /></div
    ></template>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </UModal>
</template>

<script lang="ts">
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  watch,
} from 'vue'
// Only business-level Android Back ordering is shared; Nuxt UI/Reka own dialog accessibility and scroll locking.
const modalStack: symbol[] = []
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    subtitle?: string
    maxWidth?: number
    mode?: 'auto' | 'dialog' | 'sheet'
    busy?: boolean
  }>(),
  { subtitle: '', maxWidth: 580, mode: 'auto', busy: false },
)
const emit = defineEmits<{ close: [] }>()
const key = Symbol('modal')
const componentActive = ref(true)
const body = ref<HTMLElement | null>(null)
const viewport = ref({ height: 0, top: 0 })
let registered = false
let opener: HTMLElement | null = null
const contentProps = computed(() => ({
  style: {
    '--base-modal-width': `${props.maxWidth}px`,
    ...(viewport.value.height
      ? {
          '--base-modal-viewport-height': `${viewport.value.height}px`,
          '--base-modal-viewport-top': `${viewport.value.top}px`,
        }
      : {}),
  },
  'aria-busy': props.busy || undefined,
  // Controlled dialogs have an external trigger, so provide it to Reka's documented restoration hook.
  onCloseAutoFocus: (event: Event) => {
    if (
      opener?.isConnected &&
      opener.getClientRects().length &&
      !opener.closest('[inert]')
    ) {
      event.preventDefault()
      opener.focus({ preventScroll: true })
    }
  },
}))
const modalUi = computed(() => ({
  content: `base-modal base-modal--${props.mode}`,
  header: 'base-modal__header shrink-0',
  wrapper: 'min-w-0 pe-8',
  body: 'base-modal__body',
  footer: 'base-modal__footer shrink-0 flex-wrap justify-end gap-2',
  title: 'base-modal__title',
  description: 'base-modal__subtitle',
}))
function updateOpen(value: boolean) {
  if (!value && !props.busy) emit('close')
}
function onBack(event: Event) {
  if (event.defaultPrevented || modalStack.at(-1) !== key) return
  event.preventDefault()
  event.stopImmediatePropagation()
  const popup = new Event('finance:close-popup', { cancelable: true })
  window.dispatchEvent(popup)
  if (!popup.defaultPrevented && !props.busy) emit('close')
}
function updateViewport() {
  const view = window.visualViewport
  viewport.value = {
    height: view?.height ?? window.innerHeight,
    top: view?.offsetTop ?? 0,
  }
}
function register() {
  if (registered || !import.meta.client) return
  registered = true
  opener =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  modalStack.push(key)
  window.addEventListener('finance:back', onBack, true)
  window.addEventListener('resize', updateViewport)
  window.visualViewport?.addEventListener('resize', updateViewport)
  window.visualViewport?.addEventListener('scroll', updateViewport)
  updateViewport()
}
function unregister() {
  if (!registered || !import.meta.client) return
  registered = false
  const index = modalStack.indexOf(key)
  if (index >= 0) modalStack.splice(index, 1)
  window.removeEventListener('finance:back', onBack, true)
  window.removeEventListener('resize', updateViewport)
  window.visualViewport?.removeEventListener('resize', updateViewport)
  window.visualViewport?.removeEventListener('scroll', updateViewport)
}
watch(
  [() => props.open, componentActive],
  ([open, active]) => {
    if (open && active) register()
    else unregister()
  },
  { immediate: true },
)
onActivated(() => {
  componentActive.value = true
})
onDeactivated(() => {
  componentActive.value = false
  unregister()
})
onBeforeUnmount(unregister)
function focusFirst() {
  body.value
    ?.querySelector<HTMLElement>(
      'input:not(:disabled), textarea:not(:disabled), button:not(:disabled), summary, a[href]',
    )
    ?.focus()
}
defineExpose({ focusFirst })
</script>

<style>
.base-modal {
  max-width: min(var(--base-modal-width), calc(100vw - 2rem));
  max-height: calc(var(--base-modal-viewport-height, 100dvh) - 2rem);
  top: calc(
    var(--base-modal-viewport-top, 0px) +
      var(--base-modal-viewport-height, 100dvh) / 2
  );
}
.base-modal__body {
  min-height: 0;
  overscroll-behavior: contain;
}
.base-modal--sheet {
  top: calc(
    var(--base-modal-viewport-top, 0px) +
      var(--base-modal-viewport-height, 100dvh)
  );
  translate: -50% -100%;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
@media (max-width: 767px) {
  .base-modal--sheet {
    top: calc(
      var(--base-modal-viewport-top, 0px) +
        var(--base-modal-viewport-height, 100dvh)
    );
    left: 0;
    translate: 0 -100%;
    width: 100%;
    max-width: none;
    max-height: calc(
      var(--base-modal-viewport-height, 100dvh) -
        max(8px, env(safe-area-inset-top, 0px))
    );
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .base-modal__footer {
    padding-bottom: max(var(--ds-space-5), env(safe-area-inset-bottom, 0px));
  }
}
</style>

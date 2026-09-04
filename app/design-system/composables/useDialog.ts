import { nextTick, onScopeDispose, watch, type Ref } from 'vue'

const stack: symbol[] = []
export const useDialog = (open: Readonly<Ref<boolean>>, element: Ref<HTMLElement | null>, close: () => void) => {
  const token = Symbol('dialog')
  let restore: (() => void) | undefined
  const cleanup = () => { restore?.(); restore = undefined }
  watch(open, async visible => {
    cleanup()
    if (!visible || typeof document === 'undefined') return
    const previous = document.activeElement as HTMLElement | null
    await nextTick()
    if (!open.value || !element.value) return
    const dialog = element.value
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    stack.push(token)
    const siblings = [...document.body.children].filter(node => !node.contains(dialog)) as HTMLElement[]
    const inert = siblings.map(node => node.inert)
    siblings.forEach(node => { node.inert = true })
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')].filter(node => node.getClientRects().length && !node.closest('[inert]'))
    const onKey = (event: KeyboardEvent) => {
      if (stack.at(-1) !== token) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close() }
      if (event.key === 'Tab') {
        const nodes = focusable()
        const first = nodes[0] ?? dialog
        const last = nodes.at(-1) ?? dialog
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey, true)
    dialog.tabIndex = -1
    ;(focusable()[0] ?? dialog).focus()
    restore = () => {
      document.removeEventListener('keydown', onKey, true)
      const index = stack.indexOf(token)
      if (index >= 0) stack.splice(index, 1)
      siblings.forEach((node, i) => { node.inert = inert[i]! })
      document.body.style.overflow = overflow
      if (previous?.isConnected) previous.focus()
    }
  }, { immediate: true, flush: 'post' })
  onScopeDispose(cleanup)
}

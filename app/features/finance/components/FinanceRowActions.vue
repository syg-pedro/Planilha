<template>
  <div class="row-actions" @click.stop>
    <button type="button" class="row-trigger" :popovertarget="menuId" :aria-label="`Opções de ${label}`" title="Opções do mês">⋮</button>
    <div :id="menuId" popover class="row-actions-menu">
      <strong>{{ label }}</strong>
      <button type="button" @click="choose('view', $event)">Ver / editar lançamentos</button>
      <button type="button" @click="choose('hide', $event)">Ocultar esta linha</button>
      <button type="button" @click="choose('hidePrevious', $event)">Ocultar meses anteriores</button>
      <button type="button" @click="choose('clear', $event)">Apagar valores do mês…</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
const menuId = useId()
defineProps<{ label: string }>()
const emit = defineEmits<{ action: [action: 'view' | 'hide' | 'hidePrevious' | 'clear'] }>()
function choose(action: 'view' | 'hide' | 'hidePrevious' | 'clear', event: MouseEvent) {
  if (event.currentTarget instanceof HTMLElement) event.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover()
  emit('action', action)
}
</script>

<style scoped>
.row-actions { position: relative; }
.row-trigger { cursor: pointer; padding: 4px 10px; border-radius: 4px; border: 0; color: inherit; background: transparent; font: inherit; }
.row-actions-menu { position: fixed; inset: 0; margin: auto; width: min(280px, 90vw); padding: 12px; background: var(--ds-color-surface-card); color: var(--text); border: 1px solid var(--ds-color-border-default); border-radius: 8px; box-shadow: var(--shadow-md); }
.row-actions-menu:popover-open { display: grid; gap: 4px; }
.row-actions-menu::backdrop { background: var(--overlay); }
.row-actions-menu button { padding: 10px; background: transparent; border: 0; font: inherit; text-align: left; color: inherit; cursor: pointer; white-space: normal; }
.row-actions-menu button:hover { background: var(--ds-color-surface-card-soft); }
</style>

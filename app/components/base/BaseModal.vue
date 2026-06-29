<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="base-modal__backdrop"
      @click.self="$emit('close')"
    >
      <div
        class="base-modal"
        :style="{ maxWidth: `${maxWidth}px` }"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="base-modal__header">
          <div>
            <h2 class="base-modal__title">{{ title }}</h2>
            <p v-if="subtitle" class="base-modal__subtitle">{{ subtitle }}</p>
          </div>
          <button
            class="base-modal__close"
            type="button"
            aria-label="Fechar"
            @click="$emit('close')"
          >
            <BaseIcon name="close" :size="18" />
          </button>
        </div>
        <div class="base-modal__body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import BaseIcon from '../../design-system/components/BaseIcon.vue'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  subtitle?: string
  maxWidth?: number
}>(), {
  subtitle: '',
  maxWidth: 580,
})

defineEmits<{ close: [] }>()

watch(() => props.open, (val) => {
  if (process.client) document.body.style.overflow = val ? 'hidden' : ''
}, { immediate: true })
</script>

<style scoped>
.base-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgb(0 0 0 / 0.64);
}

.base-modal {
  width: 100%;
  max-height: 92dvh;
  overflow-y: auto;
  background: var(--surface);
  border: var(--border-width-strong) solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
}

.base-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px 14px;
  background: var(--surface2);
  border-bottom: var(--border-width) solid var(--border);
}

.base-modal__title {
  color: var(--text);
  font-size: 18px;
  font-weight: 800;
}

.base-modal__subtitle {
  margin-top: 3px;
  color: var(--text3);
  font-size: 12px;
  font-weight: 600;
}

.base-modal__close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
  padding: 4px;
  color: var(--text);
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 2px 2px 0 var(--ds-shadow-color);
  cursor: pointer;
}

.base-modal__close:active {
  box-shadow: none;
  transform: translate(2px, 2px);
}

.base-modal__body {
  padding: 20px 22px;
}
</style>

<template>
  <div class="base-empty">
    <div class="base-empty__icon">
      <BaseIcon :name="icon" :size="24" color="var(--text3)" />
    </div>
    <div>
      <p class="base-empty__title">{{ title }}</p>
      <p v-if="body" class="base-empty__body">{{ body }}</p>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import BaseIcon from '../../design-system/components/BaseIcon.vue'

withDefaults(defineProps<{
  icon?: string
  title: string
  body?: string
}>(), {
  icon: 'info',
  body: '',
})
</script>

<style scoped>
.base-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  text-align: center;
}

.base-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  background: var(--surface2);
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 4px 4px 0 var(--ds-shadow-color);
  transform: rotate(-3deg);
}

.base-empty__title {
  margin-bottom: 4px;
  color: var(--text);
  font-size: 15px;
  font-weight: 800;
}

.base-empty__body {
  max-width: 280px;
  margin: 0 auto;
  color: var(--text3);
  font-size: 13px;
  font-weight: 600;
}
</style>

<template>
  <section class="ds-panel base-panel" :class="{ 'base-panel--dense': dense }">
    <header v-if="$slots.header || title" class="base-panel__header">
      <div class="base-panel__heading">
        <h3 v-if="title" class="base-panel__title">{{ title }}</h3>
        <p v-if="subtitle" class="base-panel__subtitle">{{ subtitle }}</p>
      </div>
      <slot name="header" />
    </header>

    <slot />
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    dense?: boolean
  }>(),
  {
    title: '',
    subtitle: '',
    dense: false
  }
)

</script>

<style scoped>
.base-panel--dense {
  padding: 12px;
}

.base-panel__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--border);
}

.base-panel__heading {
  margin-right: auto;
}

.base-panel__title {
  color: var(--text);
  font-size: 15px;
  font-weight: 800;
}

.base-panel__subtitle {
  margin-top: 4px;
  color: var(--text3);
  font-size: 12px;
  font-weight: 600;
}
</style>

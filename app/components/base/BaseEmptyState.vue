<template>
  <UEmpty :title="title" :description="body || undefined">
    <template #leading><BaseIcon :name="icon" :size="28" /></template>
    <template v-if="$slots.default" #body><slot /></template>
  </UEmpty>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ icon?: string; title: string; body?: string }>(), {
  icon: 'info',
  body: '',
})
</script>

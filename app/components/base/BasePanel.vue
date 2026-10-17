<template>
  <UCard
    as="section"
    class="base-panel"
    :ui="{ body: dense ? 'p-3 sm:p-3' : 'p-4 sm:p-4', header: 'p-3 sm:p-3' }"
  >
    <template v-if="$slots.header || title" #header
      ><div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 v-if="title" class="text-sm font-semibold text-highlighted">
            {{ title }}
          </h3>
          <p v-if="subtitle" class="mt-1 text-xs text-muted">{{ subtitle }}</p>
        </div>
        <slot name="header" /></div
    ></template>
    <slot />
  </UCard>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{ title?: string; subtitle?: string; dense?: boolean }>(),
  { title: '', subtitle: '', dense: false },
)
</script>

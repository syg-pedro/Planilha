<template>
  <section class="ds-panel" :class="contentClass">
    <header v-if="$slots.header || title" class="mb-3 flex items-start gap-3">
      <div class="mr-auto">
        <h3 v-if="title" class="text-sm font-semibold">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-xs ds-text-muted">{{ subtitle }}</p>
      </div>
      <slot name="header" />
    </header>

    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
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

const contentClass = computed(() => (props.dense ? 'p-3' : ''))
</script>

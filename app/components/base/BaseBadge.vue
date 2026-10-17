<template>
  <UBadge :color="tone"><slot /></UBadge>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'success' | 'warning' | 'neutral' }>(), {
  tone: 'neutral',
})
</script>

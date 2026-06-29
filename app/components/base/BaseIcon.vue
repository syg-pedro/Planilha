<template>
  <DsIcon :name="name" :size="size" :color="color" />
</template>

<script setup lang="ts">
import DsIcon from '../../design-system/components/BaseIcon.vue'

withDefaults(defineProps<{
  name: string
  size?: number
  color?: string
}>(), {
  size: 16,
  color: 'currentColor',
})
</script>

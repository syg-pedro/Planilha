<template>
  <FinanceSettingsPanel @navigate="$emit('navigate', $event)" />
</template>

<script setup lang="ts">
import FinanceSettingsPanel from '~/features/finance/components/FinanceSettingsPanel.vue'

defineEmits<{ navigate: [screen: string] }>()
</script>

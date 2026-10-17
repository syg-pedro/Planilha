<template><FinanceScreenHost /></template>

<script setup lang="ts">
import FinanceScreenHost from '~/features/finance/components/navigation/FinanceScreenHost.vue'
import { financeScreenForPath } from '~/features/finance/constants/ui'

definePageMeta({
  key: 'finance-workspace',
  validate: route => Boolean(financeScreenForPath(route.path)),
})
</script>

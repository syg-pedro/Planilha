<template>
  <div class="matrix-shell"><FinanceAnnualMatrix /></div>
</template>

<script setup lang="ts">
import FinanceAnnualMatrix from '~/features/finance/components/FinanceAnnualMatrix.vue'
</script>

<style scoped>
.matrix-shell { min-width: 0; }
</style>

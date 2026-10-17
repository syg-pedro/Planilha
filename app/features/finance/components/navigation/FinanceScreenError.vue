<template>
  <UAlert title="Não foi possível abrir esta tela" description="Confira sua conexão e tente carregar a página novamente." icon="i-lucide-wifi-off" color="error" variant="soft" role="alert">
    <template #actions><UButton label="Tentar novamente" color="error" variant="soft" @click="reload" /></template>
  </UAlert>
</template>

<script setup lang="ts">
const reload = () => window.location.reload()
</script>

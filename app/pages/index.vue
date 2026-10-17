<template><div /></template>

<script setup lang="ts">
definePageMeta({
  middleware: to => navigateTo({ path: '/planilha', query: to.query }, { replace: true }),
})
</script>

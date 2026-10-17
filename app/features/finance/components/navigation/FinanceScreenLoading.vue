<template>
  <div class="space-y-4 p-3" role="status" aria-live="polite" aria-busy="true">
    <span class="text-sm text-muted">Abrindo tela…</span>
    <div class="grid grid-cols-3 gap-3" aria-hidden="true"><USkeleton v-for="item in 3" :key="item" class="h-16" /></div>
    <div class="space-y-3" aria-hidden="true"><USkeleton v-for="row in 5" :key="row" class="h-8" /></div>
  </div>
</template>

<template>
  <UContainer as="main" class="grid min-h-dvh place-items-center py-8">
    <UCard class="w-full max-w-sm" :ui="{ header: 'p-5', body: 'p-5 sm:p-6' }">
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-table-2" class="size-7 text-primary" />
          <span class="text-lg font-semibold text-highlighted">Planilha</span>
        </div>
      </template>
      <slot />
    </UCard>
  </UContainer>
</template>

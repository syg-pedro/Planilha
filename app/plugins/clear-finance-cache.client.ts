export default defineNuxtPlugin(async () => {
  // Remove the legacy unpartitioned API cache after updating an existing PWA.
  if ('caches' in window) await caches.delete('api-cache').catch(() => false)
})

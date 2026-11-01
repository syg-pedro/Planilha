<template>
  <main class="error-page">
    <p class="error-page__code">{{ error?.statusCode ?? 'Erro' }}</p>
    <h1>{{ notFound ? 'Página não encontrada' : 'Algo deu errado' }}</h1>
    <p>
      {{ notFound
        ? 'O endereço não existe ou mudou. Seus lançamentos continuam salvos.'
        : 'Não foi possível abrir esta tela. Tente de novo; seus lançamentos continuam salvos.' }}
    </p>
    <BaseButton @click="goHome">Voltar para a Planilha</BaseButton>
  </main>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError | null }>()
const notFound = computed(() => props.error?.statusCode === 404)
useHead({ title: () => (notFound.value ? 'Página não encontrada · Planilha' : 'Erro · Planilha') })

// Mantém a chave de edição da URL ao voltar.
const goHome = () => {
  const key = useRoute().query.key
  clearError({ redirect: typeof key === 'string' ? `/planilha?key=${encodeURIComponent(key)}` : '/planilha' })
}
</script>

<style scoped>
.error-page {
  display: grid;
  place-content: center;
  justify-items: start;
  gap: var(--ds-space-4);
  min-height: 100dvh;
  max-width: 34rem;
  margin: 0 auto;
  padding: var(--ds-space-9) var(--ds-space-6);
  color: var(--text);
  background: var(--bg);
}
.error-page h1 { margin: 0; font-size: 1.5rem; text-wrap: balance; }
.error-page p { margin: 0; color: var(--text2); }
.error-page__code { font-size: 0.875rem; font-weight: 600; color: var(--text3) !important; font-variant-numeric: tabular-nums; }
</style>

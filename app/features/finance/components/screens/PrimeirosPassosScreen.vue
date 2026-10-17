<template>
  <section class="mx-auto grid max-w-5xl gap-4" aria-labelledby="onboarding-title">
    <UCard>
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-2xl space-y-2">
          <UBadge label="Seu espaço financeiro" variant="subtle" />
          <h2 id="onboarding-title" class="text-2xl font-semibold text-highlighted">Seu primeiro lançamento.</h2>
          <p class="text-sm text-muted">Registre uma receita ou despesa e acompanhe o mês na Planilha. Você pode organizar as contas e trazer outros dados depois.</p>
        </div>
        <UButton label="Fazer depois" color="neutral" variant="ghost" @click="dismiss" />
      </div>
    </UCard>
    <UAlert v-if="importSuccess" title="Dados importados com sucesso." :description="successDescription" icon="i-lucide-circle-check" color="success" variant="soft" role="status">
      <template #actions><UButton label="Abrir minha Planilha" @click="finish" /></template>
    </UAlert>
    <template v-else>
      <UStepper :items="onboardingSteps" :model-value="progressStep" :linear="false" disabled size="sm" aria-label="Etapas da introdução" />
      <div class="grid gap-4 md:grid-cols-2">
        <UCard variant="subtle">
          <template #header><div class="space-y-2"><UBadge label="Recomendado" size="sm" /><h3 class="flex items-center gap-2 font-semibold text-highlighted"><UIcon name="i-lucide-plus" class="size-5 text-primary" />Começar pela Planilha</h3></div></template>
          <p class="text-sm text-muted">Informe o nome, o valor e o vencimento. O primeiro lançamento já aparece no seu mês.</p>
          <template #footer>
            <div class="flex flex-wrap gap-2"><UButton label="Criar primeiro lançamento" icon="i-lucide-plus" @click="startManual" /><UButton label="Cadastrar conta" icon="i-lucide-wallet-cards" color="neutral" variant="outline" @click="createAccount" /></div>
            <p class="mt-3 text-xs text-muted">Conta e categoria podem ser escolhidas depois. Não é preciso configurar tudo para começar.</p>
          </template>
        </UCard>
        <UCard>
          <template #header><h3 class="flex items-center gap-2 font-semibold text-highlighted"><UIcon name="i-lucide-file-spreadsheet" class="size-5 text-muted" />Trazer pelo Excel</h3></template>
          <p class="text-sm text-muted">Baixe o modelo, preencha suas contas e lançamentos e envie o arquivo. Revise tudo antes de confirmar.</p>
          <input ref="fileInput" class="sr-only" type="file" tabindex="-1" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" @change="readWorkbook" />
          <template #footer>
            <div class="flex flex-wrap gap-2"><UButton label="Baixar modelo" icon="i-lucide-download" :loading="downloading" color="neutral" variant="outline" @click="downloadTemplate" /><UButton label="Enviar preenchido" icon="i-lucide-upload" :disabled="hasFinancialData" color="neutral" variant="outline" @click="openFilePicker" /></div>
            <p v-if="hasFinancialData" class="mt-3 text-xs text-muted">A importação inicial fica disponível apenas antes de inserir dados, para evitar duplicações.</p>
          </template>
        </UCard>
      </div>
      <UCard v-if="parsing || errors.length || preview" aria-live="polite">
        <template #header><h3 class="font-semibold text-highlighted">{{ parsing ? 'Lendo sua planilha...' : 'Revise antes de importar' }}</h3></template>
        <UProgress v-if="parsing" aria-label="Conferindo abas, datas e valores" />
        <div v-else-if="errors.length" class="space-y-2"><UAlert v-for="error in errors" :key="error" :description="error" color="error" variant="soft" icon="i-lucide-triangle-alert" /></div>
        <template v-else-if="preview">
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <UCard v-for="item in [{ value: preview.accounts, label: 'contas' }, { value: preview.categories, label: 'categorias' }, { value: preview.rules, label: 'fixos mensais' }, { value: preview.generatedEntries + preview.entries, label: 'lançamentos' }]" :key="item.label" variant="soft" class="text-center"><strong class="block text-xl text-highlighted">{{ item.value }}</strong><span class="text-xs text-muted">{{ item.label }}</span></UCard>
          </div>
          <div v-if="preview.warnings.length" class="mt-3 space-y-2"><UAlert v-for="warning in preview.warnings" :key="warning" :description="warning" color="warning" variant="soft" icon="i-lucide-triangle-alert" /></div>
          <p class="my-4 text-sm text-muted">Os dados só serão gravados quando você confirmar. A importação acontece de uma vez, sem registros parciais.</p>
          <UButton label="Confirmar importação" icon="i-lucide-check" :disabled="!preview.canImport || !importPayload" :loading="importing" @click="confirmImport" />
        </template>
      </UCard>
      <UCard>
        <template #header><h3 class="font-semibold text-highlighted">Entenda o essencial sem se perder no menu.</h3></template>
        <div class="flex flex-wrap gap-2"><UButton label="Conheça o básico" icon="i-lucide-grid-2x2" color="neutral" variant="outline" @click="startTour" /><UButton label="Central de Ajuda" icon="i-lucide-book-open" color="neutral" variant="outline" @click="openHelp" /></div>
      </UCard>
    </template>
    <BaseModal :open="tourOpen" title="Conheça a Planilha" subtitle="Um roteiro rápido pelos pontos que você mais vai usar." @close="closeTour">
      <div class="space-y-4">
        <p class="text-xs font-medium text-muted">PASSO {{ tourStep + 1 }} DE {{ TOUR_STEPS.length }}</p>
        <UProgress :model-value="tourStep + 1" :max="TOUR_STEPS.length" aria-label="Progresso do tutorial" />
        <UIcon :name="TOUR_STEPS[tourStep]?.icon ?? 'i-lucide-circle-help'" class="size-8 text-primary" />
        <h3 class="text-lg font-semibold text-highlighted">{{ TOUR_STEPS[tourStep]?.title }}</h3>
        <p class="text-sm text-muted">{{ TOUR_STEPS[tourStep]?.body }}</p>
      </div>
      <template #footer><div class="flex justify-end gap-2"><UButton v-if="tourStep > 0" label="Voltar" color="neutral" variant="ghost" @click="tourStep -= 1" /><UButton :label="tourStep === TOUR_STEPS.length - 1 ? 'Concluir' : 'Próximo'" @click="nextTour" /></div></template>
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseModal from '~/components/base/BaseModal.vue'
import { createDefaultOnboardingState } from '#shared/onboarding'
import type { OnboardingImportPayload, OnboardingImportPreview } from '#shared/types'
import { downloadOnboardingWorkbook, parseOnboardingWorkbook } from '~/features/finance/utils/onboardingWorkbook'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { useFinanceNavigation } from '~/features/finance/composables/useFinanceNavigation'

const emit = defineEmits<{ navigate: [screen: string] }>()
const store = useFinanceStore()
const { goTo } = useFinanceNavigation()
const fileInput = ref<HTMLInputElement | null>(null)
const downloading = ref(false)
const parsing = ref(false)
const importing = ref(false)
const errors = ref<string[]>([])
const importPayload = ref<OnboardingImportPayload | null>(null)
const preview = ref<OnboardingImportPreview | null>(null)
const importSuccess = ref<OnboardingImportPreview | null>(null)
const tourOpen = ref(false)
const tourStep = ref(0)
const tutorialSeen = ref(false)

const TOUR_STEPS = [
  { icon: 'i-lucide-grid-2x2', title: 'Planilha: seu ponto de partida', body: 'Crie um lançamento para registrar uma receita ou despesa. Use a busca e os filtros para encontrar o que precisa.' },
  { icon: 'i-lucide-circle-check', title: 'Confirme seus pagamentos', body: 'Abra um lançamento para editar os detalhes ou marcar como pago. Receitas podem ser marcadas como recebidas.' },
  { icon: 'i-lucide-layout-dashboard', title: 'Resumo: acompanhe o período', body: 'Veja receitas, despesas e próximos vencimentos. Os alertas ajudam a localizar pendências e abrir os lançamentos.' },
]

const hasAccounts = computed(() => store.accounts.length > 0)
const hasEntries = computed(() => store.entries.length > 0 || store.rules.length > 0)
const progressStep = computed(() => !hasEntries.value ? 0 : !hasAccounts.value ? 1 : 2)
const onboardingSteps = [{ title: 'Primeiro lançamento', value: 0, icon: 'i-lucide-plus' }, { title: 'Suas contas', description: 'Opcional', value: 1, icon: 'i-lucide-wallet-cards' }, { title: 'Conhecer', value: 2, icon: 'i-lucide-circle-help' }]
const hasFinancialData = computed(() => hasAccounts.value || store.categories.length > 0 || hasEntries.value)
const successDescription = computed(() => {
  if (!importSuccess.value) return ''
  const count = importSuccess.value.generatedEntries + importSuccess.value.entries
  return `${importSuccess.value.accounts} conta(s), ${importSuccess.value.categories} categoria(s) e ${count} lançamento(s) foram preparados.`
})

const saveState = async (status: 'active' | 'dismissed' | 'completed', completedSteps: string[] = []) => {
  const current = store.settings.onboarding ?? createDefaultOnboardingState()
  await store.saveOnboarding({
    ...current,
    status,
    completedSteps: [...new Set([...current.completedSteps, ...completedSteps])],
    updatedAt: new Date().toISOString(),
  })
}

const dismiss = async () => {
  await saveState('dismissed')
  emit('navigate', 'planilha')
}

const finish = async () => {
  await saveState('completed', ['tutorial'])
  emit('navigate', 'planilha')
}

const startManual = async () => {
  await saveState('active', ['manual-start'])
  await goTo('planilha', { new: '1' })
}

const createAccount = async () => {
  await saveState('active', ['manual-start'])
  await goTo('cartoes', { new: '1' })
}

const openHelp = () => emit('navigate', 'help')

const startTour = () => {
  tourStep.value = 0
  tourOpen.value = true
}

const closeTour = () => { tourOpen.value = false }

const nextTour = async () => {
  if (tourStep.value < TOUR_STEPS.length - 1) {
    tourStep.value += 1
    return
  }
  tutorialSeen.value = true
  tourOpen.value = false
  await saveState(store.settings.onboarding.status === 'dismissed' ? 'dismissed' : 'active', ['tutorial'])
}

const downloadTemplate = async () => {
  downloading.value = true
  errors.value = []
  try {
    await downloadOnboardingWorkbook()
  } catch (error) {
    errors.value = [error instanceof Error ? error.message : 'Não foi possível criar o modelo agora.']
  } finally {
    downloading.value = false
  }
}

const openFilePicker = () => fileInput.value?.click()

const readWorkbook = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  parsing.value = true
  errors.value = []
  preview.value = null
  importPayload.value = null
  try {
    const parsed = await parseOnboardingWorkbook(file)
    if (!parsed.payload) {
      errors.value = parsed.errors
      return
    }
    const nextPreview = await store.previewOnboardingImport(parsed.payload)
    importPayload.value = parsed.payload
    preview.value = nextPreview
  } catch (error) {
    errors.value = [error instanceof Error ? error.message : 'Não foi possível ler esta planilha.']
  } finally {
    parsing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const confirmImport = async () => {
  if (!importPayload.value || !preview.value?.canImport) return
  importing.value = true
  errors.value = []
  try {
    importSuccess.value = await store.importOnboardingWorkbook(importPayload.value)
  } catch (error) {
    errors.value = [error instanceof Error ? error.message : 'A importação não foi concluída.']
  } finally {
    importing.value = false
  }
}
</script>

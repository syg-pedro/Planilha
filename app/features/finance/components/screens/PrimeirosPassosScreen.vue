<template>
  <section class="onboarding" aria-labelledby="onboarding-title">
    <header class="onboarding__hero">
      <div class="onboarding__hero-mark" aria-hidden="true"><BaseIcon name="sparkle" :size="29" /></div>
      <div>
        <p class="onboarding__eyebrow">SEU ESPAÇO FINANCEIRO</p>
        <h2 id="onboarding-title">Comece pelo que importa.</h2>
        <p>Traga seus dados ou cadastre o essencial. Em poucos minutos, a Planilha, os alertas e o dashboard estarão prontos para ajudar.</p>
      </div>
      <button class="onboarding__dismiss" type="button" @click="dismiss">Fazer depois</button>
    </header>

    <div v-if="importSuccess" class="onboarding__success" role="status">
      <BaseIcon name="check" :size="22" />
      <div>
        <strong>Dados importados com sucesso.</strong>
        <p>{{ successDescription }}</p>
      </div>
      <BaseButton variant="primary" size="sm" @click="finish">Ver meu dashboard</BaseButton>
    </div>

    <template v-else>
      <ol class="onboarding__trail" aria-label="Etapas da introdução">
        <li :class="{ 'onboarding__trail-item--done': hasAccounts }"><span>1</span>Contas</li>
        <li :class="{ 'onboarding__trail-item--done': hasEntries }"><span>2</span>Dados</li>
        <li :class="{ 'onboarding__trail-item--done': tutorialSeen }"><span>3</span>Conhecer</li>
      </ol>

      <div class="onboarding__choices">
        <article class="onboarding__choice onboarding__choice--featured">
          <div class="onboarding__choice-icon"><BaseIcon name="export" :size="22" /></div>
          <div>
            <p class="onboarding__choice-kicker">RECOMENDADO</p>
            <h3>Preencher uma vez no Excel</h3>
            <p>Baixe o modelo, preencha suas contas, gastos fixos e lançamentos. Depois envie o mesmo arquivo.</p>
          </div>
          <div class="onboarding__choice-actions">
            <BaseButton :loading="downloading" variant="primary" @click="downloadTemplate">
              <BaseIcon name="export" :size="15" /> Baixar modelo
            </BaseButton>
            <BaseButton :disabled="hasFinancialData" variant="secondary" @click="openFilePicker">
              <BaseIcon name="plus" :size="15" /> Enviar preenchido
            </BaseButton>
          </div>
          <p v-if="hasFinancialData" class="onboarding__choice-note">A importação inicial fica disponível apenas antes de inserir dados, para evitar duplicações.</p>
          <input ref="fileInput" class="onboarding__file-input" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" @change="readWorkbook" />
        </article>

        <article class="onboarding__choice">
          <div class="onboarding__choice-icon onboarding__choice-icon--quiet"><BaseIcon name="edit" :size="21" /></div>
          <div>
            <p class="onboarding__choice-kicker">PASSO A PASSO</p>
            <h3>Começar pelo app</h3>
            <p>Cadastre primeiro seus cartões e contas. Em seguida, lance as despesas e receitas na Planilha.</p>
          </div>
          <div class="onboarding__choice-actions">
            <BaseButton variant="secondary" @click="startManual">
              <BaseIcon name="card" :size="15" /> Cadastrar contas
            </BaseButton>
            <BaseButton variant="ghost" @click="startTour">
              <BaseIcon name="help" :size="15" /> Ver tutorial
            </BaseButton>
          </div>
        </article>
      </div>

      <section v-if="parsing || errors.length || preview" class="onboarding__import" aria-live="polite">
        <div class="onboarding__import-heading">
          <div class="onboarding__choice-icon"><BaseIcon name="grid" :size="20" /></div>
          <div>
            <p class="onboarding__choice-kicker">CONFERÊNCIA</p>
            <h3>{{ parsing ? 'Lendo sua planilha...' : 'Revise antes de importar' }}</h3>
          </div>
        </div>

        <div v-if="parsing" class="onboarding__loading"><span /> Conferindo abas, datas e valores.</div>

        <ul v-else-if="errors.length" class="onboarding__errors">
          <li v-for="error in errors" :key="error"><BaseIcon name="warning" :size="14" />{{ error }}</li>
        </ul>

        <template v-else-if="preview">
          <div class="onboarding__summary">
            <div><strong>{{ preview.accounts }}</strong><span>contas</span></div>
            <div><strong>{{ preview.categories }}</strong><span>categorias</span></div>
            <div><strong>{{ preview.rules }}</strong><span>fixos mensais</span></div>
            <div><strong>{{ preview.generatedEntries + preview.entries }}</strong><span>lançamentos</span></div>
          </div>
          <ul v-if="preview.warnings.length" class="onboarding__warnings">
            <li v-for="warning in preview.warnings" :key="warning"><BaseIcon name="warning" :size="14" />{{ warning }}</li>
          </ul>
          <p class="onboarding__import-copy">Os dados só serão gravados quando você confirmar. A importação acontece de uma vez, sem registros parciais.</p>
          <BaseButton :disabled="!preview.canImport || !importPayload" :loading="importing" variant="primary" @click="confirmImport">
            <BaseIcon name="check" :size="15" /> Confirmar importação
          </BaseButton>
        </template>
      </section>

      <section class="onboarding__learn">
        <div>
          <p class="onboarding__eyebrow">TUTORIAIS GUIADOS</p>
          <h3>Entenda o essencial sem se perder no menu.</h3>
        </div>
        <div class="onboarding__learn-grid">
          <button type="button" @click="startTour">
            <BaseIcon name="dashboard" :size="19" />
            <span><strong>Conheça o básico</strong><small>Dashboard, Planilha e Alertas</small></span>
            <BaseIcon name="chevron_right" :size="17" />
          </button>
          <button type="button" @click="openHelp">
            <BaseIcon name="book" :size="19" />
            <span><strong>Central de Ajuda</strong><small>Guias detalhados por tela</small></span>
            <BaseIcon name="chevron_right" :size="17" />
          </button>
        </div>
      </section>
    </template>

    <BaseModal :open="tourOpen" title="Conheça o Financeiro Familiar" subtitle="Um roteiro rápido pelos pontos que você mais vai usar." @close="closeTour">
      <div class="onboarding__tour">
        <p class="onboarding__tour-count">PASSO {{ tourStep + 1 }} DE {{ TOUR_STEPS.length }}</p>
        <div class="onboarding__tour-icon"><BaseIcon :name="TOUR_STEPS[tourStep]?.icon ?? 'help'" :size="28" /></div>
        <h3>{{ TOUR_STEPS[tourStep]?.title }}</h3>
        <p>{{ TOUR_STEPS[tourStep]?.body }}</p>
        <div class="onboarding__tour-dots" aria-hidden="true"><span v-for="(_, index) in TOUR_STEPS" :key="index" :class="{ active: index === tourStep }" /></div>
        <div class="onboarding__tour-actions">
          <BaseButton v-if="tourStep > 0" variant="ghost" @click="tourStep -= 1">Voltar</BaseButton>
          <BaseButton variant="primary" @click="nextTour">{{ tourStep === TOUR_STEPS.length - 1 ? 'Concluir' : 'Próximo' }}</BaseButton>
        </div>
      </div>
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '~/components/base/BaseButton.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'
import BaseModal from '~/components/base/BaseModal.vue'
import { createDefaultOnboardingState } from '#shared/onboarding'
import type { OnboardingImportPayload, OnboardingImportPreview } from '#shared/types'
import { downloadOnboardingWorkbook, parseOnboardingWorkbook } from '~/features/finance/utils/onboardingWorkbook'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'

const emit = defineEmits<{ navigate: [screen: string] }>()
const store = useFinanceStore()
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
  { icon: 'dashboard', title: 'Dashboard: seu resumo do mês', body: 'Depois de inserir seus dados, comece aqui para ver receitas, despesas, saldo e os próximos vencimentos.' },
  { icon: 'grid', title: 'Planilha: onde os lançamentos vivem', body: 'Use a Matriz para acompanhar os meses em uma visão ampla ou a Lista para cadastrar e editar cada movimentação.' },
  { icon: 'alerts', title: 'Alertas: acompanhe o que pede atenção', body: 'O aplicativo avisa quando uma despesa está próxima do vencimento ou quando o limite do cartão merece cuidado.' },
]

const hasAccounts = computed(() => store.accounts.length > 0)
const hasEntries = computed(() => store.entries.length > 0 || store.rules.length > 0)
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
  emit('navigate', 'dashboard')
}

const finish = async () => {
  await saveState('completed', ['tutorial'])
  emit('navigate', 'dashboard')
}

const startManual = async () => {
  await saveState('active', ['manual-start'])
  emit('navigate', 'cartoes')
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

<style scoped>
.onboarding { max-width: 980px; margin: 0 auto; display: grid; gap: 18px; }
.onboarding__hero { position: relative; overflow: hidden; display: grid; grid-template-columns: auto 1fr auto; gap: 18px; align-items: start; padding: 24px; border: 3px solid var(--border); background: var(--surface); box-shadow: 7px 7px 0 var(--ds-shadow-color); }
.onboarding__hero::after { content: ''; position: absolute; right: -45px; bottom: -76px; width: 190px; height: 190px; border: 3px solid var(--border); background: var(--primary-dim); transform: rotate(16deg); }
.onboarding__hero > * { position: relative; z-index: 1; }
.onboarding__hero-mark, .onboarding__choice-icon, .onboarding__tour-icon { display: grid; place-items: center; flex: 0 0 auto; width: 46px; height: 46px; border: 2px solid var(--border); background: var(--primary); color: var(--bg); box-shadow: 3px 3px 0 var(--ds-shadow-color); }
.onboarding__eyebrow, .onboarding__choice-kicker, .onboarding__tour-count { margin: 0 0 5px; color: var(--primary); font-size: 10px; font-weight: 900; letter-spacing: .13em; }
.onboarding__hero h2 { margin: 0; color: var(--text); font-size: clamp(24px, 4vw, 34px); font-weight: 900; line-height: 1; }
.onboarding__hero p:not(.onboarding__eyebrow) { max-width: 630px; margin: 9px 0 0; color: var(--text2); font-size: 14px; line-height: 1.5; }
.onboarding__dismiss { border: 0; background: transparent; color: var(--text3); font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; text-decoration: underline; }
.onboarding__trail { display: flex; gap: 10px; margin: 0; padding: 0; list-style: none; overflow-x: auto; }
.onboarding__trail-item { display: inline-flex; align-items: center; gap: 7px; min-width: max-content; color: var(--text3); font-size: 12px; font-weight: 800; }
.onboarding__trail-item span { display: grid; place-items: center; width: 24px; height: 24px; border: 2px solid var(--border); background: var(--surface2); color: var(--text2); font-size: 11px; }
.onboarding__trail-item--done { color: var(--success); }
.onboarding__trail-item--done span { background: var(--success); color: var(--bg); }
.onboarding__choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.onboarding__choice { display: grid; grid-template-columns: auto 1fr; gap: 15px; padding: 20px; border: 2px solid var(--border); background: var(--surface); box-shadow: 4px 4px 0 var(--ds-shadow-color); }
.onboarding__choice--featured { border-width: 3px; background: var(--primary-dim); }
.onboarding__choice-icon--quiet { background: var(--surface2); color: var(--primary); }
.onboarding__choice h3, .onboarding__import h3, .onboarding__learn h3, .onboarding__tour h3 { margin: 0; color: var(--text); font-size: 17px; font-weight: 900; }
.onboarding__choice p:not(.onboarding__choice-kicker) { margin: 7px 0 0; color: var(--text2); font-size: 13px; line-height: 1.45; }
.onboarding__choice-actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 9px; }
.onboarding__choice-note { grid-column: 1 / -1; margin: 0 !important; color: var(--text3) !important; font-size: 11px !important; }
.onboarding__file-input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.onboarding__import, .onboarding__learn, .onboarding__success { border: 2px solid var(--border); background: var(--surface); box-shadow: 4px 4px 0 var(--ds-shadow-color); padding: 20px; }
.onboarding__import-heading, .onboarding__success { display: flex; align-items: center; gap: 12px; }
.onboarding__loading { display: flex; align-items: center; gap: 9px; padding-top: 16px; color: var(--text2); font-size: 13px; font-weight: 700; }
.onboarding__loading span { width: 15px; height: 15px; border: 2px solid var(--primary); border-right-color: transparent; border-radius: 50%; animation: onboarding-spin .7s linear infinite; }
.onboarding__summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 18px 0 12px; }
.onboarding__summary div { min-width: 0; padding: 12px 8px; border: 1px solid var(--border); background: var(--surface2); text-align: center; }
.onboarding__summary strong { display: block; color: var(--primary); font-size: 21px; font-weight: 900; }
.onboarding__summary span { display: block; margin-top: 2px; color: var(--text3); font-size: 10px; font-weight: 800; }
.onboarding__errors, .onboarding__warnings { display: grid; gap: 7px; margin: 16px 0; padding: 12px; list-style: none; border: 1px solid var(--danger); background: var(--danger-light); color: var(--danger); font-size: 12px; font-weight: 700; }
.onboarding__warnings { border-color: var(--warning); background: var(--warning-light); color: var(--warning); }
.onboarding__errors li, .onboarding__warnings li { display: flex; align-items: flex-start; gap: 7px; line-height: 1.35; }
.onboarding__import-copy { margin: 0 0 14px; color: var(--text3); font-size: 12px; line-height: 1.45; }
.onboarding__learn { display: grid; grid-template-columns: .9fr 1.1fr; gap: 18px; align-items: center; background: var(--surface2); }
.onboarding__learn-grid { display: grid; gap: 8px; }
.onboarding__learn-grid button { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; width: 100%; padding: 11px; border: 2px solid var(--border); background: var(--surface); color: var(--text); font: inherit; text-align: left; box-shadow: 2px 2px 0 var(--ds-shadow-color); cursor: pointer; }
.onboarding__learn-grid button:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--ds-shadow-color); }
.onboarding__learn-grid span { display: grid; gap: 2px; }
.onboarding__learn-grid strong { font-size: 13px; }
.onboarding__learn-grid small { color: var(--text3); font-size: 11px; }
.onboarding__success { justify-content: space-between; border-width: 3px; background: var(--success-light); color: var(--success); }
.onboarding__success strong { display: block; color: var(--text); font-size: 15px; }
.onboarding__success p { margin: 3px 0 0; color: var(--text2); font-size: 12px; }
.onboarding__tour { display: grid; justify-items: start; gap: 12px; }
.onboarding__tour-icon { width: 56px; height: 56px; }
.onboarding__tour > p:not(.onboarding__tour-count) { margin: 0; color: var(--text2); font-size: 14px; line-height: 1.5; }
.onboarding__tour-dots { display: flex; gap: 6px; }
.onboarding__tour-dots span { width: 9px; height: 9px; border: 1px solid var(--border); background: var(--surface2); }
.onboarding__tour-dots .active { width: 24px; background: var(--primary); }
.onboarding__tour-actions { display: flex; justify-content: flex-end; gap: 10px; width: 100%; margin-top: 4px; }
@keyframes onboarding-spin { to { transform: rotate(360deg); } }
@media (max-width: 720px) { .onboarding__hero { grid-template-columns: auto 1fr; padding: 18px; } .onboarding__dismiss { grid-column: 1 / -1; justify-self: start; } .onboarding__choices, .onboarding__learn { grid-template-columns: 1fr; } .onboarding__summary { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 420px) { .onboarding__choice { padding: 16px; } .onboarding__choice-actions .base-button { width: 100%; } .onboarding__success { align-items: flex-start; flex-wrap: wrap; } }
</style>

<template>
  <div class="cfg">

    <!-- ── Topo: conta + tema ─────────────────────────────────── -->
    <div class="cfg__top">
      <section class="cfg__account neo-panel">
        <div class="cfg__avatar">{{ profileInitials }}</div>
        <div class="cfg__account-info">
          <p class="cfg__account-name">{{ profileName }}</p>
          <p class="cfg__account-sub">{{ profileSub }}</p>
        </div>
      </section>

      <section class="cfg__themes">
        <p class="cfg__section-label">Tema</p>
        <div class="cfg__chips">
          <button
            v-for="theme in THEMES"
            :key="theme.id"
            class="cfg__chip"
            :class="{ 'cfg__chip--active': store.settings.themeMode === theme.id }"
            :title="theme.desc"
            @click="onThemeModeChange(theme.id)"
          >
            <span aria-hidden="true">{{ theme.icon }}</span>{{ theme.name }}
          </button>
        </div>
        <p class="cfg__theme-desc">{{ activeThemeDesc }}</p>
      </section>
    </div>

    <!-- ── Atalhos ───────────────────────────────────────────── -->
    <section class="neo-panel">
      <header class="neo-panel-header cfg__panel-head">
        <h3 class="cfg__panel-title">Atalhos</h3>
        <p class="cfg__panel-sub">Guias, ajuda e itens de manutenção do app.</p>
      </header>
      <div class="cfg__shortcut-grid">
        <button
          v-for="item in SETTINGS_SHORTCUTS"
          :key="item.id"
          type="button"
          class="cfg__shortcut"
          @click="goToShortcut(item.id)"
        >
          <span class="cfg__shortcut-icon">
            <BaseIcon :name="item.icon" :size="18" />
          </span>
          <span class="cfg__shortcut-copy">
            <span class="cfg__shortcut-title">{{ item.label }}</span>
            <span class="cfg__shortcut-sub">{{ item.description }}</span>
          </span>
        </button>
      </div>
    </section>

    <!-- ── Instalar app ───────────────────────────────────────── -->
    <section v-if="!isNativePlatform && !$pwaInstalled" class="neo-panel">
      <header class="neo-panel-header cfg__panel-head">
        <h3 class="cfg__panel-title">Instalar aplicativo</h3>
      </header>
      <div class="cfg__panel-body">
        <div class="cfg__install">
          <img src="/icon-192.png" alt="" class="cfg__install-icon" />
          <div>
            <p class="cfg__row-label">Financeiro Familiar</p>
            <p class="cfg__row-sub">Acesso rápido. Alterações pendentes precisam de sincronização.</p>
          </div>
        </div>
        <button class="cfg__btn cfg__btn--primary cfg__btn--block" @click="installPwa">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16l-4-4h3V4h2v8h3l-4 4z"/><path d="M20 20H4"/></svg>
          {{ $pwaPrompt ? 'Instalar agora' : 'Como instalar' }}
        </button>
      </div>
    </section>

    <!-- ── Preferências ───────────────────────────────────────── -->
    <section class="neo-panel">
      <header class="neo-panel-header cfg__panel-head">
        <h3 class="cfg__panel-title">Preferências</h3>
      </header>

      <div class="cfg__row">
        <span class="cfg__row-label">Moeda</span>
        <span class="cfg__row-value">{{ currencyLabel }}</span>
      </div>

      <div class="cfg__row">
        <div class="cfg__row-text">
          <p class="cfg__row-label">Lembretes de vencimento</p>
          <p class="cfg__row-sub">No Android, os avisos são agendados no horário escolhido.</p>
        </div>
        <div class="cfg__row-control">
          <input v-model="store.settings.notificationTime" type="time" class="cfg__input cfg__input--time" aria-label="Horário dos lembretes" />
          <button class="cfg__btn cfg__btn--primary" :disabled="reminderSaving" @click="saveReminderTime">
            {{ reminderSaving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </section>

    <!-- ── Dashboard ──────────────────────────────────────────── -->
    <section class="neo-panel">
      <header class="neo-panel-header cfg__panel-head">
        <h3 class="cfg__panel-title">Configurações do dashboard</h3>
      </header>

      <div class="cfg__row">
        <span class="cfg__row-label">Regra de período</span>
        <div class="cfg__row-control cfg__row-control--select">
          <BaseDropdown v-model="store.filters.periodMode" :height="34">
            <option value="due_date">Por vencimento</option>
            <option value="competence">Por competência</option>
          </BaseDropdown>
        </div>
      </div>

      <div v-for="widget in WIDGETS" :key="widget.id" class="cfg__row">
        <span class="cfg__row-label">{{ widget.label }}</span>
        <button
          class="cfg__toggle"
          :class="{ 'cfg__toggle--on': isWidgetOn(widget.id) }"
          type="button"
          role="switch"
          :aria-checked="isWidgetOn(widget.id)"
          :aria-label="widget.label"
          @click="toggleWidget(widget.id)"
        >
          <span class="cfg__toggle-knob" />
        </button>
      </div>

      <div class="cfg__panel-foot">
        <button class="cfg__btn cfg__btn--primary" @click="saveDashboard">Salvar configurações</button>
      </div>
    </section>

    <!-- ── Cores personalizadas ───────────────────────────────── -->
    <section class="neo-panel">
      <header class="neo-panel-header cfg__panel-head">
        <h3 class="cfg__panel-title">
          Cores personalizadas
          <span v-if="isCustomActive" class="cfg__badge cfg__badge--active">Ativo</span>
        </h3>
        <p class="cfg__panel-sub">Escolha as cores de destaque sobre uma base e veja exemplos antes de aplicar</p>
      </header>

      <div class="cfg__panel-body">
        <!-- Base -->
        <p class="cfg__section-label">Base</p>
        <div class="cfg__base-row">
          <button
            v-for="b in BASE_OPTIONS"
            :key="b.id"
            class="cfg__btn cfg__btn--seg"
            :class="{ 'cfg__btn--seg-on': customDraft.base === b.id }"
            @click="customDraft.base = b.id"
          >{{ b.label }}</button>
        </div>

        <!-- Seletores de cor -->
        <div class="cfg__colors">
          <div v-for="f in COLOR_FIELDS" :key="f.key" class="cfg__color-row">
            <span class="cfg__row-label">{{ f.label }}</span>
            <div class="cfg__color-input">
              <input v-model="customDraft[f.key]" type="color" class="cfg__swatch" :aria-label="f.label" />
              <input v-model="customDraft[f.key]" type="text" class="hex-input" spellcheck="false" :aria-label="`${f.label} (hex)`" />
            </div>
          </div>
        </div>

        <!-- Pré-visualização -->
        <p class="cfg__section-label cfg__section-label--spaced">Pré-visualização</p>
        <div class="cc-preview" :style="previewVars">
          <div class="cc-prow">
            <button class="cc-btn">Salvar</button>
            <span class="cc-chip">Destaque</span>
          </div>
          <div class="cc-card">
            <span class="cc-card-label">Saldo do mês</span>
            <span class="cc-card-value">R$ 3.100,00</span>
          </div>
          <div class="cc-dots">
            <span class="cc-dot"><i style="background:var(--pv-positive)" />Recebido</span>
            <span class="cc-dot"><i style="background:var(--pv-negative)" />Despesa</span>
            <span class="cc-dot"><i style="background:var(--pv-accent)" />Pendente</span>
          </div>
        </div>

        <!-- Ações -->
        <div class="cfg__actions">
          <button class="cfg__btn cfg__btn--ghost" @click="resetCustom">Restaurar</button>
          <button class="cfg__btn cfg__btn--primary cfg__btn--grow" @click="applyCustom">Aplicar cores</button>
        </div>
      </div>
    </section>

    <!-- ── Importar CSV ───────────────────────────────────────── -->
    <section class="neo-panel">
      <header class="neo-panel-header cfg__panel-head">
        <h3 class="cfg__panel-title">Importar CSV</h3>
        <p class="cfg__panel-sub">Cabeçalhos aceitos: date, amount, title</p>
      </header>
      <div class="cfg__panel-body cfg__stack">
        <textarea
          v-model="csvText"
          class="textarea-field"
          rows="5"
          placeholder="date,amount,title&#10;2026-05-25,120.50,Supermercado"
        />
        <div class="cfg__field">
          <label class="cfg__section-label">Conta destino</label>
          <BaseDropdown v-model="importAccountId" :height="38">
            <option value="">Sem conta</option>
            <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
          </BaseDropdown>
        </div>
        <button class="cfg__btn cfg__btn--primary cfg__btn--block" @click="runImport">Importar CSV</button>
      </div>
    </section>

    <!-- ── Dados e recuperação ────────────────────────────────── -->
    <section v-if="!isSupabaseConfigured" class="neo-panel">
      <header class="neo-panel-header cfg__panel-head">
        <h3 class="cfg__panel-title">Dados e recuperação</h3>
        <p class="cfg__panel-sub">Use quando os lançamentos estiverem incorretos ou precisar restaurar o estado inicial</p>
      </header>
      <div class="cfg__panel-body">
        <p class="cfg__row-label">Restaurar dados iniciais</p>
        <p class="cfg__row-sub cfg__row-sub--block">Apaga todos os lançamentos e recria do zero a partir do dados.txt (incluindo correções recentes).</p>
        <button class="cfg__btn cfg__btn--danger" :disabled="reseedBusy" @click="doReseed">
          <svg v-if="reseedBusy" class="cfg__spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.86"/></svg>
          {{ reseedBusy ? 'Restaurando...' : 'Restaurar dados iniciais' }}
        </button>
      </div>
    </section>

    <!-- ── Contas cadastradas ─────────────────────────────────── -->
    <section class="neo-panel">
      <header class="neo-panel-header cfg__panel-head">
        <h3 class="cfg__panel-title">Contas cadastradas</h3>
      </header>
      <div
        v-for="account in store.accounts"
        :key="account.id"
        class="cfg__row"
      >
        <div class="cfg__row-main">
          <span class="cfg__dot" :style="{ background: accountTypeColor(account.type) }" />
          <div class="cfg__row-text">
            <p class="cfg__row-label" :class="{ 'cfg__row-label--muted': account.active === false }">{{ account.name }}</p>
            <p class="cfg__row-sub">
              {{ accountTypeLabel(account.type) }}<span v-if="account.limitTotal"> · Limite <span class="ds-money">{{ currency.format(account.limitTotal) }}</span></span>
            </p>
          </div>
        </div>
        <span v-if="account.active === false" class="cfg__badge cfg__badge--danger">Inativo</span>
      </div>
    </section>

    <!-- ── Compartilhamento / Household ───────────────────────── -->
    <HouseholdSettings v-if="isSupabaseConfigured" />

    <!-- ── Sair ───────────────────────────────────────────────── -->
    <button class="cfg__signout" :disabled="signingOut" @click="doSignOut">
      <svg v-if="signingOut" class="cfg__spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      {{ signingOut ? 'Saindo...' : 'Sair' }}
    </button>

  </div>
</template>

<script setup lang="ts">
import HouseholdSettings from './HouseholdSettings.vue'
import { ref, computed, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { WIDGET_OPTIONS, DEFAULT_COLORS, DARK_COLORS } from '#shared/constants'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { SETTINGS_SHORTCUT_ITEMS } from '~/features/finance/constants/ui'
import type { ThemeMode, Account } from '#shared/types'

const emit = defineEmits<{ navigate: [screen: string] }>()

const store = useFinanceStore()
const currency = useCurrency()
const { user: authUser } = useAuth()
const { logout } = useLogout()
const isNativePlatform = computed(() => process.client && Capacitor.isNativePlatform())

const config = useRuntimeConfig()
const isSupabaseConfigured = computed(() => !!(config.public.supabaseUrl && config.public.supabaseAnonKey))

const signingOut = ref(false)
const doSignOut = async () => {
  signingOut.value = true
  try {
    await logout()
  } finally {
    signingOut.value = false
  }
}
const csvText = ref('')
const importAccountId = ref('')
const reseedBusy = ref(false)
const reminderSaving = ref(false)

const saveReminderTime = async () => {
  reminderSaving.value = true
  try {
    await store.saveDashboard()
    await store.requestNotifications()
    await store.scheduleUpcomingNotifications()
  } finally {
    reminderSaving.value = false
  }
}

const { $pwaPrompt, $pwaInstalled } = useNuxtApp()
const showPwaManual = useState('pwa-show-manual', () => false)

const installPwa = async () => {
  if ($pwaPrompt.value) {
    await $pwaPrompt.value.prompt()
  } else {
    showPwaManual.value = true
  }
}

const THEMES = [
  { id: 'system', name: 'Sistema', desc: 'Segue automaticamente o tema do dispositivo', icon: '🖥️' },
  { id: 'light', name: 'Neo Light', desc: 'Papel quente, tinta preta e cores diretas', icon: '☀️' },
  { id: 'dark', name: 'Neo Dark', desc: 'Superfícies escuras com contornos claros', icon: '🌙' },
] as const

const VALID_THEME_MODES = ['light', 'dark', 'system']

const WIDGETS = WIDGET_OPTIONS
const SETTINGS_SHORTCUTS = SETTINGS_SHORTCUT_ITEMS.map(item => ({
  ...item,
  description: {
    onboarding: 'Guia inicial e checklist',
    help: 'Tutoriais e dúvidas frequentes',
    changelog: 'Mudanças da versão',
    'design-system': 'Componentes e tokens visuais',
  }[item.id],
}))

const isWidgetOn = (id: string) => (store.settings.dashboardConfig.visibleWidgets ?? []).includes(id)

const goToShortcut = (screen: string) => {
  emit('navigate', screen)
}

const onThemeModeChange = async (value: string) => {
  if (VALID_THEME_MODES.includes(value)) {
    store.setThemeMode(value as ThemeMode)
    await store.saveTheme()
  }
}

const activeThemeDesc = computed(() => {
  if (store.settings.themeMode === 'custom') return 'Cores personalizadas aplicadas'
  return THEMES.find(t => t.id === store.settings.themeMode)?.desc ?? ''
})

// ─── Identidade exibida no cartão de conta ───────────────────────────────────

const initialsOf = (raw: string) => {
  const parts = raw.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  const first = parts[0] ?? ''
  const second = parts[1] ?? ''
  const a = first[0] ?? 'F'
  const b = second[0] ?? first[1] ?? 'F'
  return (a + b).toUpperCase()
}

const profileName = computed(() => authUser.value?.email ?? 'Modo demonstração')
const profileInitials = computed(() => initialsOf(authUser.value?.email ?? 'Financeiro Familiar'))
const profileSub = computed(() => isSupabaseConfigured.value ? 'household · sincronizado' : 'household · modo local')

const CURRENCY_LABELS: Record<string, string> = {
  BRL: 'BRL (R$)',
  USD: 'USD ($)',
  EUR: 'EUR (€)',
}
const currencyLabel = computed(() => {
  const code = store.settings.currency || 'BRL'
  return CURRENCY_LABELS[code] ?? code
})

// ─── Cores personalizadas ────────────────────────────────────────────────────

type ColorKey = 'primary' | 'accent' | 'positive' | 'negative'

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: 'primary',  label: 'Primária' },
  { key: 'accent',   label: 'Destaque' },
  { key: 'positive', label: 'Receita' },
  { key: 'negative', label: 'Despesa' },
]

const BASE_OPTIONS: { id: 'light' | 'dark'; label: string }[] = [
  { id: 'light', label: '☀️ Clara' },
  { id: 'dark',  label: '🌙 Escura' },
]

const customDraft = ref<{ base: 'light' | 'dark'; primary: string; accent: string; positive: string; negative: string }>({
  base: 'dark',
  primary: '#00ff33',
  accent: '#bb00ff',
  positive: '#13a86b',
  negative: '#e84545',
})

const isCustomActive = computed(() => store.settings.themeMode === 'custom')

// Paleta estrutural do preview conforme a base escolhida.
const PREVIEW_BASE = {
  light: { bg: '#f3efe6', card: '#fffdf6', text: '#171717', muted: '#666666', border: '#171717' },
  dark:  { bg: '#090b10', card: '#171c25', text: '#f7f2e8', muted: '#969dac', border: '#020306' },
}

const previewBase = computed(() => PREVIEW_BASE[customDraft.value.base])

const previewVars = computed(() => ({
  background: previewBase.value.bg,
  color: previewBase.value.text,
  '--pv-primary': customDraft.value.primary,
  '--pv-accent': customDraft.value.accent,
  '--pv-positive': customDraft.value.positive,
  '--pv-negative': customDraft.value.negative,
  '--pv-card': previewBase.value.card,
  '--pv-text': previewBase.value.text,
  '--pv-muted': previewBase.value.muted,
  '--pv-border': previewBase.value.border,
}))

const initCustomDraft = () => {
  if (store.settings.themeMode !== 'custom') return
  const c = store.settings.colorTokens
  const h = c.background.replace('#', '')
  const isLight = h.length >= 6 && (0.299 * parseInt(h.slice(0, 2), 16) + 0.587 * parseInt(h.slice(2, 4), 16) + 0.114 * parseInt(h.slice(4, 6), 16)) > 140
  customDraft.value = {
    base: isLight ? 'light' : 'dark',
    primary: c.primary, accent: c.accent, positive: c.positive, negative: c.negative,
  }
}

const resetCustom = () => {
  const base = customDraft.value.base === 'light' ? DEFAULT_COLORS : DARK_COLORS
  customDraft.value = {
    base: customDraft.value.base,
    primary: base.primary, accent: base.accent, positive: base.positive, negative: base.negative,
  }
}

const applyCustom = async () => {
  const base = customDraft.value.base === 'light' ? DEFAULT_COLORS : DARK_COLORS
  store.settings.themeMode = 'custom'
  store.settings.colorTokens = {
    primary: customDraft.value.primary,
    accent: customDraft.value.accent,
    positive: customDraft.value.positive,
    negative: customDraft.value.negative,
    neutral: base.neutral,
    background: base.background,
    card: base.card,
  }
  store.applyTheme()
  await store.saveTheme()
}

const toggleWidget = (id: string) => {
  const next = new Set(store.settings.dashboardConfig.visibleWidgets)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  store.settings.dashboardConfig.visibleWidgets = [...next]
}

const saveDashboard = async () => {
  await store.saveDashboard()
}

const runImport = async () => {
  if (!csvText.value.trim()) return
  await store.importCsv(csvText.value, importAccountId.value || null)
  csvText.value = ''
}

const doReseed = async () => {
  if (!confirm('Isso vai apagar todos os lançamentos e recriar do zero. Continuar?')) return
  reseedBusy.value = true
  try {
    await store.reseedEntries()
  } finally {
    reseedBusy.value = false
  }
}

const accountTypeColor = (type: Account['type']) => {
  if (type === 'bank') return 'var(--primary)'
  if (type === 'credit_card') return 'var(--danger)'
  return 'var(--warning)'
}

const accountTypeLabel = (type: Account['type']) => {
  if (type === 'bank') return 'Conta bancária'
  if (type === 'credit_card') return 'Cartão de crédito'
  return 'Benefício'
}

// ─── Compartilhamento de household ───────────────────────────────────────────

onMounted(() => initCustomDraft())
</script>

<style src="../styles/settings.css"></style>

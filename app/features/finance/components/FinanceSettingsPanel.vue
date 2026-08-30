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
            <p class="cfg__row-sub">Acesso rápido, funciona offline</p>
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
    <section class="neo-panel">
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
    <section v-if="isSupabaseConfigured" class="neo-panel">
      <header class="neo-panel-header cfg__panel-head">
        <h3 class="cfg__panel-title">Compartilhamento</h3>
        <p class="cfg__panel-sub">Gerencie quem tem acesso aos seus dados financeiros</p>
      </header>

      <div v-if="householdLoading" class="cfg__row">
        <span class="cfg__row-value">Carregando membros...</span>
      </div>

      <template v-else>
        <div v-for="m in members" :key="m.userId" class="cfg__row">
          <div class="cfg__row-main">
            <span class="cfg__member-avatar">{{ m.email[0]?.toUpperCase() }}</span>
            <div class="cfg__row-text">
              <p class="cfg__row-label cfg__row-label--ellipsis">{{ m.email }}</p>
              <p class="cfg__row-sub">{{ m.role === 'owner' ? 'Proprietário' : 'Membro' }}</p>
            </div>
          </div>
        </div>
      </template>

      <div v-for="inv in pendingInvites" :key="inv.id" class="cfg__row">
        <div class="cfg__row-text">
          <p class="cfg__row-label cfg__row-label--ellipsis">{{ inv.email }}</p>
          <p class="cfg__row-sub">Expira {{ fmtDate(inv.expiresAt) }}</p>
        </div>
        <span class="cfg__badge cfg__badge--warning">Aguardando</span>
      </div>

      <div class="cfg__panel-body">
        <p class="cfg__section-label">Convidar por e-mail</p>
        <div class="cfg__invite">
          <input
            v-model="inviteEmail"
            type="email"
            placeholder="email@exemplo.com"
            class="cfg__input cfg__input--grow"
            aria-label="E-mail do convidado"
            @keydown.enter="sendInvite"
          />
          <button class="cfg__btn cfg__btn--primary" :disabled="inviteSending || !inviteEmail" @click="sendInvite">
            {{ inviteSending ? '...' : 'Convidar' }}
          </button>
        </div>

        <div v-if="inviteLink" class="cfg__invite-link">
          <p class="cfg__invite-link-title">Convite gerado! Compartilhe o link:</p>
          <div class="cfg__invite-link-row">
            <code class="cfg__invite-code">{{ inviteLink }}</code>
            <button class="cfg__link-btn" @click="copyInviteLink">{{ linkCopied ? 'Copiado!' : 'Copiar' }}</button>
          </div>
        </div>

        <p v-if="inviteError" class="cfg__error">{{ inviteError }}</p>
      </div>
    </section>

    <!-- ── Sair ───────────────────────────────────────────────── -->
    <button class="cfg__signout" :disabled="signingOut" @click="doSignOut">
      <svg v-if="signingOut" class="cfg__spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      {{ signingOut ? 'Saindo...' : 'Sair' }}
    </button>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { WIDGET_OPTIONS, DEFAULT_COLORS, DARK_COLORS } from '#shared/constants'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import type { ThemeMode, Account } from '#shared/types'

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
  { id: 'eva', name: 'EVA Brutal', desc: 'Roxo e neon com estrutura neo-brutalista', icon: '⚡' },
  { id: 'cyberpunk', name: 'Cyber Brutal', desc: 'Azul elétrico e amarelo em blocos sólidos', icon: '🌃' },
  { id: 'arasaka', name: 'Arasaka Brutal', desc: 'Vermelho corporativo com contraste rígido', icon: '🔻' },
] as const

const VALID_THEME_MODES = ['light', 'dark', 'eva', 'cyberpunk', 'arasaka', 'system']

const WIDGETS = WIDGET_OPTIONS

const isWidgetOn = (id: string) => (store.settings.dashboardConfig.visibleWidgets ?? []).includes(id)

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

interface Member { userId: string; email: string; role: string; joinedAt: string }
interface Invite  { id: string; email: string; role: string; expiresAt: string }

const householdLoading = ref(false)
const members          = ref<Member[]>([])
const pendingInvites   = ref<Invite[]>([])
const inviteEmail      = ref('')
const inviteSending    = ref(false)
const inviteLink       = ref('')
const inviteError      = ref('')
const linkCopied       = ref(false)

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

const loadHousehold = async () => {
  if (!isSupabaseConfigured.value) return
  householdLoading.value = true
  try {
    const data = await $fetch<{ householdId: string; members: Member[]; invitations: Invite[] }>('/api/me/household')
    members.value      = data.members
    pendingInvites.value = data.invitations
  } catch { /* ignore */ } finally {
    householdLoading.value = false
  }
}

onMounted(loadHousehold)
onMounted(initCustomDraft)

const sendInvite = async () => {
  if (!inviteEmail.value || inviteSending.value) return
  inviteError.value = ''
  inviteLink.value  = ''
  inviteSending.value = true
  try {
    const res = await $fetch<{ token: string }>('/api/invitations/create', {
      method: 'POST',
      body: { email: inviteEmail.value }
    })
    const origin = window.location.origin
    inviteLink.value = `${origin}/invite/${res.token}`
    inviteEmail.value = ''
    await loadHousehold()
  } catch (err: any) {
    inviteError.value = err?.data?.statusMessage ?? 'Erro ao criar convite.'
  } finally {
    inviteSending.value = false
  }
}

const copyInviteLink = async () => {
  await navigator.clipboard.writeText(inviteLink.value)
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false }, 2000)
}
</script>

<style scoped>
.cfg {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Topo: conta + tema ─────────────────────────────────────── */
.cfg__top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}

.cfg__account {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
}

.cfg__avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: var(--primary);
  border: var(--border-width) solid var(--border);
  border-radius: 50%;
  color: var(--on-primary);
  font-size: 16px;
  font-weight: 800;
}

.cfg__account-info {
  min-width: 0;
}

.cfg__account-name {
  overflow: hidden;
  color: var(--text);
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cfg__account-sub {
  margin-top: 2px;
  color: var(--text3);
  font-size: 11.5px;
}

.cfg__themes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cfg__section-label {
  color: var(--text3);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.cfg__section-label--spaced {
  margin: 16px 0 6px;
}

.cfg__chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.cfg__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 13px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-xs);
  color: var(--text2);
  font-family: inherit;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.cfg__chip:hover {
  box-shadow: var(--shadow-sm);
  transform: translate(-1px, -1px);
}

.cfg__chip:active {
  box-shadow: 1px 1px 0 var(--ds-shadow-color);
  transform: translate(1px, 1px);
}

.cfg__chip--active {
  background: var(--primary);
  color: var(--on-primary);
}

.cfg__theme-desc {
  color: var(--text3);
  font-size: 11px;
}

/* ── Painéis ────────────────────────────────────────────────── */
.cfg__panel-head {
  padding: 14px 18px;
}

.cfg__panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-size: 14px;
  font-weight: 800;
}

.cfg__panel-sub {
  margin-top: 2px;
  color: var(--text3);
  font-size: 12px;
}

.cfg__panel-body {
  padding: 16px 18px;
}

.cfg__panel-foot {
  display: flex;
  justify-content: flex-end;
  padding: 14px 18px;
}

.cfg__stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cfg__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* ── Linhas ─────────────────────────────────────────────────── */
.cfg__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}

.cfg__row:last-child {
  border-bottom: none;
}

.cfg__row-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.cfg__row-text {
  min-width: 0;
}

.cfg__row-label {
  color: var(--text);
  font-size: 13.5px;
  font-weight: 700;
}

.cfg__row-label--muted {
  color: var(--text3);
}

.cfg__row-label--ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cfg__row-sub {
  margin-top: 2px;
  color: var(--text3);
  font-size: 11.5px;
}

.cfg__row-sub--block {
  margin-bottom: 10px;
}

.cfg__row-value {
  flex-shrink: 0;
  color: var(--text3);
  font-size: 12.5px;
}

.cfg__row-control {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.cfg__row-control--select {
  width: 190px;
}

.cfg__dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border: 1px solid var(--border);
  border-radius: 50%;
}

/* ── Toggle ─────────────────────────────────────────────────── */
.cfg__toggle {
  position: relative;
  flex-shrink: 0;
  width: 38px;
  height: 22px;
  padding: 0;
  background: var(--surface2);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background var(--ds-motion-fast) linear;
}

.cfg__toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: var(--text3);
  border-radius: 50%;
  transition: left var(--ds-motion-base) linear, background var(--ds-motion-fast) linear;
}

.cfg__toggle--on {
  background: var(--primary);
}

.cfg__toggle--on .cfg__toggle-knob {
  left: 18px;
  background: var(--on-primary);
}

/* ── Badges ─────────────────────────────────────────────────── */
.cfg__badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.cfg__badge--active {
  background: var(--primary-dim);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-xs);
  color: var(--on-primary-dim);
}

.cfg__badge--danger {
  background: var(--danger-light);
  color: var(--danger);
}

.cfg__badge--warning {
  background: var(--warning-light);
  color: var(--warning);
}

/* ── Botões ─────────────────────────────────────────────────── */
.cfg__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 750;
  line-height: 1.1;
  cursor: pointer;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.cfg__btn:not(:disabled):hover {
  box-shadow: var(--shadow-md);
  transform: translate(-1px, -1px);
}

.cfg__btn:not(:disabled):active {
  box-shadow: 1px 1px 0 var(--ds-shadow-color);
  transform: translate(2px, 2px);
}

.cfg__btn:disabled {
  cursor: not-allowed;
  filter: grayscale(0.45);
  opacity: 0.58;
}

.cfg__btn--primary {
  background: var(--primary);
  color: var(--on-primary);
}

.cfg__btn--ghost {
  background: var(--surface2);
  color: var(--text2);
}

.cfg__btn--danger {
  background: var(--danger-light);
  color: var(--danger);
}

.cfg__btn--block {
  width: 100%;
}

.cfg__btn--grow {
  flex: 1;
}

.cfg__btn--seg {
  flex: 1;
  background: var(--surface2);
  color: var(--text2);
}

.cfg__btn--seg-on {
  background: var(--primary-dim);
  color: var(--on-primary-dim);
}

.cfg__signout {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--danger-light);
  border: var(--border-width) solid var(--border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--shadow-sm);
  color: var(--danger);
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.cfg__signout:not(:disabled):hover {
  box-shadow: var(--shadow-md);
  transform: translate(-1px, -1px);
}

.cfg__signout:not(:disabled):active {
  box-shadow: 1px 1px 0 var(--ds-shadow-color);
  transform: translate(2px, 2px);
}

.cfg__signout:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

/* ── Campos ─────────────────────────────────────────────────── */
.cfg__input {
  box-sizing: border-box;
  height: 38px;
  padding: 0 12px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 650;
  outline: none;
  transition: transform var(--ds-motion-fast) linear, box-shadow var(--ds-motion-fast) linear;
}

.cfg__input::placeholder {
  color: var(--text3);
}

.cfg__input:focus {
  box-shadow: var(--shadow-sm);
  transform: translate(-1px, -1px);
}

.cfg__input--time {
  width: 118px;
  font-family: var(--ds-font-family-mono);
}

.cfg__input--grow {
  flex: 1;
  min-width: 0;
}

/* ── Instalar app ───────────────────────────────────────────── */
.cfg__install {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.cfg__install-icon {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
}

/* ── Cores personalizadas ───────────────────────────────────── */
.cfg__base-row {
  display: flex;
  gap: 8px;
  margin: 6px 0 14px;
}

.cfg__colors {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cfg__color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: var(--surface2);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
}

.cfg__color-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cfg__swatch {
  width: 34px;
  height: 30px;
  padding: 0;
  background: transparent;
  border: var(--border-width) solid var(--border);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
}

.cfg__swatch::-webkit-color-swatch-wrapper { padding: 3px; }
.cfg__swatch::-webkit-color-swatch { border: none; border-radius: var(--radius-sm); }

.hex-input {
  width: 88px;
  height: 30px;
  padding: 0 10px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: var(--ds-font-family-mono);
  font-size: 12px;
  outline: none;
  text-transform: lowercase;
}

.hex-input:focus {
  box-shadow: var(--shadow-xs);
}

.cfg__actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

/* Preview do tema personalizado: cores vindas dos dados (--pv-*). */
.cc-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: var(--border-width-strong) solid var(--pv-border);
  border-radius: var(--radius);
  box-shadow: 6px 6px 0 var(--pv-border);
}
.cc-prow {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cc-btn {
  padding: 8px 18px;
  background: var(--pv-primary);
  border: var(--border-width) solid var(--pv-border);
  border-radius: var(--radius-sm);
  box-shadow: 3px 3px 0 var(--pv-border);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: default;
}
.cc-chip {
  padding: 5px 12px;
  background: color-mix(in srgb, var(--pv-accent) 22%, transparent);
  border: var(--border-width) solid var(--pv-border);
  border-radius: var(--radius-sm);
  color: var(--pv-accent);
  font-size: 12px;
  font-weight: 700;
}
.cc-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  background: var(--pv-card);
  border: var(--border-width) solid var(--pv-border);
  border-radius: var(--radius-sm);
  box-shadow: 3px 3px 0 var(--pv-border);
}
.cc-card-label {
  color: var(--pv-muted);
  font-size: 11px;
  font-weight: 600;
}
.cc-card-value {
  color: var(--pv-primary);
  font-family: var(--ds-font-family-mono);
  font-size: 18px;
  font-weight: 800;
}
.cc-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.cc-dot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--pv-text);
  font-size: 12px;
  font-weight: 600;
}
.cc-dot i {
  display: inline-block;
  width: 9px;
  height: 9px;
  border: 1px solid var(--pv-border);
}

/* ── Importar CSV ───────────────────────────────────────────── */
.textarea-field {
  width: 100%;
  padding: 9px 12px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  color: var(--text);
  font-family: var(--ds-font-family-mono);
  font-size: 12.5px;
  outline: none;
  resize: vertical;
}

.textarea-field:focus {
  box-shadow: var(--shadow-sm);
}

/* ── Compartilhamento ───────────────────────────────────────── */
.cfg__member-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--primary-dim);
  border: var(--border-width) solid var(--border);
  border-radius: 50%;
  color: var(--on-primary-dim);
  font-size: 12px;
  font-weight: 800;
}

.cfg__invite {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.cfg__invite-link {
  margin-top: 10px;
  padding: 10px 12px;
  background: var(--success-light);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
}

.cfg__invite-link-title {
  margin-bottom: 4px;
  color: var(--success);
  font-size: 11px;
  font-weight: 800;
}

.cfg__invite-link-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cfg__invite-code {
  flex: 1;
  overflow: hidden;
  color: var(--text2);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cfg__link-btn {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: var(--primary);
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.cfg__error {
  margin-top: 6px;
  color: var(--danger);
  font-size: 12px;
  font-weight: 700;
}

/* ── Utilitários ────────────────────────────────────────────── */
.cfg__spin {
  animation: cfg-spin 0.8s linear infinite;
}

@keyframes cfg-spin {
  to { transform: rotate(360deg); }
}

/* ── Responsivo ─────────────────────────────────────────────── */
@media (max-width: 700px) {
  .cfg__top {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .cfg {
    gap: 14px;
  }

  .cfg__account {
    gap: 12px;
    padding: 14px;
  }

  .cfg__avatar {
    width: 46px;
    height: 46px;
    font-size: 15px;
  }

  .cfg__account-name {
    font-size: 14px;
  }

  .cfg__panel-head,
  .cfg__panel-foot {
    padding: 12px 14px;
  }

  .cfg__panel-body {
    padding: 12px 14px;
  }

  .cfg__row {
    padding: 13px 14px;
  }

  .cfg__row-control--select {
    width: 150px;
  }

  .cfg__signout {
    width: 100%;
    justify-content: center;
  }
}
</style>

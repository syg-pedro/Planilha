<template>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px">

    <!-- Instalar App -->
    <div v-if="!$pwaInstalled" class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Instalar aplicativo</h3>
      </div>
      <div class="panel-body">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
          <img src="/icon-192.png" alt="" style="width:52px;height:52px;border-radius:12px;flex-shrink:0" />
          <div>
            <p style="font-size:13px;font-weight:700;color:var(--text)">Financeiro Familiar</p>
            <p style="font-size:12px;color:var(--text3);margin-top:2px">Acesso rápido, funciona offline</p>
          </div>
        </div>
        <button
          style="width:100%;padding:10px 16px;font-size:13px;font-weight:700;border-radius:var(--radius-sm);border:none;cursor:pointer;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;gap:8px"
          @click="installPwa"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16l-4-4h3V4h2v8h3l-4 4z"/><path d="M20 20H4"/></svg>
          {{ $pwaPrompt ? 'Instalar agora' : 'Como instalar' }}
        </button>
      </div>
    </div>

    <!-- Tema visual -->
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Tema visual</h3>
      </div>
      <div class="panel-body">
        <div style="display:flex;flex-direction:column;gap:10px">
          <button
            v-for="theme in THEMES"
            :key="theme.id"
            class="theme-btn"
            :style="{
              border: store.settings.themeMode === theme.id ? '2px solid var(--primary)' : '2px solid var(--border)',
              background: store.settings.themeMode === theme.id ? 'var(--primary-dim)' : 'var(--surface2)'
            }"
            @click="onThemeModeChange(theme.id)"
          >
            <span style="font-size:24px">{{ theme.icon }}</span>
            <div style="flex:1">
              <p style="font-size:13px;font-weight:700;color:var(--text)">{{ theme.name }}</p>
              <p style="font-size:11px;color:var(--text3)">{{ theme.desc }}</p>
            </div>
            <svg
              v-if="store.settings.themeMode === theme.id"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              style="color:var(--primary);flex-shrink:0;margin-left:auto"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Cores personalizadas -->
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">
          Cores personalizadas
          <span v-if="isCustomActive" class="active-badge">Ativo</span>
        </h3>
        <p class="panel-sub">Escolha as cores de destaque sobre uma base e veja exemplos antes de aplicar</p>
      </div>
      <div class="panel-body">
        <!-- Base -->
        <div class="field" style="margin-bottom:14px">
          <label class="field-label">Base</label>
          <div style="display:flex;gap:8px">
            <button
              v-for="b in [{ id: 'light', label: '☀️ Clara' }, { id: 'dark', label: '🌙 Escura' }]"
              :key="b.id"
              class="base-btn"
              :style="{
                border: customDraft.base === b.id ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                background: customDraft.base === b.id ? 'var(--primary-dim)' : 'var(--surface2)',
                color: customDraft.base === b.id ? 'var(--primary)' : 'var(--text2)',
              }"
              @click="customDraft.base = (b.id as 'light' | 'dark')"
            >{{ b.label }}</button>
          </div>
        </div>

        <!-- Seletores de cor -->
        <div style="display:flex;flex-direction:column;gap:8px">
          <div v-for="f in COLOR_FIELDS" :key="f.key" class="color-row">
            <span class="color-row-label">{{ f.label }}</span>
            <div class="color-input">
              <input v-model="customDraft[f.key]" type="color" class="color-swatch" />
              <input v-model="customDraft[f.key]" type="text" class="hex-input" spellcheck="false" />
            </div>
          </div>
        </div>

        <!-- Pré-visualização -->
        <p class="field-label" style="margin:16px 0 6px">Pré-visualização</p>
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
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn-ghost" @click="resetCustom">Restaurar</button>
          <button class="btn-primary" style="flex:1" @click="applyCustom">Aplicar cores</button>
        </div>
      </div>
    </div>

    <!-- Configurações do dashboard -->
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Configurações do dashboard</h3>
      </div>
      <div class="panel-body">
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="field">
            <label class="field-label">Regra de período</label>
            <div class="select-wrap">
              <select v-model="store.filters.periodMode" class="select-inner">
                <option value="due_date">Por vencimento</option>
                <option value="competence">Por competência</option>
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text3);flex-shrink:0;pointer-events:none"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>

          <div>
            <p style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px">Widgets visíveis</p>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div
                v-for="widget in WIDGETS"
                :key="widget.id"
                style="padding:8px 12px;background:var(--surface2);border-radius:var(--radius-xs);border:1px solid var(--border)"
              >
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
                  <div
                    style="width:18px;height:18px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;cursor:pointer"
                    :style="{
                      border: isWidgetOn(widget.id) ? '2px solid var(--primary)' : '2px solid var(--border-strong)',
                      background: isWidgetOn(widget.id) ? 'var(--primary)' : 'var(--surface2)'
                    }"
                    @click="toggleWidget(widget.id)"
                  >
                    <svg v-if="isWidgetOn(widget.id)" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style="font-size:13px;color:var(--text)">{{ widget.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <button class="btn-primary" @click="saveDashboard">Salvar configurações</button>
        </div>
      </div>
    </div>

    <!-- Importar CSV -->
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Importar CSV</h3>
        <p class="panel-sub">Cabeçalhos aceitos: date, amount, title</p>
      </div>
      <div class="panel-body">
        <div style="display:flex;flex-direction:column;gap:10px">
          <textarea
            v-model="csvText"
            class="textarea-field"
            rows="5"
            placeholder="date,amount,title&#10;2026-05-25,120.50,Supermercado"
          />
          <div class="field">
            <label class="field-label">Conta destino</label>
            <div class="select-wrap">
              <select v-model="importAccountId" class="select-inner">
                <option value="">Sem conta</option>
                <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text3);flex-shrink:0;pointer-events:none"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
          <button class="btn-primary" @click="runImport">Importar CSV</button>
        </div>
      </div>
    </div>

    <!-- Dados e recuperação -->
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Dados e recuperação</h3>
        <p class="panel-sub">Use quando os lançamentos estiverem incorretos ou precisar restaurar o estado inicial</p>
      </div>
      <div class="panel-body">
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-xs);padding:12px 14px">
            <p style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px">Restaurar dados iniciais</p>
            <p style="font-size:12px;color:var(--text3);margin-bottom:10px">Apaga todos os lançamentos e recria do zero a partir do dados.txt (incluindo correções recentes).</p>
            <button
              class="btn-danger"
              :disabled="reseedBusy"
              @click="doReseed"
            >
              <svg v-if="reseedBusy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.86"/></svg>
              {{ reseedBusy ? 'Restaurando...' : 'Restaurar dados iniciais' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sair da conta -->
    <div v-if="isSupabaseConfigured" class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Conta</h3>
        <p class="panel-sub">{{ authUser?.email }}</p>
      </div>
      <div class="panel-body">
        <button
          class="btn-danger"
          :disabled="signingOut"
          @click="doSignOut"
        >
          <svg v-if="signingOut" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {{ signingOut ? 'Saindo...' : 'Sair da conta' }}
        </button>
      </div>
    </div>

    <!-- Contas cadastradas -->
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Contas cadastradas</h3>
      </div>
      <div class="panel-body">
        <div style="display:flex;flex-direction:column;gap:8px">
          <div
            v-for="account in store.accounts"
            :key="account.id"
            style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface2);border-radius:var(--radius-xs);border:1px solid var(--border)"
          >
            <div
              style="width:8px;height:8px;border-radius:50%;flex-shrink:0"
              :style="{ background: accountTypeColor(account.type) }"
            />
            <div style="flex:1;min-width:0">
              <p
                style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                :style="{ color: account.active === false ? 'var(--text3)' : 'var(--text)' }"
              >{{ account.name }}</p>
              <p style="font-size:11px;color:var(--text3)">
                {{ accountTypeLabel(account.type) }}<span v-if="account.limitTotal"> · Limite {{ currency.format(account.limitTotal) }}</span>
              </p>
            </div>
            <span
              v-if="account.active === false"
              style="font-size:10px;color:var(--danger);background:var(--danger-light);border-radius:99px;padding:1px 8px;font-weight:700;flex-shrink:0"
            >Inativo</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Compartilhamento / Household -->
    <div v-if="isSupabaseConfigured" class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Compartilhamento</h3>
        <p class="panel-sub">Gerencie quem tem acesso aos seus dados financeiros</p>
      </div>
      <div class="panel-body" style="display:flex;flex-direction:column;gap:14px">

        <!-- Membros atuais -->
        <div v-if="householdLoading" style="font-size:13px;color:var(--text3)">Carregando membros...</div>
        <div v-else-if="members.length > 0">
          <p style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px">Membros</p>
          <div style="display:flex;flex-direction:column;gap:6px">
            <div
              v-for="m in members"
              :key="m.userId"
              style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border)"
            >
              <div style="width:30px;height:30px;border-radius:50%;background:var(--primary-dim);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span style="font-size:12px;font-weight:700;color:var(--primary)">{{ m.email[0]?.toUpperCase() }}</span>
              </div>
              <div style="flex:1;min-width:0">
                <p style="font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ m.email }}</p>
                <p style="font-size:11px;color:var(--text3)">{{ m.role === 'owner' ? 'Proprietário' : 'Membro' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Convites pendentes -->
        <div v-if="pendingInvites.length > 0">
          <p style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px">Convites pendentes</p>
          <div style="display:flex;flex-direction:column;gap:6px">
            <div
              v-for="inv in pendingInvites"
              :key="inv.id"
              style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:color-mix(in srgb,var(--warning) 8%,transparent);border-radius:var(--radius-sm);border:1px solid color-mix(in srgb,var(--warning) 25%,transparent)"
            >
              <div style="flex:1;min-width:0">
                <p style="font-size:13px;font-weight:600;color:var(--text)">{{ inv.email }}</p>
                <p style="font-size:11px;color:var(--text3)">Expira {{ fmtDate(inv.expiresAt) }}</p>
              </div>
              <span style="font-size:10px;font-weight:700;color:var(--warning);background:color-mix(in srgb,var(--warning) 15%,transparent);padding:2px 7px;border-radius:99px">Aguardando</span>
            </div>
          </div>
        </div>

        <!-- Formulário de convite -->
        <div>
          <p style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px">Convidar por e-mail</p>
          <div style="display:flex;gap:8px">
            <input
              v-model="inviteEmail"
              type="email"
              placeholder="email@exemplo.com"
              style="flex:1;background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--radius-xs);padding:0 12px;height:38px;font-size:13px;color:var(--text);outline:none;font-family:inherit"
              @keydown.enter="sendInvite"
            />
            <button
              class="btn-primary"
              style="flex-shrink:0"
              :disabled="inviteSending || !inviteEmail"
              @click="sendInvite"
            >
              {{ inviteSending ? '...' : 'Convidar' }}
            </button>
          </div>
          <div v-if="inviteLink" style="margin-top:10px;padding:10px 12px;background:color-mix(in srgb,var(--success) 8%,transparent);border:1px solid color-mix(in srgb,var(--success) 25%,transparent);border-radius:var(--radius-sm)">
            <p style="font-size:11px;font-weight:700;color:var(--success);margin-bottom:4px">Convite gerado! Compartilhe o link:</p>
            <div style="display:flex;gap:6px;align-items:center">
              <code style="font-size:11px;color:var(--text2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ inviteLink }}</code>
              <button
                style="font-size:11px;font-weight:700;color:var(--primary);background:transparent;border:none;cursor:pointer;flex-shrink:0"
                @click="copyInviteLink"
              >{{ linkCopied ? 'Copiado!' : 'Copiar' }}</button>
            </div>
          </div>
          <p v-if="inviteError" style="font-size:12px;color:var(--danger);margin-top:6px">{{ inviteError }}</p>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { WIDGET_OPTIONS, DEFAULT_COLORS, DARK_COLORS } from '#shared/constants'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import type { ThemeMode, Account } from '#shared/types'

const store = useFinanceStore()
const currency = useCurrency()
const { user: authUser, signOut } = useAuth()

const config = useRuntimeConfig()
const isSupabaseConfigured = computed(() => !!(config.public.supabaseUrl && config.public.supabaseAnonKey))

const signingOut = ref(false)
const doSignOut = async () => {
  signingOut.value = true
  try {
    await signOut()
    await navigateTo('/login')
  } finally {
    signingOut.value = false
  }
}
const csvText = ref('')
const importAccountId = ref('')
const reseedBusy = ref(false)

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
  { id: 'light', name: 'Light Clean', desc: 'Claro e minimalista, ideal para o dia a dia', icon: '☀️' },
  { id: 'dark', name: 'Dark Premium', desc: 'Escuro profissional, confortável à noite', icon: '🌙' },
  { id: 'eva', name: 'EVA-01', desc: 'Temática especial, roxa e neon', icon: '⚡' },
  { id: 'cyberpunk', name: 'Cyberpunk', desc: 'Azul elétrico e amarelo neon', icon: '🌃' },
  { id: 'arasaka', name: 'Arasaka', desc: 'Vermelho corporativo sobre preto', icon: '🔻' },
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

// ─── Cores personalizadas ────────────────────────────────────────────────────

type ColorKey = 'primary' | 'accent' | 'positive' | 'negative'

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: 'primary',  label: 'Primária' },
  { key: 'accent',   label: 'Destaque' },
  { key: 'positive', label: 'Receita' },
  { key: 'negative', label: 'Despesa' },
]

const customDraft = ref<{ base: 'light' | 'dark'; primary: string; accent: string; positive: string; negative: string }>({
  base: 'dark',
  primary: '#2f7bff',
  accent: '#f5e000',
  positive: '#22c55e',
  negative: '#ef4444',
})

const isCustomActive = computed(() => store.settings.themeMode === 'custom')

// Paleta estrutural do preview conforme a base escolhida.
const PREVIEW_BASE = {
  light: { bg: '#f8fafc', card: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#e2e8f0' },
  dark:  { bg: '#0b1020', card: '#111827', text: '#e6e9f0', muted: '#94a3b8', border: '#283047' },
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
.panel {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.panel-header {
  padding: 16px 20px 0;
}
.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}
.panel-sub {
  font-size: 12px;
  color: var(--text3);
  margin-top: 2px;
}
.panel-body {
  padding: 16px 20px;
}
.theme-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}
.theme-btn:hover {
  filter: brightness(0.97);
}

/* ── Cores personalizadas ──────────────────────────── */
.active-badge {
  font-size: 10px;
  font-weight: 800;
  color: var(--primary);
  background: var(--primary-dim);
  border-radius: 99px;
  padding: 2px 8px;
  margin-left: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  vertical-align: middle;
}
.base-btn {
  flex: 1;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
}
.color-row-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.color-input {
  display: flex;
  align-items: center;
  gap: 8px;
}
.color-swatch {
  width: 34px;
  height: 30px;
  padding: 0;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}
.color-swatch::-webkit-color-swatch-wrapper { padding: 3px; }
.color-swatch::-webkit-color-swatch { border: none; border-radius: 5px; }
.hex-input {
  width: 88px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 0 10px;
  height: 30px;
  font-size: 12px;
  font-family: var(--ds-font-family-mono, monospace);
  color: var(--text);
  outline: none;
  text-transform: lowercase;
}
.hex-input:focus { border-color: var(--primary); }

.cc-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--pv-border);
}
.cc-prow {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cc-btn {
  padding: 8px 18px;
  border: none;
  border-radius: 8px;
  background: var(--pv-primary);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: default;
}
.cc-chip {
  padding: 5px 12px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--pv-accent) 22%, transparent);
  color: var(--pv-accent);
  font-size: 12px;
  font-weight: 700;
}
.cc-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--pv-card);
  border: 1px solid var(--pv-border);
}
.cc-card-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--pv-muted);
}
.cc-card-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--pv-primary);
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
  font-size: 12px;
  font-weight: 600;
  color: var(--pv-text);
}
.cc-dot i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}
.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 16px;
  background: var(--surface2);
  color: var(--text2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover { filter: brightness(0.97); }
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}
.select-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 0 12px;
  height: 38px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.select-wrap:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-dim);
}
.select-inner {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--text);
  font-family: inherit;
  cursor: pointer;
  appearance: none;
  min-width: 0;
}
.textarea-field {
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  padding: 9px 12px;
  font-size: 13px;
  color: var(--text);
  font-family: inherit;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
}
.textarea-field:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-dim);
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  background: var(--danger);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  width: 100%;
  transition: all 0.15s;
}
.btn-danger:hover { filter: brightness(1.1); }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>

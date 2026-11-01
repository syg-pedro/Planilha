<template>
  <div class="space-y-4">
    <UAlert v-if="settingsNotice" color="info" variant="soft" :description="settingsNotice" />
    <UTabs v-model="activeSettingsTab" :items="settingsTabs" :unmount-on-hide="false" size="sm" class="w-full">
      <template #preferences>
        <div id="preferencias" class="space-y-4 pt-3">
          <UCard :title="profileName" :description="profileSub"><UAvatar :text="profileInitials" size="lg" /></UCard>
          <UCard title="Aparência" description="Temas prontos, com cores, fontes e ícones combinando.">
            <div class="space-y-5">
              <UAlert v-if="themeError" color="error" variant="subtle" :description="themeError" />
              <div><p class="mb-2 text-sm font-medium text-highlighted">Modo de exibição</p><div class="flex flex-wrap gap-2"><BaseButton v-for="theme in THEMES" :key="theme.id" :variant="store.settings.themeMode === theme.id ? 'primary' : 'secondary'" :disabled="themeBusy" :aria-pressed="store.settings.themeMode === theme.id" @click="onThemeModeChange(theme.id)">{{ theme.name }}</BaseButton></div><p class="mt-2 text-xs text-muted">{{ activeThemeDesc }}</p></div>
              <UFormField label="Tema" help="Escolha uma aparência pronta; dá para ajustar cores e fonte abaixo."><USelectMenu :model-value="uiTheme.preset" :items="themePresetOptions" value-key="id" :disabled="themeBusy" :search-input="{ placeholder: 'Buscar preset ou fonte...' }" :filter-fields="['label', 'description']" class="w-full sm:max-w-sm" :ui="{ base: 'finance-control' }" @update:model-value="selectPreset"><template #leading><span class="size-4 rounded-full ring-1 ring-inset ring-default" :style="{ background: themePresetOptions.find(item => item.id === uiTheme.preset)?.swatch }" /></template><template #item-leading="{ item }"><span class="size-7 shrink-0 rounded-full ring-1 ring-inset ring-default" :style="{ background: item.swatch }" /></template></USelectMenu></UFormField>
              <UCollapsible v-model:open="themeOptionsOpen"><BaseButton variant="ghost" class="w-full justify-between">Personalizar cores, fonte e ícones<BaseIcon name="chevron_down" :size="16" /></BaseButton><template #content><div class="space-y-4 pt-4">
              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><BaseDropdown v-for="alias in UI_COLOR_ALIASES" :key="alias" :model-value="resolvedTheme.colors[alias]" :label="COLOR_ALIAS_LABELS[alias]" :disabled="themeBusy" @update:model-value="setThemeColor(alias, String($event))"><option v-for="palette in alias === 'neutral' ? UI_NEUTRAL_PALETTES : UI_THEME_PALETTES" :key="palette" :value="palette">{{ palette }}</option></BaseDropdown></div>
              <div class="grid gap-3 sm:grid-cols-3"><BaseDropdown :model-value="resolvedTheme.font.sans" label="Fonte" :disabled="themeBusy" @update:model-value="changeUiTheme({ ...uiTheme, font: String($event) })"><option v-for="font in UI_THEME_FONTS" :key="font" :value="font">{{ font }}</option></BaseDropdown><BaseDropdown :model-value="resolvedTheme.icons" label="Ícones" :disabled="themeBusy" @update:model-value="setThemeIcons(String($event))"><option v-for="icons in UI_ICON_SETS" :key="icons" :value="icons">{{ ICON_SET_LABELS[icons] }}</option></BaseDropdown><BaseDropdown :model-value="String(resolvedTheme.radius)" label="Arredondamento" :disabled="themeBusy" @update:model-value="changeUiTheme({ ...uiTheme, radius: Number($event) })"><option v-for="radius in radiusOptions" :key="radius" :value="String(radius)">{{ radius }} rem</option></BaseDropdown></div>
              <div class="flex flex-wrap items-center justify-between gap-3"><p class="text-xs text-muted">Aplicação imediata. As preferências são salvas nesta conta.</p><BaseButton variant="ghost" :disabled="themeBusy" @click="changeUiTheme({ version: 1, preset: uiTheme.preset })">Restaurar preset</BaseButton></div></div></template></UCollapsible>
            </div>
          </UCard>
          <UCard title="Preferências"><div class="space-y-4"><div class="flex items-center justify-between gap-3 text-sm"><span class="text-muted">Moeda</span><strong class="font-medium text-highlighted">{{ currencyLabel }}</strong></div><div class="flex flex-wrap items-end justify-between gap-3"><div><p class="text-sm font-medium text-highlighted">Lembretes de vencimento</p><p class="mt-1 text-xs text-muted">No Android, os avisos são agendados no horário escolhido.</p></div><div class="flex items-end gap-2"><BaseInput v-model="store.settings.notificationTime" type="time" label="Horário" class="w-32" /><BaseButton :loading="reminderSaving" @click="saveReminderTime">Salvar</BaseButton></div></div></div></UCard>
          <UCard title="Indicadores do Resumo"><div class="space-y-4"><BaseDropdown v-model="store.settings.periodMode" label="Critério das datas"><option value="due_date">Por vencimento</option><option value="competence">Por competência</option></BaseDropdown><USwitch v-for="widget in WIDGETS" :key="widget.id" :model-value="isWidgetOn(widget.id)" :label="widget.label" @update:model-value="toggleWidget(widget.id)" /></div><template #footer><BaseButton @click="saveDashboard">Salvar configurações</BaseButton></template></UCard>
          <UCard>
            <UAccordion :items="colorAccordionItems" :unmount-on-hide="false">
              <template #colors-body>
                <div class="space-y-4">
                  <UAlert v-if="isCustomActive" color="success" variant="subtle" description="As cores personalizadas estão ativas." />
                  <p class="text-xs text-muted">Escolha as cores de destaque sobre uma base e confira a prévia antes de aplicar.</p>
                  <div class="flex flex-wrap gap-2"><BaseButton v-for="base in BASE_OPTIONS" :key="base.id" :variant="customDraft.base === base.id ? 'primary' : 'secondary'" :aria-pressed="customDraft.base === base.id" @click="customDraft.base = base.id">{{ base.label }}</BaseButton></div>
                  <div class="grid gap-3 sm:grid-cols-2"><div v-for="field in COLOR_FIELDS" :key="field.key" class="flex items-end gap-2"><BaseInput v-model="customDraft[field.key]" type="color" :label="field.label" class="w-16" /><BaseInput v-model="customDraft[field.key]" :aria-label="`${field.label} em hexadecimal`" :spellcheck="false" class="min-w-0 flex-1" /></div></div>
                  <UCard class="theme-preview" :style="previewVars" title="Pré-visualização" description="Exemplo de aparência; os valores são ilustrativos."><div class="flex items-center justify-between gap-3"><span class="text-sm">Sobra prevista</span><strong class="font-semibold tabular-nums" style="color: var(--pv-positive)">R$ 3.100,00</strong></div><div class="mt-3 flex flex-wrap gap-2"><UBadge variant="subtle">Destaque</UBadge><UBadge color="success" variant="subtle">Recebido</UBadge><UBadge color="error" variant="subtle">Despesa</UBadge></div></UCard>
                  <div class="flex flex-wrap justify-end gap-2"><BaseButton variant="ghost" :disabled="themeBusy" @click="resetCustom">Restaurar</BaseButton><BaseButton :loading="modeSaving" :disabled="themeBusy" @click="applyCustom">Aplicar cores</BaseButton></div>
                </div>
              </template>
            </UAccordion>
          </UCard>
          <UCard v-if="!isNativePlatform && !$pwaInstalled" title="Instalar aplicativo" description="Acesso rápido à Planilha e uso offline."><div class="flex items-center gap-3"><img src="/icon-192-v2.png" alt="" class="size-12 rounded-lg" /><BaseButton @click="installPwa">{{ $pwaPrompt ? 'Instalar agora' : 'Como instalar' }}</BaseButton></div></UCard>
        </div>
      </template>
      <template #sharing>
        <div id="compartilhamento" class="space-y-4 pt-3">
          <UCard v-if="isSupabaseConfigured" title="Compartilhamento" description="Gerencie quem tem acesso aos seus dados financeiros.">
            <div v-if="householdLoading" class="space-y-3"><USkeleton class="h-10 w-full" /><USkeleton class="h-10 w-full" /></div>
            <div v-else class="divide-y divide-default"><div v-for="member in members" :key="member.userId" class="flex items-center gap-3 py-3"><UAvatar :text="member.email[0]?.toUpperCase()" /><div class="min-w-0 flex-1"><p class="truncate text-sm font-medium text-highlighted">{{ member.email }}</p><p class="text-xs text-muted">{{ member.role === 'owner' ? 'Proprietário' : 'Membro' }}</p></div></div></div>
            <div v-for="invite in pendingInvites" :key="invite.id" class="flex flex-wrap items-center justify-between gap-3 border-t border-default py-3"><div><p class="text-sm text-highlighted">{{ invite.email }}</p><p class="text-xs text-muted">Expira {{ fmtDate(invite.expiresAt) }}</p></div><UBadge color="warning" variant="subtle">Aguardando</UBadge></div>
            <div class="mt-4 flex flex-wrap items-end gap-2"><BaseInput v-model="inviteEmail" type="email" label="Convidar por e-mail" placeholder="email@exemplo.com" class="min-w-0 flex-1" @keydown.enter="sendInvite" /><BaseButton :loading="inviteSending" :disabled="!inviteEmail" @click="sendInvite">Convidar</BaseButton></div>
            <UAlert v-if="inviteError" class="mt-3" color="error" variant="soft" :description="inviteError" />
            <UAlert v-if="inviteLink" class="mt-3" color="success" variant="subtle" title="Convite gerado"><template #description><code class="break-all text-xs">{{ inviteLink }}</code></template><template #actions><BaseButton variant="ghost" @click="copyInviteLink">{{ linkCopied ? 'Copiado!' : 'Copiar link' }}</BaseButton></template></UAlert>
          </UCard>
          <UAlert v-else color="info" variant="subtle" title="Compartilhamento indisponível" description="O compartilhamento está disponível quando a sincronização da conta está configurada." />
        </div>
      </template>
      <template #data>
        <div id="dados" class="space-y-4 pt-3">
          <UCard title="Importar CSV" description="Cabeçalhos aceitos: date, amount, title."><div class="space-y-4"><BaseTextarea v-model="csvText" label="Conteúdo do arquivo CSV" :rows="5" placeholder="date,amount,title&#10;2026-05-25,120.50,Supermercado" /><BaseDropdown v-model="importAccountId" label="Conta destino"><option value="">Sem conta</option><option v-for="account in store.accounts" :key="account.id" :value="account.id">{{ account.name }}</option></BaseDropdown></div><template #footer><BaseButton :disabled="!csvText.trim()" @click="runImport">Importar CSV</BaseButton></template></UCard>
          <UCard title="Contas cadastradas" :ui="{ body: 'divide-y divide-default py-0 sm:py-0' }"><div v-for="account in store.accounts" :key="account.id" class="flex flex-wrap items-center justify-between gap-3 py-3"><div><p class="text-sm font-medium text-highlighted">{{ account.name }}</p><p class="text-xs text-muted">{{ accountTypeLabel(account.type) }}<template v-if="account.limitTotal != null"> · Limite {{ currency.format(account.limitTotal) }}</template></p></div><UBadge v-if="account.active === false" color="neutral" variant="subtle">Inativo</UBadge></div></UCard>
          <UCard><UAccordion :items="maintenanceAccordionItems"><template #maintenance-body><div class="space-y-4"><UAlert color="warning" variant="subtle" title="Restaurar dados iniciais" description="Apaga todos os lançamentos e recria a partir do dados.txt. Use apenas quando precisar reiniciar os dados." /><BaseButton variant="danger" :loading="reseedBusy" @click="reseedConfirm = true">Restaurar dados iniciais</BaseButton></div></template></UAccordion></UCard>
        </div>
      </template>
    </UTabs>
    <UCard title="Ajuda e novidades"><div class="flex flex-wrap gap-2"><BaseButton v-for="item in SETTINGS_SHORTCUTS" :key="item.id" variant="ghost" :title="item.description" @click="goToShortcut(item.id)"><BaseIcon :name="item.icon" :size="16" /> {{ item.label }}</BaseButton></div></UCard>
    <BaseButton variant="ghost" :loading="signingOut" @click="doSignOut">Sair da conta</BaseButton>
    <BaseModal :open="reseedConfirm" :busy="reseedBusy" title="Restaurar dados iniciais?" @close="reseedConfirm = false"><UAlert color="error" variant="subtle" title="Todos os lançamentos serão substituídos" description="Os dados atuais serão apagados e recriados a partir do dados.txt. Esta operação não pode ser desfeita." /><template #footer><div class="flex w-full justify-end gap-2"><BaseButton variant="secondary" :disabled="reseedBusy" @click="reseedConfirm = false">Cancelar</BaseButton><BaseButton variant="danger" :loading="reseedBusy" @click="doReseed">Restaurar dados</BaseButton></div></template></BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { DEFAULT_COLORS, DARK_COLORS } from '#shared/constants'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { SETTINGS_SHORTCUT_ITEMS } from '~/features/finance/constants/ui'
import type { ThemeMode, Account } from '#shared/types'
import { normalizeUiTheme, resolveUiTheme, uiThemePaletteShade, UI_THEME_PRESETS, UI_COLOR_ALIASES, UI_ICON_SETS, UI_THEME_FONTS, UI_THEME_PALETTES, UI_NEUTRAL_PALETTES, type UiColorAlias, type UiIconSetId, type UiThemePreferences, type UiThemePresetId } from '#shared/uiTheme'

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
const reseedConfirm = ref(false)
const reminderSaving = ref(false)
const settingsNotice = ref('')

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
  { id: 'light', name: 'Claro', desc: 'Superfícies claras e destaques discretos', icon: '☀️' },
  { id: 'dark', name: 'Escuro', desc: 'Superfícies escuras e valores legíveis', icon: '🌙' },
] as const

const VALID_THEME_MODES = ['light', 'dark', 'system']

const activeSettingsTab = ref('preferences')
const settingsTabs = [{ label: 'Preferências', value: 'preferences', slot: 'preferences' as const }, { label: 'Compartilhamento', value: 'sharing', slot: 'sharing' as const }, { label: 'Dados', value: 'data', slot: 'data' as const }]
const colorAccordionItems = [{ label: 'Cores personalizadas', value: 'colors', slot: 'colors' as const }]
const maintenanceAccordionItems = [{ label: 'Manutenção avançada e recuperação', value: 'maintenance', slot: 'maintenance' as const }]
const WIDGETS = [{ id: 'kpis', label: 'Receitas, despesas e sobra prevista' }, { id: 'cashflow', label: 'Fluxo dos últimos 6 meses' }, { id: 'upcoming', label: 'Despesas pendentes por ciclo' }]
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

const themeError = ref('')
const themeOptionsOpen = ref(false)
const themePresetOptions = UI_THEME_PRESETS.map(preset => { const theme = resolveUiTheme({ preset: preset.id }); return { id: preset.id, label: preset.name, description: theme.font.sans, swatch: theme.blackAsPrimary ? 'var(--ui-text-highlighted)' : uiThemePaletteShade(theme.colors.primary) } })
const selectPreset = (id: string) => changeUiTheme({ version: 1, preset: id as UiThemePresetId })
const modeSaving = ref(false)
const themeBusy = computed(() => modeSaving.value || store.uiThemeSaving)
const uiTheme = computed(() => normalizeUiTheme(store.settings.dashboardConfig.uiTheme))
const resolvedTheme = computed(() => resolveUiTheme(uiTheme.value))
const radiusOptions = computed(() => [...new Set([0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 1, resolvedTheme.value.radius])].sort((a, b) => a - b))
const COLOR_ALIAS_LABELS: Record<UiColorAlias, string> = { primary: 'Primária', secondary: 'Secundária', success: 'Sucesso', info: 'Informação', warning: 'Aviso', error: 'Erro', neutral: 'Neutra' }
const ICON_SET_LABELS: Record<UiIconSetId, string> = { lucide: 'Lucide', bootstrap: 'Bootstrap', heroicons: 'Heroicons', iconoir: 'Iconoir', material: 'Material Symbols', phosphor: 'Phosphor', remix: 'Remix', tabler: 'Tabler' }
const onThemeModeChange = async (value: string) => {
  if (!VALID_THEME_MODES.includes(value) || themeBusy.value) return
  themeError.value = ''
  const previous = { mode: store.settings.themeMode, colors: { ...store.settings.colorTokens } }
  modeSaving.value = true
  store.setThemeMode(value as ThemeMode)
  try { await store.saveTheme() }
  catch {
    store.settings.themeMode = previous.mode
    store.settings.colorTokens = previous.colors
    store.applyTheme()
    themeError.value = 'Não foi possível salvar o modo. A aparência anterior foi restaurada.'
  } finally { modeSaving.value = false }
}
const changeUiTheme = async (preferences: UiThemePreferences) => {
  if (themeBusy.value) return
  themeError.value = ''
  try { await store.saveUiTheme(preferences) }
  catch (cause) {
    themeError.value = cause instanceof Error && cause.message.includes('restauração no servidor')
      ? cause.message
      : 'Não foi possível salvar a aparência. O tema anterior foi restaurado.'
  }
}
const setThemeColor = (alias: UiColorAlias, color: string) => changeUiTheme({ ...uiTheme.value, colors: { ...uiTheme.value.colors, [alias]: color } })
const setThemeIcons = (icons: string) => changeUiTheme({ ...uiTheme.value, icons: icons as UiIconSetId })

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
const profileInitials = computed(() => initialsOf(authUser.value?.email ?? 'Planilha'))
const profileSub = computed(() => isSupabaseConfigured.value ? 'Família · sincronizado' : 'Família · só neste aparelho')

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
  primary: DARK_COLORS.primary,
  accent: DARK_COLORS.accent,
  positive: DARK_COLORS.positive,
  negative: DARK_COLORS.negative,
})

const isCustomActive = computed(() => store.settings.themeMode === 'custom')

// Paleta estrutural do preview conforme a base escolhida.
const PREVIEW_BASE = {
  light: { bg: 'var(--color-slate-50)', card: 'white', text: 'var(--color-slate-900)', muted: 'var(--color-slate-500)', border: 'var(--color-slate-200)' },
  dark: { bg: 'var(--color-slate-900)', card: 'var(--color-slate-800)', text: 'white', muted: 'var(--color-slate-400)', border: 'var(--color-slate-700)' },
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
  if (themeBusy.value) return
  const previous = { mode: store.settings.themeMode, colors: { ...store.settings.colorTokens } }
  const base = customDraft.value.base === 'light' ? DEFAULT_COLORS : DARK_COLORS
  if (COLOR_FIELDS.some(field => !/^#[0-9a-f]{6}$/i.test(customDraft.value[field.key]))) { themeError.value = 'Use cores hexadecimais válidas com seis dígitos.'; return }
  themeError.value = ''
  modeSaving.value = true
  store.settings.themeMode = 'custom'
  store.settings.colorTokens = { ...base, primary: customDraft.value.primary, accent: customDraft.value.accent, positive: customDraft.value.positive, negative: customDraft.value.negative }
  store.applyTheme()
  try { await store.saveTheme() }
  catch {
    store.settings.themeMode = previous.mode
    store.settings.colorTokens = previous.colors
    store.applyTheme()
    themeError.value = 'Não foi possível salvar as cores. A aparência anterior foi restaurada.'
  } finally { modeSaving.value = false }
}

const toggleWidget = (id: string) => {
  const next = new Set(store.settings.dashboardConfig.visibleWidgets)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  store.settings.dashboardConfig.visibleWidgets = [...next]
}

const saveDashboard = async () => {
  store.filters.periodMode = store.settings.periodMode
  settingsNotice.value = ''
  try {
    await store.saveDashboard()
    settingsNotice.value = 'Preferências do Resumo salvas.'
  } catch { settingsNotice.value = 'Não foi possível salvar as preferências. Tente novamente.' }
}

const runImport = async () => {
  if (!csvText.value.trim()) return
  await store.importCsv(csvText.value, importAccountId.value || null)
  csvText.value = ''
}

const doReseed = async () => {
  reseedBusy.value = true
  try {
    await store.reseedEntries()
    reseedConfirm.value = false
  } finally {
    reseedBusy.value = false
  }
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
.theme-preview { --ui-primary: var(--pv-primary); --ui-success: var(--pv-positive); --ui-error: var(--pv-negative); --ui-bg: var(--pv-card); --ui-text: var(--pv-text); --ui-text-highlighted: var(--pv-text); --ui-text-muted: var(--pv-muted); --ui-border: var(--pv-border); }
</style>

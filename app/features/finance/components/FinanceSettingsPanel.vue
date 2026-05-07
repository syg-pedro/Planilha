<template>
  <section class="grid gap-4 xl:grid-cols-2">
    <BasePanel title="Tema e cores">
      <div class="grid gap-3 md:grid-cols-2">
        <BaseSelect :model-value="store.settings.themeMode" label="Modo" @update:model-value="onThemeModeChange">
          <option value="light">Light suave</option>
          <option value="dark">Dark profissional</option>
          <option value="eva_01">EVA-01</option>
        </BaseSelect>

        <BaseSelect v-model="store.settings.densityMode" label="Densidade">
          <option value="compact">Compacta</option>
          <option value="comfortable">Confortavel</option>
        </BaseSelect>
      </div>

      <div class="mt-3 grid gap-2 md:grid-cols-2">
        <label
          v-for="token in colorTokens"
          :key="token.key"
          class="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
          :style="{ borderColor: 'var(--ds-color-border-default)' }"
        >
          <span>{{ token.label }}</span>
          <input v-model="store.settings.colorTokens[token.key]" type="color" class="h-8 w-10 cursor-pointer border-0 bg-transparent" />
        </label>
      </div>

      <div class="mt-4">
        <BaseButton variant="primary" @click="saveTheme">Salvar tema</BaseButton>
      </div>
    </BasePanel>

    <BasePanel title="Dashboard e periodo">
      <div class="grid gap-3 md:grid-cols-2">
        <BaseSelect v-model="store.settings.dashboardConfig.defaultRange" label="Faixa padrao">
          <option value="month">Mensal</option>
          <option value="quarter">3 meses</option>
          <option value="year">Anual</option>
        </BaseSelect>

        <BaseSelect v-model="store.filters.periodMode" label="Regra de periodo">
          <option value="due_date">Vencimento</option>
          <option value="competence">Competencia</option>
        </BaseSelect>
      </div>

      <div class="mt-3 grid gap-2 md:grid-cols-2">
        <label
          v-for="widget in widgetOptions"
          :key="widget.id"
          class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          :style="{ borderColor: 'var(--ds-color-border-default)' }"
        >
          <input :checked="isWidgetOn(widget.id)" type="checkbox" @change="toggleWidget(widget.id, ($event.target as HTMLInputElement).checked)" />
          {{ widget.label }}
        </label>
      </div>

      <div class="mt-4">
        <BaseButton variant="primary" @click="saveDashboard">Salvar dashboard</BaseButton>
      </div>
    </BasePanel>

    <BasePanel
      title="Importar CSV"
      subtitle="Cabecalhos aceitos: date/data, amount/valor/value, title/descricao/description."
      class="xl:col-span-2"
    >
      <div class="grid gap-3 md:grid-cols-[1fr_auto]">
        <BaseTextarea
          v-model="csvText"
          :rows="6"
          placeholder="date,amount,title\n2026-05-25,120.50,Supermercado"
        />

        <div class="flex flex-col gap-2">
          <BaseSelect v-model="importAccountId" label="Conta destino">
            <option :value="''">Sem conta</option>
            <option v-for="account in store.accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
          </BaseSelect>

          <BaseButton variant="primary" @click="runImport">Importar CSV</BaseButton>
          <BaseButton variant="secondary" @click="triggerNotifications">Ativar notificacoes</BaseButton>
        </div>
      </div>
    </BasePanel>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { WIDGET_OPTIONS } from '#shared/constants'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import type { ThemeMode } from '#shared/types'

const store = useFinanceStore()
const csvText = ref('')
const importAccountId = ref('')
const widgetOptions = WIDGET_OPTIONS

const colorTokens: Array<{ key: keyof typeof store.settings.colorTokens; label: string }> = [
  { key: 'primary', label: 'Primaria' },
  { key: 'accent', label: 'Acento' },
  { key: 'positive', label: 'Positivo' },
  { key: 'negative', label: 'Negativo' },
  { key: 'neutral', label: 'Neutro' },
  { key: 'background', label: 'Fundo' },
  { key: 'card', label: 'Cards' }
]

const isWidgetOn = (id: string) => store.settings.dashboardConfig.visibleWidgets.includes(id)

const onThemeModeChange = (value: string) => {
  if (value === 'light' || value === 'dark' || value === 'eva_01') {
    store.setThemeMode(value as ThemeMode)
  }
}

const toggleWidget = (id: string, enabled: boolean) => {
  const next = new Set(store.settings.dashboardConfig.visibleWidgets)
  if (enabled) next.add(id)
  else next.delete(id)
  store.settings.dashboardConfig.visibleWidgets = [...next]
}

const saveTheme = async () => {
  await store.saveTheme()
}

const saveDashboard = async () => {
  await store.saveDashboard()
}

const runImport = async () => {
  if (!csvText.value.trim()) return
  await store.importCsv(csvText.value, importAccountId.value || null)
  csvText.value = ''
}

const triggerNotifications = async () => {
  await store.requestNotifications()
  store.notifyUpcoming()
}
</script>

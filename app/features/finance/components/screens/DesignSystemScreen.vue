<template>
  <div class="space-y-4">
    <UCard title="Interface Nuxt UI" description="Componentes oficiais, presets semânticos e campos compactos para registrar e acompanhar finanças."><p class="text-sm text-muted">O tema ativo é aplicado a todos os exemplos desta tela.</p></UCard>
    <UCard title="Princípios"><div class="grid gap-4 md:grid-cols-3"><div v-for="item in PRINCIPLES" :key="item.title"><h3 class="text-sm font-semibold text-highlighted">{{ item.title }}</h3><p class="mt-1 text-sm text-muted">{{ item.body }}</p></div></div></UCard>
    <UCard title="Paleta semântica"><div class="grid grid-cols-2 gap-4 sm:grid-cols-4"><div v-for="color in COLORS" :key="color.name"><div class="mb-2 h-14 rounded ring-1 ring-default" :style="{ background: `var(${color.variable})` }" /><p class="text-sm font-medium text-highlighted">{{ color.name }}</p><code class="text-xs text-muted">{{ color.variable }}</code></div></div></UCard>
    <UCard title="Ações e estados"><div class="space-y-4"><div class="flex flex-wrap gap-2"><BaseButton>Salvar alterações</BaseButton><BaseButton variant="secondary">Cancelar</BaseButton><BaseButton variant="ghost">Ação discreta</BaseButton><BaseButton variant="danger">Excluir</BaseButton><BaseButton loading>Salvando</BaseButton></div><div class="flex flex-wrap gap-2"><BaseBadge tone="success">Pago</BaseBadge><BaseBadge tone="warning">Atenção</BaseBadge><BaseBadge tone="neutral">Pendente</BaseBadge><UBadge color="error">Urgente</UBadge><UBadge>Automático</UBadge></div></div></UCard>
    <UCard title="Campos"><div class="grid items-start gap-4 md:grid-cols-2"><BaseInput v-model="demoText" label="Descrição" hint="32 px no computador; 38 px e texto de 16 px no celular." placeholder="Ex.: Supermercado" /><BaseInput v-model="demoInvalid" label="Valor com erro" type="number" error="Informe um valor válido." /><BaseInput model-value="Conta preenchida pelo contexto" label="Somente leitura" readonly /><BaseSelect v-model="demoKind" label="Tipo"><option value="expense">Despesa</option><option value="income">Receita</option></BaseSelect><BaseTextarea v-model="demoNote" label="Observação" :rows="3" /></div></UCard>
    <UCard title="Indicadores financeiros"><div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><BaseKpiCard icon="income" label="Receitas" value="R$ 3.900" color="var(--success)" :trend="3" /><BaseKpiCard icon="expense" label="Despesas" value="R$ 3.280" color="var(--danger)" :trend="-8" /><BaseKpiCard icon="balance" label="Saldo" value="R$ 620" color="var(--primary)" /><BaseKpiCard icon="alerts" label="Alertas" value="3 ativos" color="var(--warning)" :alert="true" /></div></UCard>
    <UCard title="Progresso e proporção"><div class="grid gap-5 md:grid-cols-2"><div class="space-y-4"><div v-for="item in PROGRESS_BARS" :key="item.label"><div class="mb-2 flex justify-between text-sm"><span>{{ item.label }}</span><strong>{{ item.value }}%</strong></div><BaseProgressBar :value="item.value" /></div></div><div class="flex flex-wrap items-center justify-around gap-4"><div v-for="item in DONUTS" :key="item.label" class="space-y-2 text-center text-sm text-muted"><BaseDonutRing :percent="item.value" :color="item.color" :size="72" :stroke="8" :label="`${item.value}%`" /><p>{{ item.label }}</p></div></div></div></UCard>
    <UCard title="Movimento e feedback"><UCollapsible v-model:open="motionOpen"><BaseButton variant="secondary">{{ motionOpen ? 'Recolher exemplo' : 'Abrir exemplo' }}</BaseButton><template #content><UAlert class="mt-3" color="info" variant="subtle" description="Informação disponível. Valores permanecem estáveis durante a leitura." /></template></UCollapsible><p class="mt-3 text-sm text-muted">Transições seguem os componentes oficiais e respeitam movimento reduzido.</p></UCard>
    <UCard title="Iconografia"><div class="grid grid-cols-3 gap-4 sm:grid-cols-6"><div v-for="icon in ICONS" :key="icon" class="flex flex-col items-center gap-2 text-xs text-muted"><BaseIcon :name="icon" :size="22" /><span>{{ icon }}</span></div></div></UCard>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import BaseBadge from '~/components/base/BaseBadge.vue'
import BaseButton from '~/components/base/BaseButton.vue'
import BaseDonutRing from '~/components/base/BaseDonutRing.vue'
import BaseIcon from '~/components/base/BaseIcon.vue'
import BaseInput from '~/components/base/BaseInput.vue'
import BaseKpiCard from '~/components/base/BaseKpiCard.vue'
import BaseProgressBar from '~/components/base/BaseProgressBar.vue'
import BaseSelect from '~/components/base/BaseSelect.vue'
import BaseTextarea from '~/components/base/BaseTextarea.vue'

const demoText = ref('')
const demoInvalid = ref('')
const motionOpen = ref(false)
const demoKind = ref('expense')
const demoNote = ref('')

const PRINCIPLES = [
  { title: 'Uma tarefa por vez', body: 'Descrição, valor e vencimento primeiro; detalhes quando necessários.' },
  { title: 'Cor com função', body: 'Destaque reservado à ação, seleção e situação financeira.' },
  { title: 'Movimento discreto', body: 'Transições curtas explicam mudanças e respeitam movimento reduzido.' },
]

const COLORS = [
  { name: 'Primária', variable: '--primary' },
  { name: 'Destaque', variable: '--accent' },
  { name: 'Receita', variable: '--success' },
  { name: 'Despesa', variable: '--danger' },
  { name: 'Atenção', variable: '--warning' },
  { name: 'Superfície', variable: '--surface' },
  { name: 'Superfície 2', variable: '--surface2' },
  { name: 'Fundo', variable: '--bg' },
]

const PROGRESS_BARS = [
  { label: 'Saudável', value: 40 },
  { label: 'Atenção', value: 72 },
  { label: 'Crítico', value: 92 },
]

const DONUTS = [
  { label: 'Saudável', value: 62, color: 'var(--success)' },
  { label: 'Atenção', value: 78, color: 'var(--warning)' },
  { label: 'Crítico', value: 94, color: 'var(--danger)' },
]

const ICONS = [
  'dashboard', 'grid', 'calendar', 'settings', 'budget', 'goal', 'subscription',
  'debt', 'planning', 'reports', 'alerts', 'income', 'expense', 'balance',
  'pending', 'card', 'plus', 'edit', 'refresh', 'warning', 'sparkle', 'menu',
]
</script>

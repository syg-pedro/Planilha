<template>
  <div class="ds-screen">
    <header class="ds-hero">
      <div>
        <p class="ds-hero__eyebrow">Financeiro Familiar · UI v3</p>
        <h2 class="ds-hero__title">Neo-brutalismo funcional</h2>
        <p class="ds-hero__body">
          Contraste alto, bordas explícitas, sombras sólidas e hierarquia direta.
          A informação financeira continua sendo o elemento principal.
        </p>
      </div>
      <span class="ds-hero__stamp">BRUTAL<br>BY DESIGN</span>
    </header>

    <section class="ds-showcase">
      <header class="ds-showcase__header">
        <h3>Princípios</h3>
        <span>01</span>
      </header>
      <div class="ds-principles">
        <article v-for="item in PRINCIPLES" :key="item.title" class="ds-principle">
          <strong>{{ item.title }}</strong>
          <p>{{ item.body }}</p>
        </article>
      </div>
    </section>

    <section class="ds-showcase">
      <header class="ds-showcase__header">
        <h3>Paleta semântica</h3>
        <span>02</span>
      </header>
      <div class="ds-swatches">
        <div v-for="color in COLORS" :key="color.name" class="ds-swatch">
          <div class="ds-swatch__color" :style="{ background: `var(${color.variable})` }" />
          <strong>{{ color.name }}</strong>
          <code>{{ color.variable }}</code>
        </div>
      </div>
    </section>

    <section class="ds-showcase">
      <header class="ds-showcase__header">
        <h3>Ações e estados</h3>
        <span>03</span>
      </header>
      <div class="ds-showcase__body ds-stack">
        <div class="ds-row">
          <BaseButton variant="primary">Salvar alterações</BaseButton>
          <BaseButton variant="secondary">Cancelar</BaseButton>
          <BaseButton variant="ghost">Ação discreta</BaseButton>
          <BaseButton variant="danger">Excluir</BaseButton>
          <BaseButton variant="primary" loading>Salvando</BaseButton>
        </div>
        <div class="ds-row">
          <BaseBadge tone="success">Pago</BaseBadge>
          <BaseBadge tone="warning">Atenção</BaseBadge>
          <BaseBadge tone="neutral">Pendente</BaseBadge>
          <span class="ds-status ds-status--danger">Urgente</span>
          <span class="ds-status ds-status--primary">Automático</span>
        </div>
      </div>
    </section>

    <section class="ds-showcase">
      <header class="ds-showcase__header">
        <h3>Campos</h3>
        <span>04</span>
      </header>
      <div class="ds-showcase__body ds-fields">
        <BaseInput v-model="demoText" label="Descrição" placeholder="Ex.: Supermercado" />
        <BaseSelect v-model="demoKind" label="Tipo">
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </BaseSelect>
        <BaseTextarea v-model="demoNote" label="Observação" :rows="3" placeholder="Adicione contexto" />
      </div>
    </section>

    <section class="ds-showcase">
      <header class="ds-showcase__header">
        <h3>Indicadores financeiros</h3>
        <span>05</span>
      </header>
      <div class="ds-kpis">
        <BaseKpiCard icon="income" label="Receitas" value="R$ 3.900" color="var(--success)" :trend="3" />
        <BaseKpiCard icon="expense" label="Despesas" value="R$ 3.280" color="var(--danger)" :trend="-8" />
        <BaseKpiCard icon="balance" label="Saldo" value="R$ 620" color="var(--primary)" />
        <BaseKpiCard icon="alerts" label="Alertas" value="3 ativos" color="var(--warning)" :alert="true" />
      </div>
    </section>

    <section class="ds-showcase">
      <header class="ds-showcase__header">
        <h3>Progresso e proporção</h3>
        <span>06</span>
      </header>
      <div class="ds-showcase__body ds-metrics">
        <div class="ds-progress-list">
          <div v-for="item in PROGRESS_BARS" :key="item.label">
            <div class="ds-progress-label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}%</strong>
            </div>
            <BaseProgressBar :value="item.value" />
          </div>
        </div>
        <div class="ds-donuts">
          <div v-for="item in DONUTS" :key="item.label" class="ds-donut">
            <BaseDonutRing :percent="item.value" :color="item.color" :size="72" :stroke="8" :label="`${item.value}%`" />
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="ds-showcase">
      <header class="ds-showcase__header">
        <h3>Iconografia</h3>
        <span>07</span>
      </header>
      <div class="ds-icons">
        <div v-for="icon in ICONS" :key="icon" class="ds-icon">
          <BaseIcon :name="icon" :size="22" />
          <span>{{ icon }}</span>
        </div>
      </div>
    </section>
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
const demoKind = ref('expense')
const demoNote = ref('')

const PRINCIPLES = [
  { title: 'Estrutura visível', body: 'Bordas e sombras explicam agrupamento, camada e ação.' },
  { title: 'Cor com função', body: 'Paleta vibrante sem competir com valores, status e alertas.' },
  { title: 'Interação física', body: 'Pressionar reduz a sombra e desloca o elemento de forma previsível.' },
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

<style scoped>
.ds-screen {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.ds-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  background: var(--primary);
  border: 3px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  color: #ffffff;
}

.ds-hero__eyebrow {
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ds-hero__title {
  max-width: 720px;
  font-size: clamp(26px, 4vw, 46px);
  line-height: 0.98;
}

.ds-hero__body {
  max-width: 680px;
  margin-top: 12px;
  font-size: 14px;
  font-weight: 650;
}

.ds-hero__stamp {
  flex-shrink: 0;
  padding: 12px;
  background: var(--accent);
  border: 3px solid var(--border);
  box-shadow: 5px 5px 0 var(--ds-shadow-color);
  color: #111111;
  font-family: var(--ds-font-family-mono);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
  transform: rotate(5deg);
}

.ds-showcase {
  overflow: hidden;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.ds-showcase__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface2);
  border-bottom: 2px solid var(--border);
}

.ds-showcase__header h3 {
  font-size: 15px;
}

.ds-showcase__header span {
  font-family: var(--ds-font-family-mono);
  font-size: 11px;
  font-weight: 700;
}

.ds-showcase__body {
  padding: 18px;
}

.ds-principles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.ds-principle {
  min-height: 120px;
  padding: 18px;
  border-right: 2px solid var(--border);
}

.ds-principle:last-child {
  border-right: 0;
}

.ds-principle strong {
  font-size: 14px;
  font-weight: 800;
}

.ds-principle p {
  margin-top: 6px;
  color: var(--text2);
  font-size: 13px;
  font-weight: 600;
}

.ds-swatches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
}

.ds-swatch {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.ds-swatch__color {
  height: 54px;
  margin-bottom: 4px;
  border: 2px solid var(--border);
  box-shadow: 3px 3px 0 var(--ds-shadow-color);
}

.ds-swatch strong {
  font-size: 12px;
}

.ds-swatch code {
  color: var(--text3);
  font-size: 9px;
}

.ds-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.ds-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.ds-status {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border: 2px solid var(--border);
  border-radius: var(--radius-xs);
  box-shadow: 2px 2px 0 var(--ds-shadow-color);
  font-size: 11px;
  font-weight: 800;
}

.ds-status--danger {
  color: var(--danger);
  background: var(--danger-light);
}

.ds-status--primary {
  color: var(--text);
  background: var(--primary-dim);
}

.ds-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.ds-fields > :last-child {
  grid-column: 1 / -1;
}

.ds-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  padding: 18px;
}

.ds-metrics {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
  gap: 28px;
}

.ds-progress-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ds-progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
  font-size: 12px;
  font-weight: 700;
}

.ds-progress-label strong {
  font-family: var(--ds-font-family-mono);
}

.ds-donuts {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.ds-donut {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 700;
}

.ds-icons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
}

.ds-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 8px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.ds-icon span {
  color: var(--text3);
  font-family: var(--ds-font-family-mono);
  font-size: 9px;
}

@media (max-width: 700px) {
  .ds-hero {
    align-items: flex-start;
    padding: 20px;
  }

  .ds-hero__stamp {
    display: none;
  }

  .ds-principles,
  .ds-fields,
  .ds-metrics {
    grid-template-columns: 1fr;
  }

  .ds-principle {
    min-height: auto;
    border-right: 0;
    border-bottom: 2px solid var(--border);
  }

  .ds-principle:last-child {
    border-bottom: 0;
  }

  .ds-fields > :last-child {
    grid-column: auto;
  }
}
</style>

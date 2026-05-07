import type { Meta, StoryObj } from '@storybook/vue3'
import BasePanel from '../../app/components/base/BasePanel.vue'
import BaseBadge from '../../app/components/base/BaseBadge.vue'

const meta = {
  title: 'Base/BasePanel',
  component: BasePanel,
  tags: ['autodocs'],
  args: {
    title: 'Resumo mensal',
    subtitle: 'Comparativo de receitas e despesas',
    dense: false
  }
} satisfies Meta<typeof BasePanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { BasePanel },
    setup() {
      return { args }
    },
    template: `
      <div style="width: min(680px, 90vw);">
        <BasePanel v-bind="args">
          <p style="color: var(--ds-color-text-secondary);">Conteudo principal do card.</p>
        </BasePanel>
      </div>
    `
  })
}

export const WithHeaderSlot: Story = {
  render: (args) => ({
    components: { BasePanel, BaseBadge },
    setup() {
      return { args }
    },
    template: `
      <div style="width: min(680px, 90vw);">
        <BasePanel v-bind="args">
          <template #header>
            <BaseBadge tone="success">+12%</BaseBadge>
          </template>
          <p style="color: var(--ds-color-text-secondary);">Indicadores de desempenho do periodo.</p>
        </BasePanel>
      </div>
    `
  })
}

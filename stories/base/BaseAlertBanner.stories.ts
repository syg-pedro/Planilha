import type { Meta, StoryObj } from '@storybook/vue3'
import BaseAlertBanner from '../../app/components/base/BaseAlertBanner.vue'

const meta = {
  title: 'Base/BaseAlertBanner',
  component: BaseAlertBanner,
  tags: ['autodocs'],
  args: {
    alerts: [
      {
        tone: 'warning',
        title: 'Limite do cartão em 82%',
        body: 'Revise as próximas compras antes do fechamento.',
      },
    ],
  },
  decorators: [
    () => ({ template: '<div style="width: min(680px, 90vw)"><story /></div>' }),
  ],
} satisfies Meta<typeof BaseAlertBanner>

export default meta

type Story = StoryObj<typeof meta>

export const Warning: Story = {}

export const Multiple: Story = {
  args: {
    alerts: [
      { tone: 'danger', title: 'Fatura vence amanhã', body: 'Valor pendente de R$ 1.480,00.' },
      { tone: 'info', title: 'Nova projeção disponível', body: 'Confira os próximos seis meses.' },
    ],
  },
}

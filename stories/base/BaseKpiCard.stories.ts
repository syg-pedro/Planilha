import type { Meta, StoryObj } from '@storybook/vue3'
import BaseKpiCard from '../../app/components/base/BaseKpiCard.vue'

const meta = {
  title: 'Base/BaseKpiCard',
  component: BaseKpiCard,
  tags: ['autodocs'],
  args: {
    icon: 'balance',
    label: 'Saldo líquido',
    value: 'R$ 2.480,00',
    sub: 'Junho de 2026',
    color: 'var(--primary)',
    trend: 8,
    alert: false,
  },
  decorators: [
    () => ({ template: '<div style="width: 260px"><story /></div>' }),
  ],
} satisfies Meta<typeof BaseKpiCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Danger: Story = {
  args: {
    icon: 'expense',
    label: 'Despesas',
    value: 'R$ 4.120,00',
    color: 'var(--danger)',
    trend: -12,
    alert: true,
  },
}

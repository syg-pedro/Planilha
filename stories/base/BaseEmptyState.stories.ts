import type { Meta, StoryObj } from '@storybook/vue3'
import BaseEmptyState from '../../app/components/base/BaseEmptyState.vue'

const meta = {
  title: 'Base/BaseEmptyState',
  component: BaseEmptyState,
  tags: ['autodocs'],
  args: {
    icon: 'check',
    title: 'Tudo em dia',
    body: 'Nenhuma pendência foi encontrada para este período.',
  },
} satisfies Meta<typeof BaseEmptyState>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

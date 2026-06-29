import type { Meta, StoryObj } from '@storybook/vue3'
import BaseProgressBar from '../../app/components/base/BaseProgressBar.vue'

const meta = {
  title: 'Base/BaseProgressBar',
  component: BaseProgressBar,
  tags: ['autodocs'],
  args: {
    value: 62,
    max: 100,
    height: 12,
    animate: true,
  },
  decorators: [
    () => ({ template: '<div style="width: 360px"><story /></div>' }),
  ],
} satisfies Meta<typeof BaseProgressBar>

export default meta

type Story = StoryObj<typeof meta>

export const Healthy: Story = {}

export const Critical: Story = {
  args: { value: 94 },
}

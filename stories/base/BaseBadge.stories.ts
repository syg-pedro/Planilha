import type { Meta, StoryObj } from '@storybook/vue3'
import BaseBadge from '../../app/components/base/BaseBadge.vue'

const meta = {
  title: 'Base/BaseBadge',
  component: BaseBadge,
  tags: ['autodocs'],
  args: {
    tone: 'neutral'
  },
  argTypes: {
    tone: {
      control: 'radio',
      options: ['success', 'warning', 'neutral']
    }
  }
} satisfies Meta<typeof BaseBadge>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => ({
    components: { BaseBadge },
    setup() {
      return { args }
    },
    template: '<BaseBadge v-bind="args">Status</BaseBadge>'
  })
}

import type { Meta, StoryObj } from '@storybook/vue3'
import BaseButton from '../../app/components/base/BaseButton.vue'

const meta = {
  title: 'Base/BaseButton',
  component: BaseButton,
  tags: ['autodocs'],
  args: {
    variant: 'primary',
    size: 'md',
    block: false,
    loading: false,
    disabled: false
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['primary', 'secondary', 'ghost', 'danger']
    },
    size: {
      control: 'radio',
      options: ['sm', 'md']
    }
  }
} satisfies Meta<typeof BaseButton>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => ({
    components: { BaseButton },
    setup() {
      return { args }
    },
    template: '<BaseButton v-bind="args">Salvar</BaseButton>'
  })
}

export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true
  },
  render: (args) => ({
    components: { BaseButton },
    setup() {
      return { args }
    },
    template: '<BaseButton v-bind="args">Processando...</BaseButton>'
  })
}

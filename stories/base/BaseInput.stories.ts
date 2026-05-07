import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseInput from '../../app/components/base/BaseInput.vue'

const meta = {
  title: 'Base/BaseInput',
  component: BaseInput,
  tags: ['autodocs'],
  args: {
    label: 'Descricao',
    modelValue: 'Mercado',
    placeholder: 'Digite o valor',
    type: 'text'
  }
} satisfies Meta<typeof BaseInput>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { BaseInput },
    setup() {
      const value = ref(args.modelValue)
      return { args, value }
    },
    template: `
      <div style="width: min(480px, 90vw);">
        <BaseInput v-model="value" :label="args.label" :placeholder="args.placeholder" :type="args.type" />
      </div>
    `
  })
}

import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseSelect from '../../app/components/base/BaseSelect.vue'

const meta = {
  title: 'Base/BaseSelect',
  component: BaseSelect,
  tags: ['autodocs'],
  args: {
    label: 'Conta',
    modelValue: 'conta-corrente'
  }
} satisfies Meta<typeof BaseSelect>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { BaseSelect },
    setup() {
      const value = ref(args.modelValue)
      return { args, value }
    },
    template: `
      <div style="width: min(480px, 90vw);">
        <BaseSelect v-model="value" :label="args.label">
          <option value="conta-corrente">Conta corrente</option>
          <option value="cartao-1">Cartao principal</option>
          <option value="cartao-2">Cartao secundario</option>
        </BaseSelect>
      </div>
    `
  })
}

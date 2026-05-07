import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseTextarea from '../../app/components/base/BaseTextarea.vue'

const meta = {
  title: 'Base/BaseTextarea',
  component: BaseTextarea,
  tags: ['autodocs'],
  args: {
    label: 'Observacoes',
    modelValue: 'Pagamento parcelado em 3x',
    placeholder: 'Adicione uma observacao',
    rows: 4
  }
} satisfies Meta<typeof BaseTextarea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { BaseTextarea },
    setup() {
      const value = ref(args.modelValue)
      return { args, value }
    },
    template: `
      <div style="width: min(480px, 90vw);">
        <BaseTextarea v-model="value" :label="args.label" :placeholder="args.placeholder" :rows="args.rows" />
      </div>
    `
  })
}

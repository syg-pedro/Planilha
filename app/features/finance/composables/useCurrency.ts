import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'

export const useCurrency = () => {
  const store = useFinanceStore()
  return {
    format(value: number) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: store.settings.currency || 'BRL'
      }).format(value)
    }
  }
}

import { computed, watch } from 'vue'
import { civilDate } from '#shared/period'

export const useMonthNavigation = (months: () => string[], timezone: () => string) => {
  const route = useRoute()
  const router = useRouter()
  const currentMonth = civilDate(new Date(), timezone()).slice(0, 7)
  const selectedMonth = computed({
    get: () => typeof route.query.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(route.query.month) ? route.query.month : currentMonth,
    set: month => { void router.replace({ query: { ...route.query, month } }) },
  })
  const selectedMonthIndex = computed(() => months().indexOf(selectedMonth.value))
  const move = (offset: number) => {
    const next = months()[selectedMonthIndex.value + offset]
    if (next) selectedMonth.value = next
  }
  watch(months, values => {
    if (!values.includes(selectedMonth.value) && values.length) selectedMonth.value = currentMonth
  }, { immediate: true })
  return { currentMonth, selectedMonth, selectedMonthIndex, prevMonth: () => move(-1), nextMonth: () => move(1) }
}

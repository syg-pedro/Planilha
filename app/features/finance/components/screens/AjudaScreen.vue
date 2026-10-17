<template>
  <section class="mx-auto grid w-full max-w-4xl gap-4" aria-labelledby="help-title">
    <header class="space-y-2">
      <h2 id="help-title" class="flex items-center gap-2 text-xl font-semibold text-highlighted"><UIcon name="i-lucide-circle-help" class="size-5 text-primary" />Central de Ajuda</h2>
      <p class="text-sm text-muted">Tutoriais passo a passo para cada ação do aplicativo. Use a busca ou navegue pelas seções.</p>
    </header>
    <BaseInput v-model="search" type="search" aria-label="Buscar na central de ajuda" placeholder="Buscar ajuda: pagamento, filtros, organizar linhas..." />
    <UAlert v-if="!filteredGroups.length" title="Nenhum tutorial encontrado" :description="`Não encontramos nada para “${search}”. Tente outros termos.`" color="neutral" variant="soft" icon="i-lucide-search" />
    <UCard v-for="group in filteredGroups" :id="`help-group-${group.screenId}`" :key="group.screenId" as="section">
      <template #header>
        <h3 class="font-semibold text-highlighted">{{ group.label }}</h3>
        <p v-if="group.intro" class="mt-1 text-sm text-muted">{{ group.intro }}</p>
      </template>
      <UAccordion :items="accordionItems(group)" :model-value="openTopics(group)" type="multiple" :ui="{ trigger: 'min-h-11 py-3 text-sm', body: 'space-y-3 text-sm' }" @update:model-value="setOpenTopics(group, $event)">
        <template #default="{ item }"><span :id="`help-topic-${group.screenId}-${item.id}`">{{ item.label }}</span></template>
        <template #body="{ item }">
          <ol class="space-y-3">
            <li v-for="(step, index) in item.steps" :key="index" class="flex items-start gap-3 text-default"><UBadge :label="index + 1" color="neutral" variant="soft" class="shrink-0" /><span>{{ step.text }}</span></li>
          </ol>
          <UAlert v-if="item.tip" :description="item.tip" icon="i-lucide-info" color="info" variant="soft" />
        </template>
      </UAccordion>
    </UCard>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onDeactivated, ref, watch } from 'vue'
import BaseInput from '~/components/base/BaseInput.vue'
import { HELP_CONTENT, type HelpGroup } from '~/features/finance/constants/helpContent'

interface HelpFocus { screenId: string; topicId?: string }
const search = ref('')
const expandedIds = ref<string[]>([])
const isActive = ref(false)
const helpFocus = useState<HelpFocus | null>('help-focus', () => null)
const normalized = computed(() => search.value.trim().toLowerCase())
const filteredGroups = computed(() => {
  const q = normalized.value
  if (!q) return HELP_CONTENT
  return HELP_CONTENT.map(group => ({
    ...group,
    topics: group.topics.filter(topic => topic.title.toLowerCase().includes(q) || topic.steps.some(step => step.text.toLowerCase().includes(q)) || (topic.tip?.toLowerCase().includes(q) ?? false)),
  })).filter(group => group.topics.length)
})
const accordionItems = (group: HelpGroup) => group.topics.map(topic => ({ ...topic, label: topic.title, value: topic.id }))
const openTopics = (group: HelpGroup) => group.topics.filter(topic => normalized.value || expandedIds.value.includes(topic.id)).map(topic => topic.id)
function setOpenTopics(group: HelpGroup, value: string | string[] | undefined) {
  if (normalized.value) return
  const ids = new Set(group.topics.map(topic => topic.id))
  const next = typeof value === 'string' ? [value] : value ?? []
  expandedIds.value = [...expandedIds.value.filter(id => !ids.has(id)), ...next.filter(id => ids.has(id))]
}
function focusHelp() {
  const focus = helpFocus.value
  if (!focus) return
  search.value = ''
  if (focus.topicId && !expandedIds.value.includes(focus.topicId)) expandedIds.value.push(focus.topicId)
  void nextTick(() => {
    const target = focus.topicId ? `help-topic-${focus.screenId}-${focus.topicId}` : `help-group-${focus.screenId}`
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
  helpFocus.value = null
}
onActivated(() => { isActive.value = true; focusHelp() })
onDeactivated(() => { isActive.value = false })
watch(helpFocus, () => { if (isActive.value) focusHelp() })
</script>

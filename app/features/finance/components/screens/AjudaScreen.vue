<template>
  <div style="display: flex; flex-direction: column; gap: 16px; max-width: 860px; margin: 0 auto; width: 100%">

    <!-- Cabeçalho -->
    <div>
      <h2 style="font-size: 20px; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 10px">
        <span style="display: inline-flex; width: 34px; height: 34px; border-radius: 10px; background: var(--primary-dim); align-items: center; justify-content: center">
          <BaseIcon name="help" :size="19" color="var(--primary)" />
        </span>
        Central de Ajuda
      </h2>
      <p style="font-size: 13px; color: var(--text3); margin-top: 6px">
        Tutoriais passo a passo para cada ação do aplicativo. Use a busca ou navegue pelas seções.
      </p>
    </div>

    <!-- Busca -->
    <div
      :style="{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
        padding: '0 14px', height: '44px',
        border: searchFocused ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
        boxShadow: searchFocused ? '0 0 0 3px var(--primary-dim)' : 'none',
        transition: 'border-color .15s, box-shadow .15s',
      }"
    >
      <BaseIcon name="search" :size="16" color="var(--text3)" />
      <input
        v-model="search"
        type="text"
        placeholder="Buscar ajuda... (ex.: marcar pago, excluir coluna)"
        style="flex: 1; background: transparent; border: none; outline: none; font-size: 14px; color: var(--text); font-family: inherit"
        @focus="searchFocused = true"
        @blur="searchFocused = false"
      />
      <button
        v-if="search"
        style="display: inline-flex; background: none; border: none; cursor: pointer; color: var(--text3); padding: 4px"
        title="Limpar busca"
        @click="search = ''"
      >
        <BaseIcon name="close" :size="15" />
      </button>
    </div>

    <!-- Sem resultados -->
    <BaseEmptyState
      v-if="filteredGroups.length === 0"
      icon="search"
      title="Nenhum tutorial encontrado"
      :body="`Não encontramos nada para “${search}”. Tente outros termos.`"
    />

    <!-- Grupos -->
    <section
      v-for="group in filteredGroups"
      :id="`help-group-${group.screenId}`"
      :key="group.screenId"
      class="help-group"
    >
      <header class="help-group__head">
        <span class="help-group__icon">
          <BaseIcon :name="group.icon" :size="17" color="var(--primary)" />
        </span>
        <div>
          <h3 class="help-group__title">{{ group.label }}</h3>
          <p v-if="group.intro" class="help-group__intro">{{ group.intro }}</p>
        </div>
      </header>

      <div class="help-topics">
        <div
          v-for="topic in group.topics"
          :id="`help-topic-${group.screenId}-${topic.id}`"
          :key="topic.id"
          class="help-topic"
        >
          <button class="help-topic__btn" @click="toggle(topic.id)">
            <span :class="['help-topic__chevron', { 'help-topic__chevron--open': isOpen(topic.id) }]">
              <BaseIcon name="chevron_right" :size="15" />
            </span>
            <span class="help-topic__title">{{ topic.title }}</span>
          </button>

          <Transition name="help-expand">
            <div v-if="isOpen(topic.id)" class="help-topic__body">
              <ol class="help-steps">
                <li v-for="(step, i) in topic.steps" :key="i" class="help-step">
                  <span class="help-step__num">{{ i + 1 }}</span>
                  <span v-if="step.icon" class="help-step__icon">
                    <BaseIcon :name="step.icon" :size="14" color="var(--text2)" />
                  </span>
                  <span class="help-step__text">{{ step.text }}</span>
                </li>
              </ol>
              <p v-if="topic.tip" class="help-tip">
                <BaseIcon name="info" :size="14" color="var(--primary)" />
                <span>{{ topic.tip }}</span>
              </p>
            </div>
          </Transition>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import BaseIcon from '~/components/base/BaseIcon.vue'
import BaseEmptyState from '~/components/base/BaseEmptyState.vue'
import { HELP_CONTENT } from '~/features/finance/constants/helpContent'

interface HelpFocus { screenId: string; topicId?: string }

const search = ref('')
const searchFocused = ref(false)
const expandedIds = ref<string[]>([])

const helpFocus = useState<HelpFocus | null>('help-focus', () => null)

const normalized = computed(() => search.value.trim().toLowerCase())

const filteredGroups = computed(() => {
  const q = normalized.value
  if (!q) return HELP_CONTENT
  return HELP_CONTENT
    .map((group) => ({
      ...group,
      topics: group.topics.filter((topic) =>
        topic.title.toLowerCase().includes(q) ||
        topic.steps.some((s) => s.text.toLowerCase().includes(q)) ||
        (topic.tip?.toLowerCase().includes(q) ?? false)
      ),
    }))
    .filter((group) => group.topics.length > 0)
})

// Durante a busca, todos os tópicos correspondentes aparecem expandidos.
const isOpen = (id: string) => normalized.value !== '' || expandedIds.value.includes(id)

const toggle = (id: string) => {
  if (normalized.value !== '') return
  expandedIds.value = expandedIds.value.includes(id)
    ? expandedIds.value.filter((x) => x !== id)
    : [...expandedIds.value, id]
}

onMounted(() => {
  const focus = helpFocus.value
  if (!focus) return
  if (focus.topicId && !expandedIds.value.includes(focus.topicId)) {
    expandedIds.value = [...expandedIds.value, focus.topicId]
  }
  nextTick(() => {
    const targetId = focus.topicId
      ? `help-topic-${focus.screenId}-${focus.topicId}`
      : `help-group-${focus.screenId}`
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
  helpFocus.value = null
})
</script>

<style scoped>
.help-group {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.help-group__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
}
.help-group__icon {
  flex-shrink: 0;
  display: inline-flex;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: var(--primary-dim);
  align-items: center;
  justify-content: center;
}
.help-group__title {
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
}
.help-group__intro {
  font-size: 12.5px;
  color: var(--text3);
  margin-top: 3px;
  line-height: 1.45;
}
.help-topics {
  display: flex;
  flex-direction: column;
}
.help-topic {
  border-bottom: 1px solid var(--border);
}
.help-topic:last-child {
  border-bottom: none;
}
.help-topic__btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 13px 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background .12s;
}
.help-topic__btn:hover {
  background: var(--surface2);
}
.help-topic__chevron {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--text3);
  transition: transform .2s cubic-bezier(.4, 0, .2, 1);
}
.help-topic__chevron--open {
  transform: rotate(90deg);
  color: var(--primary);
}
.help-topic__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
}
.help-topic__body {
  padding: 4px 18px 18px 18px;
  overflow: hidden;
}
.help-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0 0 0 4px;
  list-style: none;
}
.help-step {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 13px;
  color: var(--text2);
  line-height: 1.45;
}
.help-step__num {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-dim);
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
  margin-top: 1px;
}
.help-step__icon {
  flex-shrink: 0;
  display: inline-flex;
  margin-top: 2px;
}
.help-step__text {
  flex: 1;
}
.help-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--primary-dim);
  border: 1px solid var(--primary);
  font-size: 12.5px;
  color: var(--text2);
  line-height: 1.45;
}

/* Animação de expandir/recolher */
.help-expand-enter-active,
.help-expand-leave-active {
  transition: opacity .18s ease, max-height .25s ease;
  max-height: 600px;
}
.help-expand-enter-from,
.help-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>

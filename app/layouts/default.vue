<template>
  <div :style="{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex' }">

    <!-- Desktop sidebar -->
    <aside
      v-if="!isMobile"
      :style="{
        width: collapsed ? '68px' : '240px',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'width .25s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        zIndex: 100,
        height: '100vh',
      }"
    >
      <!-- Logo -->
      <div :style="{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', borderBottom: '1px solid var(--border)', height: '56px', flexShrink: 0, overflow: 'hidden' }">
        <div style="width: 32px; height: 32px; border-radius: 9px; background: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0">
          <BaseIcon name="balance" :size="17" color="#fff" />
        </div>
        <div :style="{ overflow: 'hidden', whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, transition: 'opacity .15s', pointerEvents: collapsed ? 'none' : 'auto' }">
          <p style="font-size: 9px; color: var(--text3); font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase">Financeiro</p>
          <p style="font-size: 14px; font-weight: 800; color: var(--text)">Familiar</p>
        </div>
      </div>

      <!-- Nav -->
      <nav style="flex: 1; padding: 8px 6px; overflow-y: auto; overflow-x: hidden">
        <div v-for="group in NAV_GROUPS" :key="group.id" style="margin-bottom: 4px">
          <!-- Group header -->
          <button
            v-if="!collapsed"
            style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 5px 8px; background: none; border: none; cursor: pointer; color: var(--text3); font-family: inherit; margin-bottom: 1px"
            @click="toggleGroup(group.id)"
          >
            <span style="font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase">{{ group.label }}</span>
            <span :style="{ display: 'flex', transition: 'transform .2s', transform: openGroups.includes(group.id) ? 'rotate(0)' : 'rotate(-90deg)' }">
              <BaseIcon name="chevron_down" :size="12" />
            </span>
          </button>
          <!-- Items -->
          <template v-if="collapsed || openGroups.includes(group.id)">
            <button
              v-for="item in group.items"
              :key="item.id"
              :title="collapsed ? item.label : ''"
              :style="{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: collapsed ? '9px 0' : '8px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '13px',
                background: activeScreen === item.id ? 'var(--primary-dim)' : 'transparent',
                color: activeScreen === item.id ? 'var(--primary)' : 'var(--text2)',
                transition: 'background .12s, color .12s',
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }"
              @mouseenter="($event.currentTarget as HTMLElement).style.background = activeScreen === item.id ? 'var(--primary-dim)' : 'var(--surface2)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background = activeScreen === item.id ? 'var(--primary-dim)' : 'transparent'"
              @click="goTo(item.id)"
            >
              <span v-if="activeScreen === item.id" style="position: absolute; left: 0; top: 20%; bottom: 20%; width: 3px; border-radius: 99px; background: var(--primary)" />
              <span style="position: relative; flex-shrink: 0">
                <BaseIcon :name="item.icon" :size="16" :color="activeScreen === item.id ? 'var(--primary)' : 'currentColor'" />
                <span
                  v-if="item.id === 'alerts' && alertCount > 0"
                  style="position: absolute; top: -4px; right: -4px; width: 14px; height: 14px; border-radius: 50%; background: var(--danger); border: 2px solid var(--surface); display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 800; color: #fff"
                >{{ alertCount }}</span>
              </span>
              <span :style="{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? '0' : '160px', transition: 'opacity .15s, max-width .25s cubic-bezier(.4,0,.2,1)', overflow: 'hidden' }">{{ item.label }}</span>
            </button>
          </template>
          <div v-if="!collapsed" style="height: 4px" />
        </div>
      </nav>

      <!-- Bottom -->
      <div style="border-top: 1px solid var(--border); padding: 8px 6px; display: flex; flex-direction: column; gap: 2px">
        <button
          v-for="item in [DS_ITEM, SETTINGS_ITEM]"
          :key="item.id"
          :title="collapsed ? item.label : ''"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: collapsed ? '9px 0' : '8px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 'var(--radius-xs)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
            fontSize: '13px',
            background: activeScreen === item.id ? 'var(--primary-dim)' : 'transparent',
            color: activeScreen === item.id ? 'var(--primary)' : 'var(--text2)',
            transition: 'background .12s, color .12s',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }"
          @mouseenter="($event.currentTarget as HTMLElement).style.background = activeScreen === item.id ? 'var(--primary-dim)' : 'var(--surface2)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background = activeScreen === item.id ? 'var(--primary-dim)' : 'transparent'"
          @click="goTo(item.id)"
        >
          <BaseIcon :name="item.icon" :size="16" :color="activeScreen === item.id ? 'var(--primary)' : 'currentColor'" />
          <span :style="{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? '0' : '160px', transition: 'opacity .15s, max-width .25s cubic-bezier(.4,0,.2,1)', overflow: 'hidden' }">{{ item.label }}</span>
        </button>

        <!-- Net worth badge -->
        <div
          v-if="!collapsed"
          style="margin: 4px 4px 0; padding: 9px 10px; border-radius: var(--radius-xs); background: var(--primary-dim); border: 1px solid var(--primary)"
        >
          <p style="font-size: 9px; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px">{{ currentMonthName }}</p>
          <p style="font-size: 14px; font-weight: 800; color: var(--primary)">{{ currency.format(store.kpis.net) }}</p>
          <p style="font-size: 9px; color: var(--primary); opacity: 0.7">saldo líquido</p>
        </div>

        <!-- Collapse button -->
        <button
          style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--radius-xs); border: none; cursor: pointer; background: transparent; color: var(--text3); font-family: inherit; font-size: 12px; font-weight: 600; width: 100%; transition: background .12s; white-space: nowrap; overflow: hidden"
          :style="{ justifyContent: collapsed ? 'center' : 'flex-start' }"
          @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--surface2)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
          @click="collapsed = !collapsed"
        >
          <span :style="{ display: 'flex', flexShrink: 0, transition: 'transform .25s cubic-bezier(.4,0,.2,1)', transform: collapsed ? 'rotate(180deg)' : 'none' }">
            <BaseIcon name="chevron_left" :size="15" />
          </span>
          <span :style="{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? '0' : '120px', transition: 'opacity .15s, max-width .25s cubic-bezier(.4,0,.2,1)', overflow: 'hidden' }">Recolher</span>
        </button>
      </div>
    </aside>

    <!-- Mobile drawer overlay -->
    <div
      v-if="isMobile && drawerOpen"
      style="position: fixed; inset: 0; z-index: 300; display: flex"
      @click="drawerOpen = false"
    >
      <div style="position: absolute; inset: 0; background: oklch(0% 0 0 / 0.45); backdrop-filter: blur(2px)" />
      <div
        style="position: relative; width: 280px; height: 100%; background: var(--surface); border-right: 1px solid var(--border); box-shadow: var(--shadow-lg); z-index: 1; display: flex; flex-direction: column; animation: slideInLeft .22s cubic-bezier(.4,0,.2,1); overflow-y: auto"
        @click.stop
      >
        <div style="display: flex; align-items: center; gap: 10px; padding: 0 16px; border-bottom: 1px solid var(--border); height: 56px; flex-shrink: 0">
          <div style="width: 32px; height: 32px; border-radius: 9px; background: var(--primary); display: flex; align-items: center; justify-content: center">
            <BaseIcon name="balance" :size="17" color="#fff" />
          </div>
          <div>
            <p style="font-size: 9px; color: var(--text3); font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase">Financeiro</p>
            <p style="font-size: 14px; font-weight: 800; color: var(--text)">Familiar</p>
          </div>
        </div>
        <nav style="flex: 1; padding: 8px 8px">
          <div v-for="group in NAV_GROUPS" :key="group.id" style="margin-bottom: 8px">
            <p style="font-size: 9px; font-weight: 800; color: var(--text3); text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 8px; margin-bottom: 2px">{{ group.label }}</p>
            <button
              v-for="item in group.items"
              :key="item.id"
              :style="{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '14px',
                background: activeScreen === item.id ? 'var(--primary-dim)' : 'transparent',
                color: activeScreen === item.id ? 'var(--primary)' : 'var(--text2)',
                transition: 'background .12s',
                width: '100%',
                position: 'relative',
              }"
              @mouseenter="($event.currentTarget as HTMLElement).style.background = activeScreen === item.id ? 'var(--primary-dim)' : 'var(--surface2)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background = activeScreen === item.id ? 'var(--primary-dim)' : 'transparent'"
              @click="goTo(item.id)"
            >
              <span v-if="activeScreen === item.id" style="position: absolute; left: 0; top: 20%; bottom: 20%; width: 3px; border-radius: 99px; background: var(--primary)" />
              <BaseIcon :name="item.icon" :size="18" :color="activeScreen === item.id ? 'var(--primary)' : 'currentColor'" />
              {{ item.label }}
              <span v-if="item.id === 'alerts' && alertCount > 0" style="margin-left: auto; display: inline-flex; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--danger-light); color: var(--danger)">{{ alertCount }}</span>
            </button>
          </div>
        </nav>
        <div style="border-top: 1px solid var(--border); padding: 8px 8px">
          <button
            v-for="item in [DS_ITEM, SETTINGS_ITEM]"
            :key="item.id"
            :style="{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 10px',
              borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: 600, fontSize: '14px',
              background: activeScreen === item.id ? 'var(--primary-dim)' : 'transparent',
              color: activeScreen === item.id ? 'var(--primary)' : 'var(--text2)',
              width: '100%', transition: 'background .12s',
            }"
            @click="goTo(item.id)"
          >
            <BaseIcon :name="item.icon" :size="18" />{{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main area -->
    <div style="flex: 1; min-width: 0; display: flex; flex-direction: column">

      <!-- Top bar -->
      <div style="height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-sm); position: sticky; top: 0; z-index: 90; flex-shrink: 0">
        <!-- Mobile: hamburger -->
        <button
          v-if="isMobile"
          style="background: none; border: none; cursor: pointer; color: var(--text); display: flex; padding: 6px; border-radius: 8px; position: relative"
          @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--surface2)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
          @click="drawerOpen = !drawerOpen"
        >
          <BaseIcon name="menu" :size="20" />
          <span v-if="alertCount > 0" style="position: absolute; top: 2px; right: 2px; width: 10px; height: 10px; border-radius: 50%; background: var(--danger); border: 2px solid var(--surface)" />
        </button>

        <!-- Title -->
        <div style="flex: 1; min-width: 0">
          <h1 style="font-size: 15px; font-weight: 800; color: var(--text); line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ currentItemLabel }}</h1>
          <p v-if="!isMobile" style="font-size: 11px; color: var(--text3)">{{ currentMonthName }} de {{ currentYear }}</p>
        </div>

        <!-- Right: income/expense summary + alerts + balance -->
        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0">
          <span v-if="!isMobile" style="font-size: 12px; color: var(--text3); font-weight: 600">
            ↑ <span style="color: var(--success)">{{ currency.format(store.kpis.totalIncome) }}</span>
            &nbsp;↓ <span style="color: var(--danger)">{{ currency.format(store.kpis.totalExpense) }}</span>
          </span>
          <button
            style="background: none; border: none; cursor: pointer; color: var(--text2); display: flex; padding: 6px; border-radius: 8px; position: relative"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--surface2)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
            @click="goTo('alerts')"
          >
            <BaseIcon name="alerts" :size="20" />
            <span v-if="alertCount > 0" style="position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--danger); border: 2px solid var(--surface); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; color: #fff">{{ alertCount }}</span>
          </button>
          <div style="padding: 4px 10px; border-radius: 99px; background: var(--primary-dim); border: 1px solid var(--primary)">
            <span style="font-size: 12px; font-weight: 800; color: var(--primary)">{{ currency.format(store.kpis.net) }}</span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <main
        :style="{
          flex: 1,
          padding: isMobile ? '16px 12px 80px' : '24px',
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          animation: 'fadeIn .18s ease',
        }"
      >
        <slot />
      </main>
    </div>

    <!-- Mobile bottom nav -->
    <nav
      v-if="isMobile"
      style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 150; background: var(--surface); border-top: 1px solid var(--border); box-shadow: 0 -4px 20px oklch(0% 0 0 / 0.1); display: flex"
      :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }"
    >
      <button
        v-for="item in BOTTOM_NAV_ITEMS"
        :key="item.id"
        :style="{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          padding: '10px 4px 8px',
          border: 'none',
          cursor: 'pointer',
          background: 'transparent',
          color: activeScreen === item.id ? 'var(--primary)' : 'var(--text3)',
          fontFamily: 'inherit',
          fontSize: '9px',
          fontWeight: 700,
          transition: 'color .12s',
          position: 'relative',
        }"
        @click="goTo(item.id)"
      >
        <span v-if="activeScreen === item.id" style="position: absolute; top: 0; left: 20%; right: 20%; height: 2px; border-radius: 99px; background: var(--primary)" />
        <span style="position: relative">
          <BaseIcon :name="item.icon" :size="22" :color="activeScreen === item.id ? 'var(--primary)' : 'currentColor'" />
          <span v-if="item.id === 'alerts' && alertCount > 0" style="position: absolute; top: -3px; right: -4px; width: 13px; height: 13px; border-radius: 50%; background: var(--danger); border: 2px solid var(--surface); display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 800; color: #fff">{{ alertCount }}</span>
        </span>
        {{ item.label }}
      </button>
      <button
        style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 10px 4px 8px; border: none; cursor: pointer; background: transparent; color: var(--text3); font-family: inherit; font-size: 9px; font-weight: 700"
        @click="drawerOpen = true"
      >
        <BaseIcon name="menu" :size="22" />Mais
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import BaseIcon from '~/components/base/BaseIcon.vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { NAV_GROUPS, BOTTOM_NAV_ITEMS, SETTINGS_ITEM, DS_ITEM } from '~/features/finance/constants/ui'

const store = useFinanceStore()
const currency = useCurrency()

const activeScreen = useState('finance-screen', () => 'dashboard')
const collapsed = ref(false)
const drawerOpen = ref(false)
const isMobile = ref(false)
const openGroups = ref(['overview', 'finance', 'control', 'commitments', 'analysis'])

const alertCount = 3

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const now = new Date()
const currentMonthName = MONTH_NAMES[now.getMonth()]
const currentYear = now.getFullYear()

const ALL_ITEMS = [...NAV_GROUPS.flatMap(g => g.items), SETTINGS_ITEM, DS_ITEM]
const currentItemLabel = computed(() => ALL_ITEMS.find(i => i.id === activeScreen.value)?.label ?? 'Dashboard')

watch(() => store.settings.themeMode, () => {
  if (process.client) {
    document.documentElement.dataset.theme = store.settings.themeMode
    document.documentElement.classList.toggle('dark', store.settings.themeMode === 'dark')
  }
}, { immediate: true })

const updateMobile = () => { isMobile.value = window.innerWidth < 768 }

onMounted(() => {
  updateMobile()
  window.addEventListener('resize', updateMobile)
})

onUnmounted(() => window.removeEventListener('resize', updateMobile))

const goTo = (id: string) => {
  activeScreen.value = id
  drawerOpen.value = false
}

const toggleGroup = (id: string) => {
  if (openGroups.value.includes(id)) {
    openGroups.value = openGroups.value.filter(x => x !== id)
  } else {
    openGroups.value = [...openGroups.value, id]
  }
}
</script>

<style>
@keyframes slideInLeft {
  from { transform: translateX(-100%); opacity: .5 }
  to   { transform: translateX(0);    opacity: 1  }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px) }
  to   { opacity: 1; transform: none             }
}
</style>

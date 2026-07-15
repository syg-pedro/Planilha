<template>
  <div class="app-shell" :style="{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex' }">

    <!-- Desktop sidebar -->
    <aside
      v-if="!isMobile"
      class="app-sidebar"
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
        <div class="app-brand-mark" style="width: 32px; height: 32px; border-radius: 9px; background: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0">
          <BaseIcon name="balance" :size="17" color="#fff" />
        </div>
        <div :style="{ overflow: 'hidden', whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, transition: 'opacity .15s', pointerEvents: collapsed ? 'none' : 'auto' }">
          <p style="font-size: 9px; color: var(--text3); font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase">Financeiro</p>
          <p style="font-size: 14px; font-weight: 800; color: var(--text)">Familiar</p>
        </div>
      </div>

      <!-- Nav -->
      <nav style="flex: 1; padding: 6px 6px; overflow-y: auto; overflow-x: hidden">
        <template v-for="(group, gi) in NAV_GROUPS" :key="group.id">
          <!-- Divider between groups -->
          <div v-if="gi > 0 && !collapsed" style="height: 1px; background: var(--border); margin: 4px 8px" />
          <div style="margin-bottom: 2px">
            <!-- Group header -->
            <button
              v-if="!collapsed"
              style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 6px 8px 3px; background: none; border: none; cursor: pointer; color: var(--text3); font-family: inherit"
              @click="toggleGroup(group.id)"
            >
              <span style="font-size: 9px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase">{{ group.label }}</span>
              <span :style="{ display: 'flex', transition: 'transform .2s', transform: openGroups.includes(group.id) ? 'rotate(0)' : 'rotate(-90deg)' }">
                <BaseIcon name="chevron_down" :size="11" />
              </span>
            </button>
            <!-- Items -->
            <template v-if="collapsed || openGroups.includes(group.id)">
              <button
                v-for="item in group.items"
                :key="item.id"
                class="app-nav-item"
                :class="{ 'app-nav-item--active': activeScreen === item.id }"
                :title="collapsed ? item.label : ''"
                :style="{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: collapsed ? '8px 0' : '7px 10px',
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
                  <BaseIcon :name="item.icon" :size="15" :color="activeScreen === item.id ? 'var(--primary)' : 'currentColor'" />
                  <span
                    v-if="item.id === 'alerts' && alertCount > 0"
                    style="position: absolute; top: -4px; right: -4px; width: 14px; height: 14px; border-radius: 50%; background: var(--danger); border: 2px solid var(--surface); display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 800; color: #fff"
                  >{{ alertCount }}</span>
                </span>
                <span :style="{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? '0' : '160px', transition: 'opacity .15s, max-width .25s cubic-bezier(.4,0,.2,1)', overflow: 'hidden' }">{{ item.label }}</span>
              </button>
            </template>
          </div>
        </template>
      </nav>

      <!-- Bottom -->
      <div style="border-top: 1px solid var(--border); padding: 8px 6px; display: flex; flex-direction: column; gap: 2px">
        <button
          v-for="item in BOTTOM_ITEMS"
          :key="item.id"
          class="app-nav-item"
          :class="{ 'app-nav-item--active': activeScreen === item.id }"
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

        <!-- Sair -->
        <button
          title="Sair"
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
            background: 'transparent',
            color: 'var(--danger)',
            transition: 'background .12s',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }"
          @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--danger-light)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
          @click="logout()"
        >
          <BaseIcon name="logout" :size="16" color="currentColor" />
          <span :style="{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? '0' : '160px', transition: 'opacity .15s, max-width .25s cubic-bezier(.4,0,.2,1)', overflow: 'hidden' }">Sair</span>
        </button>

        <p v-if="!collapsed" class="app-version-badge">Versão v{{ appVersion }}</p>

        <!-- Net worth badge -->
        <div
          v-if="!collapsed"
          style="margin: 4px 4px 0; padding: 9px 10px; border-radius: var(--radius-xs); background: var(--primary-dim); border: 1px solid var(--primary)"
        >
          <p style="font-size: 9px; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px">{{ currentMonthName }}</p>
          <p style="font-size: 14px; font-weight: 800; color: var(--primary)">{{ currency.format(store.monthlyKpis.net) }}</p>
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
        class="app-drawer"
        style="position: relative; width: 280px; height: 100%; background: var(--surface); border-right: 1px solid var(--border); box-shadow: var(--shadow-lg); z-index: 1; display: flex; flex-direction: column; animation: slideInLeft .22s cubic-bezier(.4,0,.2,1); overflow-y: auto"
        @click.stop
      >
        <div style="display: flex; align-items: center; gap: 10px; padding: 0 16px; border-bottom: 1px solid var(--border); height: 56px; flex-shrink: 0">
          <div class="app-brand-mark" style="width: 32px; height: 32px; border-radius: 9px; background: var(--primary); display: flex; align-items: center; justify-content: center">
            <BaseIcon name="balance" :size="17" color="#fff" />
          </div>
          <div>
            <p style="font-size: 9px; color: var(--text3); font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase">Financeiro</p>
            <p style="font-size: 14px; font-weight: 800; color: var(--text)">Familiar</p>
          </div>
        </div>
        <nav style="flex: 1; padding: 6px 8px">
          <template v-for="(group, gi) in NAV_GROUPS" :key="group.id">
            <div v-if="gi > 0" style="height: 1px; background: var(--border); margin: 4px 4px" />
            <p style="font-size: 9px; font-weight: 800; color: var(--text3); text-transform: uppercase; letter-spacing: 0.12em; padding: 6px 6px 2px; margin: 0">{{ group.label }}</p>
            <button
              v-for="item in group.items"
              :key="item.id"
              class="app-nav-item"
              :class="{ 'app-nav-item--active': activeScreen === item.id }"
              :style="{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
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
              <BaseIcon :name="item.icon" :size="16" :color="activeScreen === item.id ? 'var(--primary)' : 'currentColor'" />
              {{ item.label }}
              <span v-if="item.id === 'alerts' && alertCount > 0" style="margin-left: auto; display: inline-flex; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--danger-light); color: var(--danger)">{{ alertCount }}</span>
            </button>
          </template>
        </nav>
        <div style="border-top: 1px solid var(--border); padding: 8px 8px">
          <button
            v-for="item in BOTTOM_ITEMS"
            :key="item.id"
            class="app-nav-item"
            :class="{ 'app-nav-item--active': activeScreen === item.id }"
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
          <button
            :style="{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 10px',
              borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: 600, fontSize: '14px',
              background: 'transparent',
              color: 'var(--danger)',
              width: '100%', transition: 'background .12s',
            }"
            @click="logout()"
          >
            <BaseIcon name="logout" :size="18" />Sair
          </button>
          <p class="app-version-badge">Versão v{{ appVersion }}</p>
        </div>
      </div>
    </div>

    <!-- Main area -->
    <div style="flex: 1; min-width: 0; display: flex; flex-direction: column">

      <!-- Top bar -->
      <div class="app-topbar" style="height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-sm); position: sticky; top: 0; z-index: 90; flex-shrink: 0">
        <!-- Mobile: hamburger -->
        <button
          v-if="isMobile"
          class="app-icon-button"
          style="background: none; border: none; cursor: pointer; color: var(--text); display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 8px; position: relative; touch-action: manipulation; flex-shrink: 0"
          @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--surface2)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
          @click="drawerOpen = !drawerOpen"
        >
          <BaseIcon name="menu" :size="20" />
          <span v-if="alertCount > 0" style="position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--danger); border: 2px solid var(--surface)" />
        </button>

        <!-- Title -->
        <div style="flex: 1; min-width: 0">
          <h1 style="font-size: 15px; font-weight: 800; color: var(--text); line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ currentItemLabel }}</h1>
          <p v-if="!isMobile" style="font-size: 11px; color: var(--text3)">{{ currentMonthName }} de {{ currentYear }}</p>
        </div>

        <!-- Right: income/expense summary + alerts + balance -->
        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0">
          <span v-if="!isMobile" style="font-size: 12px; color: var(--text3); font-weight: 600">
            ↑ <span style="color: var(--success)">{{ currency.format(store.monthlyKpis.totalIncome) }}</span>
            &nbsp;↓ <span style="color: var(--danger)">{{ currency.format(store.monthlyKpis.totalExpense) }}</span>
          </span>
          <button
            class="app-icon-button"
            style="background: none; border: none; cursor: pointer; color: var(--text2); display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 8px; position: relative; touch-action: manipulation; flex-shrink: 0"
            :style="{ background: helpMenuOpen ? 'var(--surface2)' : 'none', color: helpMenuOpen ? 'var(--primary)' : 'var(--text2)' }"
            title="Ajuda desta tela"
            @mouseenter="!helpMenuOpen && (($event.currentTarget as HTMLElement).style.background = 'var(--surface2)')"
            @mouseleave="!helpMenuOpen && (($event.currentTarget as HTMLElement).style.background = 'none')"
            @click="helpMenuOpen = !helpMenuOpen"
          >
            <BaseIcon name="help" :size="20" />
          </button>
          <button
            class="app-icon-button"
            style="background: none; border: none; cursor: pointer; color: var(--text2); display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 8px; position: relative; touch-action: manipulation; flex-shrink: 0"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--surface2)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'none'"
            @click="goTo('alerts')"
          >
            <BaseIcon name="alerts" :size="20" />
            <span v-if="alertCount > 0" style="position: absolute; top: 6px; right: 6px; width: 16px; height: 16px; border-radius: 50%; background: var(--danger); border: 2px solid var(--surface); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; color: #fff">{{ alertCount }}</span>
          </button>
          <div class="app-balance-chip" style="padding: 4px 10px; border-radius: 99px; background: var(--primary-dim); border: 1px solid var(--primary)">
            <span style="font-size: 12px; font-weight: 800; color: var(--primary)">{{ currency.format(store.monthlyKpis.net) }}</span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <main
        :style="{
          flex: 1,
          padding: isMobile ? '16px 12px calc(80px + env(safe-area-inset-bottom, 0px))' : activeScreen === 'planilha' ? '12px 16px' : '24px',
          maxWidth: activeScreen === 'planilha' ? 'none' : '1280px',
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
      class="app-mobile-nav"
      style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 150; background: var(--surface); border-top: 1px solid var(--border); box-shadow: 0 -4px 20px oklch(0% 0 0 / 0.1); display: flex"
      :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }"
    >
      <button
        v-for="item in BOTTOM_NAV_ITEMS"
        :key="item.id"
        class="app-mobile-nav__item"
        :class="{ 'app-mobile-nav__item--active': activeScreen === item.id }"
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
          fontSize: '10px',
          fontWeight: 700,
          transition: 'color .12s',
          position: 'relative',
          touchAction: 'manipulation',
          minHeight: '56px',
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
        class="app-mobile-nav__item"
        style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 10px 4px 8px; border: none; cursor: pointer; background: transparent; color: var(--text3); font-family: inherit; font-size: 10px; font-weight: 700; touch-action: manipulation; min-height: 56px"
        @click="drawerOpen = true"
      >
        <BaseIcon name="menu" :size="22" />Mais
      </button>
    </nav>

    <!-- Popover de ajuda contextual -->
    <Teleport to="body">
      <div v-if="helpMenuOpen" style="position: fixed; inset: 0; z-index: 998" @click="helpMenuOpen = false" />
      <Transition name="help-pop">
        <div
          v-if="helpMenuOpen"
          class="help-pop"
          :style="{ right: isMobile ? '10px' : '16px' }"
        >
          <div class="help-pop__head">
            <BaseIcon :name="currentHelpGroup?.icon ?? 'help'" :size="15" color="var(--primary)" />
            <span>Ajuda · {{ currentItemLabel }}</span>
          </div>

          <div v-if="currentHelpGroup" class="help-pop__list">
            <button
              v-for="topic in currentHelpGroup.topics"
              :key="topic.id"
              class="help-pop__item"
              @click="openHelp(topic.id)"
            >
              <BaseIcon name="chevron_right" :size="13" color="var(--text3)" />
              <span>{{ topic.title }}</span>
            </button>
          </div>
          <p v-else class="help-pop__empty">Não há tutoriais específicos para esta tela.</p>

          <button class="help-pop__all" @click="openHelp()">
            <BaseIcon name="book" :size="14" color="var(--primary)" />
            Ver Central de Ajuda
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { PluginListenerHandle } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import BaseIcon from '~/components/base/BaseIcon.vue'
import { useFinanceStore } from '~/features/finance/stores/useFinanceStore'
import { NAV_GROUPS, BOTTOM_NAV_ITEMS, SETTINGS_ITEM, DS_ITEM, HELP_ITEM, CHANGELOG_ITEM } from '~/features/finance/constants/ui'
import { helpForScreen } from '~/features/finance/constants/helpContent'

const store = useFinanceStore()
const currency = useCurrency()
const { logout } = useLogout()
const config = useRuntimeConfig()
const appVersion = ref(config.public.appVersion as string)

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

const BOTTOM_ITEMS = [HELP_ITEM, CHANGELOG_ITEM, DS_ITEM, SETTINGS_ITEM]
const ALL_ITEMS = [...NAV_GROUPS.flatMap(g => g.items), ...BOTTOM_ITEMS]
const currentItemLabel = computed(() => ALL_ITEMS.find(i => i.id === activeScreen.value)?.label ?? 'Dashboard')

// ── Ajuda contextual ──────────────────────────────────────────────────────
interface HelpFocus { screenId: string; topicId?: string }
const helpFocus = useState<HelpFocus | null>('help-focus', () => null)
const helpMenuOpen = ref(false)
const currentHelpGroup = computed(() => helpForScreen(activeScreen.value))

const openHelp = (topicId?: string) => {
  const screenId = activeScreen.value
  helpFocus.value = currentHelpGroup.value ? { screenId, topicId } : null
  helpMenuOpen.value = false
  goTo('help')
}

watch(() => store.settings.themeMode, () => {
  store.applyTheme()
}, { immediate: true })

const updateMobile = () => { isMobile.value = window.innerWidth < 768 }

let backButtonListener: PluginListenerHandle | undefined

const handleNativeBack = async () => {
  if (drawerOpen.value) {
    drawerOpen.value = false
    return
  }

  if (helpMenuOpen.value) {
    helpMenuOpen.value = false
    return
  }

  if (activeScreen.value !== 'dashboard') {
    goTo('dashboard')
    return
  }

  await App.minimizeApp()
}

onMounted(() => {
  updateMobile()
  window.addEventListener('resize', updateMobile)

  if (Capacitor.isNativePlatform()) {
    void App.getInfo().then(({ version }) => {
      appVersion.value = version
    })

    void App.addListener('backButton', handleNativeBack).then((listener) => {
      backButtonListener = listener
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMobile)
  void backButtonListener?.remove()
})

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
.app-shell {
  isolation: isolate;
}

.app-sidebar {
  border-right: 3px solid var(--border) !important;
  box-shadow: 4px 0 0 var(--ds-shadow-color) !important;
}

.app-brand-mark {
  border: 2px solid var(--border);
  border-radius: var(--radius-sm) !important;
  box-shadow: 3px 3px 0 var(--ds-shadow-color);
}

.app-nav-item {
  border: 2px solid transparent !important;
  border-radius: var(--radius-sm) !important;
  font-weight: 700 !important;
}

.app-nav-item:hover {
  border-color: var(--border) !important;
}

.app-nav-item--active {
  color: var(--text) !important;
  background: var(--primary-dim) !important;
  border-color: var(--border) !important;
  box-shadow: 2px 2px 0 var(--ds-shadow-color);
}

.app-version-badge {
  margin: 6px 10px 2px;
  padding: 6px 8px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text3);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

.app-drawer {
  border-right: 3px solid var(--border) !important;
  box-shadow: var(--shadow-lg) !important;
}

.app-topbar {
  border-bottom: 3px solid var(--border) !important;
  box-shadow: 0 4px 0 var(--ds-shadow-color) !important;
}

.app-icon-button {
  color: var(--text) !important;
  background: var(--surface2) !important;
  border: 2px solid var(--border) !important;
  border-radius: var(--radius-sm) !important;
  box-shadow: 2px 2px 0 var(--ds-shadow-color);
}

.app-icon-button:active {
  box-shadow: none;
  transform: translate(2px, 2px);
}

.app-balance-chip {
  border: 2px solid var(--border) !important;
  border-radius: var(--radius-xs) !important;
  box-shadow: 2px 2px 0 var(--ds-shadow-color);
}

.app-mobile-nav {
  border-top: 3px solid var(--border) !important;
  box-shadow: 0 -4px 0 var(--ds-shadow-color) !important;
}

.app-mobile-nav__item {
  border-right: 1px solid var(--border) !important;
}

.app-mobile-nav__item--active {
  color: var(--text) !important;
  background: var(--primary-dim) !important;
}

@media (max-width: 767px) {
  .app-topbar { padding-inline: 10px !important; gap: 8px !important; }
  .app-balance-chip { padding-inline: 7px !important; }
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); opacity: .5 }
  to   { transform: translateX(0);    opacity: 1  }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px) }
  to   { opacity: 1; transform: none             }
}

/* ── Popover de ajuda contextual ─────────────────────────── */
.help-pop {
  position: fixed;
  top: 60px;
  z-index: 999;
  width: 300px;
  max-width: calc(100vw - 20px);
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 6px;
}
.help-pop__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 10px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text3);
  border-bottom: 2px solid var(--border);
  margin-bottom: 4px;
}
.help-pop__list {
  display: flex;
  flex-direction: column;
}
.help-pop__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 10px;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text2);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: background .1s, color .1s;
}
.help-pop__item:hover {
  background: var(--surface2);
  border-color: var(--border);
  color: var(--text);
}
.help-pop__empty {
  padding: 10px;
  font-size: 12.5px;
  color: var(--text3);
}
.help-pop__all {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
  padding: 10px;
  border: 2px solid transparent;
  border-top: 2px solid var(--border);
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background .1s;
}
.help-pop__all:hover {
  background: var(--primary-dim);
  border-right-color: var(--border);
  border-bottom-color: var(--border);
  border-left-color: var(--border);
}

.help-pop-enter-active,
.help-pop-leave-active {
  transition: opacity var(--ds-motion-base) linear, transform var(--ds-motion-base) linear;
}
.help-pop-enter-from,
.help-pop-leave-to {
  opacity: 0;
  transform: translate(4px, 4px);
}
</style>

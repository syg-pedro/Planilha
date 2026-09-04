<template>
    <section class="neo-panel">
      <header class="neo-panel-header cfg__panel-head">
        <h3 class="cfg__panel-title">Compartilhamento</h3>
        <p class="cfg__panel-sub">Gerencie quem tem acesso aos seus dados financeiros</p>
      </header>

      <div v-if="householdLoading" class="cfg__row">
        <span class="cfg__row-value">Carregando membros...</span>
      </div>

      <template v-else>
        <div v-for="m in members" :key="m.userId" class="cfg__row">
          <div class="cfg__row-main">
            <span class="cfg__member-avatar">{{ m.email[0]?.toUpperCase() }}</span>
            <div class="cfg__row-text">
              <p class="cfg__row-label cfg__row-label--ellipsis">{{ m.email }}</p>
              <p class="cfg__row-sub">{{ m.role === 'owner' ? 'Proprietário' : 'Membro' }}</p>
            </div>
          </div>
        </div>
      </template>

      <div v-for="inv in pendingInvites" :key="inv.id" class="cfg__row">
        <div class="cfg__row-text">
          <p class="cfg__row-label cfg__row-label--ellipsis">{{ inv.email }}</p>
          <p class="cfg__row-sub">Expira {{ fmtDate(inv.expiresAt) }}</p>
        </div>
        <span class="cfg__badge cfg__badge--warning">Aguardando</span>
      </div>

      <div class="cfg__panel-body">
        <p class="cfg__section-label">Convidar por e-mail</p>
        <div class="cfg__invite">
          <input
            v-model="inviteEmail"
            type="email"
            placeholder="email@exemplo.com"
            class="cfg__input cfg__input--grow"
            aria-label="E-mail do convidado"
            @keydown.enter="sendInvite"
          />
          <button class="cfg__btn cfg__btn--primary" :disabled="inviteSending || !inviteEmail" @click="sendInvite">
            {{ inviteSending ? '...' : 'Convidar' }}
          </button>
        </div>

        <div v-if="inviteLink" class="cfg__invite-link">
          <p class="cfg__invite-link-title">Convite gerado! Compartilhe o link:</p>
          <div class="cfg__invite-link-row">
            <code class="cfg__invite-code">{{ inviteLink }}</code>
            <button class="cfg__link-btn" @click="copyInviteLink">{{ linkCopied ? 'Copiado!' : 'Copiar' }}</button>
          </div>
        </div>

        <p v-if="inviteError" class="cfg__error">{{ inviteError }}</p>
      </div>
    </section>
</template>
<script setup lang="ts">
import { ref, onMounted, onScopeDispose } from 'vue'
import { useFinanceStore } from '../stores/useFinanceStore'
const store = useFinanceStore()
const runtime = useRuntimeConfig()
let copiedTimer: ReturnType<typeof setTimeout> | undefined
onScopeDispose(() => clearTimeout(copiedTimer))
interface Member { userId: string; email: string; role: string; joinedAt: string }
interface Invite  { id: string; email: string; role: string; expiresAt: string }

const householdLoading = ref(false)
const members          = ref<Member[]>([])
const pendingInvites   = ref<Invite[]>([])
const inviteEmail      = ref('')
const inviteSending    = ref(false)
const inviteLink       = ref('')
const inviteError      = ref('')
const linkCopied       = ref(false)

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

const loadHousehold = async () => {
  householdLoading.value = true
  try {
    const data = await store.getHousehold()
    members.value      = data.members
    pendingInvites.value = data.invitations
  } catch { inviteError.value = 'Não foi possível carregar a família. Tente novamente.' } finally {
    householdLoading.value = false
  }
}

onMounted(loadHousehold)

const sendInvite = async () => {
  if (!inviteEmail.value || inviteSending.value) return
  inviteError.value = ''
  inviteLink.value  = ''
  inviteSending.value = true
  try {
    const res = await store.createInvitation(inviteEmail.value)
    const origin = (runtime.public.apiBaseUrl as string) || window.location.origin
    inviteLink.value = `${origin}/invite/${res.token}`
    inviteEmail.value = ''
    await loadHousehold()
  } catch (err: any) {
    inviteError.value = err?.data?.statusMessage ?? 'Erro ao criar convite.'
  } finally {
    inviteSending.value = false
  }
}

const copyInviteLink = async () => {
  await navigator.clipboard.writeText(inviteLink.value)
  linkCopied.value = true
  copiedTimer = setTimeout(() => { linkCopied.value = false }, 2000)
}
</script>

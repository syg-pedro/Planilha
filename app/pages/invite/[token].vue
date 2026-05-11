<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--bg)">
    <div style="width: 100%; max-width: 420px; background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 32px; text-align: center">

      <template v-if="state === 'loading'">
        <p style="color: var(--text3)">Verificando convite...</p>
      </template>

      <template v-else-if="state === 'needLogin'">
        <h1 style="font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 8px">Você foi convidado!</h1>
        <p style="font-size: 14px; color: var(--text2); margin-bottom: 24px">Faça login ou crie uma conta para aceitar o convite e acessar o household compartilhado.</p>
        <div style="display: flex; flex-direction: column; gap: 10px">
          <NuxtLink :to="`/login?redirect=/invite/${token}`">
            <button style="width: 100%; padding: 12px; border-radius: var(--radius-sm); border: none; background: var(--primary); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer">
              Entrar com conta existente
            </button>
          </NuxtLink>
          <NuxtLink :to="`/signup?redirect=/invite/${token}`">
            <button style="width: 100%; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; color: var(--text); font-size: 14px; font-weight: 600; cursor: pointer">
              Criar nova conta
            </button>
          </NuxtLink>
        </div>
      </template>

      <template v-else-if="state === 'confirming'">
        <h1 style="font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 8px">Aceitar convite?</h1>
        <p style="font-size: 14px; color: var(--text2); margin-bottom: 24px">
          Ao aceitar, você passará a ver os dados do household compartilhado. Seus dados atuais continuarão existindo mas você precisará de outro convite para voltar.
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px">
          <button
            style="width: 100%; padding: 12px; border-radius: var(--radius-sm); border: none; background: var(--primary); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer"
            :disabled="accepting"
            @click="accept"
          >
            {{ accepting ? 'Aceitando...' : 'Aceitar convite' }}
          </button>
          <NuxtLink to="/">
            <button style="width: 100%; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; color: var(--text); font-size: 14px; font-weight: 600; cursor: pointer">
              Cancelar
            </button>
          </NuxtLink>
        </div>
      </template>

      <template v-else-if="state === 'success'">
        <div style="width: 48px; height: 48px; background: color-mix(in srgb, var(--success) 15%, transparent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 style="font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 8px">Convite aceito!</h1>
        <p style="font-size: 14px; color: var(--text2); margin-bottom: 24px">Você agora faz parte do household compartilhado.</p>
        <NuxtLink to="/">
          <button style="width: 100%; padding: 12px; border-radius: var(--radius-sm); border: none; background: var(--primary); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer">
            Ir para o início
          </button>
        </NuxtLink>
      </template>

      <template v-else-if="state === 'error'">
        <h1 style="font-size: 20px; font-weight: 800; color: var(--danger); margin-bottom: 8px">Convite inválido</h1>
        <p style="font-size: 14px; color: var(--text2); margin-bottom: 24px">{{ errorMsg }}</p>
        <NuxtLink to="/">
          <button style="width: 100%; padding: 12px; border-radius: var(--radius-sm); border: none; background: var(--primary); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer">
            Voltar ao início
          </button>
        </NuxtLink>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const token    = route.params.token as string
const state    = ref<'loading' | 'needLogin' | 'confirming' | 'accepting' | 'success' | 'error'>('loading')
const errorMsg = ref('')
const accepting = ref(false)

onMounted(async () => {
  if (!supabase) { state.value = 'error'; errorMsg.value = 'Autenticação não configurada.'; return }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    state.value = 'needLogin'
    return
  }
  state.value = 'confirming'
})

const accept = async () => {
  accepting.value = true
  try {
    await $fetch('/api/invitations/accept', {
      method: 'POST',
      body: { token }
    })
    state.value = 'success'
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage ?? 'Erro ao aceitar o convite.'
    state.value = 'error'
  } finally {
    accepting.value = false
  }
}
</script>

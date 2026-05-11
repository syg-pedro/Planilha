import { defineEventHandler } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { assertEditKey } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { householdId } = await assertEditKey(event)
  const config = useRuntimeConfig(event)

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    return { householdId, members: [], invitations: [] }
  }

  const client = createClient(
    config.supabaseUrl as string,
    config.supabaseServiceKey as string,
    { auth: { persistSession: false } }
  )

  const [membersRes, invitesRes] = await Promise.all([
    client
      .from('household_members')
      .select('user_id, role, created_at')
      .eq('household_id', householdId),
    client
      .from('household_invitations')
      .select('id, email, role, expires_at, accepted_at, created_at')
      .eq('household_id', householdId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
  ])

  // Fetch emails for members via auth.users (service role only)
  const memberUserIds = (membersRes.data ?? []).map(m => m.user_id)
  const members: { userId: string; email: string; role: string; joinedAt: string }[] = []

  for (const m of membersRes.data ?? []) {
    const { data: userRes } = await client.auth.admin.getUserById(m.user_id)
    members.push({
      userId: m.user_id,
      email: userRes?.user?.email ?? m.user_id,
      role: m.role,
      joinedAt: m.created_at
    })
  }

  const invitations = (invitesRes.data ?? []).map(i => ({
    id: i.id,
    email: i.email,
    role: i.role,
    expiresAt: i.expires_at,
    createdAt: i.created_at
  }))

  return { householdId, members, invitations }
})

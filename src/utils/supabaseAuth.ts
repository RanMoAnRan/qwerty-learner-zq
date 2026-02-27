import type { BusinessSession } from '@/store/businessAtom'
import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  return { url, anonKey }
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig()
  return Boolean(url && anonKey)
}

export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig()
  if (!url || !anonKey) {
    throw new Error('Supabase 未配置，请检查 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY。')
  }
  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey)
  }
  return supabaseClient
}

export function toBusinessSession(user: User, previous?: BusinessSession | null): BusinessSession {
  const email = (user.email || previous?.email || '').trim()
  const metadataDisplayName = user.user_metadata?.display_name
  const displayName =
    typeof metadataDisplayName === 'string' && metadataDisplayName.trim()
      ? metadataDisplayName.trim()
      : email.split('@')[0] || previous?.displayName || 'qwerty_user'

  return {
    userId: user.id,
    email,
    displayName,
    premiumExpiresAt: previous?.userId === user.id ? previous.premiumExpiresAt : undefined,
  }
}

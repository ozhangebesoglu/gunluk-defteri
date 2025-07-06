// ==========================================
// GÜNCE DEFTERI - Supabase Client Configuration
// Context7 dokümantasyonuna uygun best practices
// ==========================================

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nbjnmhtgluctoeyrbgkd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iam5taHRnbHVjdG9leXJiZ2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5ODM4NDQsImV4cCI6MjA1MTU1OTg0NH0.FmFuLOb5a45w6wkPIm6iL9Ol3C8-KvhiUz2i4sRElgo'

// Context7 best practices: Optimized client configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'gunce-defteri@1.0.0'
    }
  }
})

// ==========================================
// AUTHENTICATION HELPERS (Context7 Pattern)
// ==========================================

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  })
  return { data, error }
}

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// ==========================================
// REAL-TIME HELPERS (Context7 Pattern)
// ==========================================

export const createUserChannel = (userId: string) => {
  return supabase.channel(`user-${userId}`)
}

export const subscribeToUserEntries = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`entries-${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'diary_entries',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe()
}

// ==========================================
// DATABASE HELPERS
// ==========================================

export const createProfile = async (user: any) => {
  // Context7 pattern: Null check ve fallback handling
  if (!user?.id || !user?.email) {
    console.error('[SUPABASE] createProfile: Invalid user object', user)
    return { data: null, error: { message: 'Invalid user object' } }
  }

  const profileData = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || 
               user.raw_user_meta_data?.full_name || 
               user.email?.split('@')[0] || 
               'Kullanıcı',
    avatar_url: user.user_metadata?.avatar_url || 
                user.raw_user_meta_data?.avatar_url
  }

  console.log('[SUPABASE] Creating profile with data:', profileData)

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileData, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select()
    .maybeSingle()

  return { data, error }
}

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

// ==========================================
// ERROR HANDLING
// ==========================================

export const handleSupabaseError = (error: any) => {
  console.error('[SUPABASE ERROR]:', error)
  
  if (error?.message?.includes('Invalid login credentials')) {
    return 'Geçersiz giriş bilgileri'
  }
  
  if (error?.message?.includes('Email not confirmed')) {
    return 'Email adresinizi doğrulayın'
  }
  
  if (error?.message?.includes('User already registered')) {
    return 'Bu email adresi zaten kayıtlı'
  }

  if (error?.message?.includes('validation_failed')) {
    return 'Giriş bilgileri doğrulanamadı'
  }

  if (error?.message?.includes('Unsupported provider')) {
    return 'Google giriş henüz etkinleştirilmemiş'
  }
  
  return error?.message || 'Bir hata oluştu'
}

// ==========================================
// DEVELOPMENT HELPERS
// ==========================================

if (import.meta.env.DEV) {
  console.log('[SUPABASE] Client initialized:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    environment: import.meta.env.MODE
  })
} 
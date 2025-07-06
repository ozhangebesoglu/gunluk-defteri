// ==========================================
// GÜNCE DEFTERI - Authentication Context (Context7 Uyumlu)
// Real-time sync + authentication state management
// ==========================================

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { 
  supabase, 
  signInWithGoogle as supabaseSignInWithGoogle,
  signInWithEmail as supabaseSignInWithEmail,
  signUpWithEmail as supabaseSignUpWithEmail,
  signOut as supabaseSignOut,
  createProfile,
  handleSupabaseError,
  createUserChannel
} from '../lib/supabase'
import { initializeCsrfToken, resetCsrfToken } from '../services/api'
import { logger } from '../utils/logger'
import { API_URL, isElectron } from '../config/env'

// ==========================================
// CONTEXT TYPES
// ==========================================

export interface SyncStatus {
  status: 'connected' | 'disconnected' | 'syncing' | 'synced' | 'offline' | 'conflict' | 'error'
  lastSync?: Date
  pendingChanges?: number
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  profile: any | null
  syncStatus: SyncStatus
  signInWithGoogle: () => Promise<{ error?: string }>
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signOut: () => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ==========================================
// DEMO USER DATA
// ==========================================

const DEMO_ENTRIES = [
  {
    id: 'demo-1',
    title: 'İlk Günce Yazım',
    content: 'Bugün günce defteri uygulamasını denemeye başladım. Gerçekten kullanışlı görünüyor!',
    entry_date: new Date().toISOString(),
    mood: 'positive',
    sentiment: 'positive',
    word_count: 15,
    is_favorite: true,
    tags: ['başlangıç', 'test']
  },
  {
    id: 'demo-2',
    title: 'Güzel Bir Gün',
    content: 'Bugün hava çok güzeldi. Park\'ta yürüyüş yaptım ve kitap okudum. Kendimi çok iyi hissediyorum.',
    entry_date: new Date(Date.now() - 86400000).toISOString(), // 1 gün önce
    mood: 'very_positive',
    sentiment: 'very_positive',
    word_count: 18,
    is_favorite: false,
    tags: ['doğa', 'kitap', 'yürüyüş']
  }
]

// ==========================================
// CONTEXT PROVIDER
// ==========================================

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: 'disconnected' })

  // ==========================================
  // INITIALIZATION (Context7 Pattern: Stable Auth Management)
  // ==========================================

  useEffect(() => {
    let isMounted = true
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return
      
      if (error) {
        logger.error('Session check error:', error)
        setLoading(false)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          initializeCsrfToken()
          loadUserProfile(session.user.id)
          setupRealTimeSync(session.user.id)
        }
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      logger.info(`[AUTH] State change: ${event}`, session?.user?.id)

      if (isElectron && session?.access_token && window.electron) {
        logger.info('[ELECTRON] Sending auth credentials to main process...');
        window.electron.ipcRenderer.send('set-auth-credentials', {
          token: session.access_token,
          baseUrl: API_URL,
        });
      }
      
      // Context7 pattern: Prevent unnecessary re-renders
      const newUser = session?.user ?? null
      const currentUserId = user?.id
      const newUserId = newUser?.id
      
      if (currentUserId !== newUserId) {
        setSession(session)
        setUser(newUser)
        
        if (newUser) {
          initializeCsrfToken()
          await handleUserSignIn(newUser)
        } else {
          setProfile(null)
          setSyncStatus({ status: 'disconnected' })
          resetCsrfToken()
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, []) // Context7: Empty dependency array for stability

  // ==========================================
  // USER PROFILE MANAGEMENT
  // ==========================================

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          logger.info('[AUTH] Creating new profile for user:', userId)
          
          // Context7 pattern: Session'dan user'ı al
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          
          if (currentUser) {
            const { data: newProfile, error: createError } = await createProfile(currentUser)
            if (createError) {
              logger.error('[AUTH] Profile creation error:', createError)
            } else {
              setProfile(newProfile)
              logger.success('[AUTH] Profile created:', newProfile?.full_name)
            }
          } else {
            logger.error('[AUTH] No current user found for profile creation')
          }
        } else {
          logger.error('[AUTH] Profile load error:', error)
        }
      } else {
        setProfile(data)
        logger.success('[AUTH] Profile loaded:', data.full_name)
      }
    } catch (error) {
      logger.error('[AUTH] Profile management error:', error)
    }
  }

  const handleUserSignIn = async (user: User) => {
    try {
      setSyncStatus({ status: 'syncing' })
      
      // Load or create profile
      await loadUserProfile(user.id)
      
      // Setup real-time sync
      setupRealTimeSync(user.id)
      
      setSyncStatus({ status: 'connected', lastSync: new Date() })
      logger.success(`[AUTH] User signed in: ${user.email}`)
      
    } catch (error) {
      logger.error('[AUTH] Sign in handling error:', error)
      setSyncStatus({ status: 'disconnected' })
    }
  }

  // ==========================================
  // REAL-TIME SYNC SETUP
  // ==========================================

  const setupRealTimeSync = (userId: string) => {
    try {
      const channel = createUserChannel(userId)
      
      channel
        .on('broadcast', { event: 'sync-status' }, (payload) => {
          logger.info('[SYNC] Status update:', payload)
          setSyncStatus({ status: payload.status || 'connected', lastSync: new Date() })
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'diary_entries',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          logger.info('[SYNC] Entry change detected:', payload.eventType)
          // Bu durumda global state update tetikleyebiliriz
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setSyncStatus({ status: 'connected', lastSync: new Date() })
            logger.success('[SYNC] Real-time connection established')
          } else if (status === 'CHANNEL_ERROR') {
            setSyncStatus({ status: 'disconnected' })
            logger.error('[SYNC] Real-time connection error')
          }
        })

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      logger.error('[SYNC] Setup error:', error)
      setSyncStatus({ status: 'disconnected' })
    }
  }

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================

  const signInWithGoogle = async () => {
    try {
      setSyncStatus({ status: 'syncing' })
      const { error } = await supabaseSignInWithGoogle()
      
      if (error) {
        setSyncStatus({ status: 'disconnected' })
        return { error: handleSupabaseError(error) }
      }
      
      return { error: undefined }
    } catch (error) {
      setSyncStatus({ status: 'disconnected' })
      logger.error('[AUTH] Google sign in error:', error)
      return { error: 'Google ile giriş yaparken bir hata oluştu' }
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setSyncStatus({ status: 'syncing' })

      // Demo kullanıcı kontrolü
      if (email === 'demo@guncedefteri.com' && password === 'demo123') {
        // Demo kullanıcı için fake session oluştur
        const demoUser = {
          id: 'demo-user-id',
          email: 'demo@guncedefteri.com',
          user_metadata: {
            full_name: 'Demo Kullanıcı'
          }
        }
        
        // Local storage'a demo verilerini kaydet
        localStorage.setItem('demo_user', JSON.stringify(demoUser))
        localStorage.setItem('demo_entries', JSON.stringify(DEMO_ENTRIES))
        
        setUser(demoUser as any)
        setProfile({ 
          id: 'demo-user-id', 
          email: 'demo@guncedefteri.com', 
          full_name: 'Demo Kullanıcı' 
        })
        setSyncStatus({ status: 'connected', lastSync: new Date() })
        
        logger.success('[AUTH] Demo user signed in')
        return { error: undefined }
      }

      const { error } = await supabaseSignInWithEmail(email, password)
      
      if (error) {
        setSyncStatus({ status: 'disconnected' })
        return { error: handleSupabaseError(error) }
      }
      
      return { error: undefined }
    } catch (error) {
      setSyncStatus({ status: 'disconnected' })
      logger.error('[AUTH] Email sign in error:', error)
      return { error: 'Giriş yaparken bir hata oluştu' }
    }
  }

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      setSyncStatus({ status: 'syncing' })
      const { error } = await supabaseSignUpWithEmail(email, password, fullName)
      
      if (error) {
        setSyncStatus({ status: 'disconnected' })
        return { error: handleSupabaseError(error) }
      }
      
      return { error: undefined }
    } catch (error) {
      setSyncStatus({ status: 'disconnected' })
      logger.error('[AUTH] Email sign up error:', error)
      return { error: 'Kayıt olurken bir hata oluştu' }
    }
  }

  const signOut = async () => {
    logger.info('[AUTH] Attempting to sign out...')
    try {
      const { error } = await supabaseSignOut()
      if (error) {
        logger.error('[AUTH] Sign out error:', error)
        return { error: handleSupabaseError(error) }
      }
      
      // Clear local state immediately after successful sign out
      setUser(null)
      setSession(null)
      setProfile(null)
      setSyncStatus({ status: 'disconnected' })
      resetCsrfToken()

      logger.success('[AUTH] User signed out successfully.')
      return {}
    } catch (error) {
      logger.error('[AUTH] Critical sign out error:', error)
      return { error: 'Çıkış yaparken beklenmedik bir hata oluştu.' }
    }
  }

  // ==========================================
  // CONTEXT VALUE (Context7 Pattern: Memoized for Performance)
  // ==========================================

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    loading,
    profile,
    syncStatus,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut
  }), [user, session, loading, profile, syncStatus])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ==========================================
// CONTEXT HOOK
// ==========================================

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 
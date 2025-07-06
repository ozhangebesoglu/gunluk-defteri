const { createClient } = require('@supabase/supabase-js')

// Context7 dokümanına uygun Supabase konfigürasyonu
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

// Supabase client oluştur (Backend için anon key kullanıyoruz)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  // Context7 dokümanına göre RLS bypass için service role
  db: {
    schema: 'public'
  },
  // Real-time konfigürasyonu (ileride kullanım için)
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Health check fonksiyonu
const healthCheck = async () => {
  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('count')
      .limit(1)
    
    if (error) throw error
    
    return {
      status: 'OK',
      message: 'Supabase connection successful',
      timestamp: new Date().toISOString(),
      url: supabaseUrl.substring(0, 30) + '...'
    }
  } catch (error) {
    throw new Error(`Supabase connection failed: ${error.message}`)
  }
}

// Test connection on startup
if (process.env.NODE_ENV !== 'test') {
  healthCheck()
    .then(result => {
      console.log('✅ Supabase Backend Connection:', result.message)
    })
    .catch(error => {
      console.error('❌ Supabase Backend Connection Failed:', error.message)
    })
}

module.exports = {
  supabase,
  healthCheck
} 
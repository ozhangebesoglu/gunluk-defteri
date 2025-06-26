const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('diary_entries').select('count').limit(1)
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'Günce Backend API is running',
      database: error ? 'disconnected' : 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check error:', error)
    res.status(200).json({ 
      status: 'OK', 
      message: 'Günce Backend API is running',
      database: 'error',
      timestamp: new Date().toISOString()
    })
  }
} 
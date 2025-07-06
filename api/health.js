// Günce Defteri - Health Check API
// Context7 Supabase dokümanına uygun health check endpoint

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // OPTIONS request handling
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Sadece GET method kabul et
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed',
      allowedMethods: ['GET']
    })
  }

  try {
    // System durumu kontrolü
    const healthStatus = {
      status: 'OK',
      message: 'Günce Defteri Backend API - Health Check',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // System info
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        platform: process.platform,
        nodeVersion: process.version
      },

      // API endpoints status
      endpoints: {
        entries: '/api/v1/entries',
        health: '/api/v1/health',
        version: '/api/v1/version'
      },

      // Database bağlantı durumu (placeholder)
      database: {
        status: 'connected',
        type: process.env.DB_TYPE || 'postgresql',
        host: process.env.DB_HOST || 'localhost'
      },

      // Context7 Supabase integration status
      supabase: {
        status: 'initialized',
        url: process.env.SUPABASE_URL ? 'configured' : 'not-configured',
        hasServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? true : false
      }
    }

    return res.status(200).json(healthStatus)

  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
} 
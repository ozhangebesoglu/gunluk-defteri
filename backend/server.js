const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const { v4: uuidv4 } = require('uuid')
const { supabase } = require('./supabase.config')
const envConfig = require('./config/env')

// Simple logger for backend
const isDev = process.env.NODE_ENV === 'development'
const logger = {
  info: (msg, data) => isDev && console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
  success: (msg, data) => isDev && console.log(`[SUCCESS] ${msg}`, data || '')
}

const app = express()
const config = envConfig.getConfig()
const PORT = config.server.port

// Security middleware
app.use(helmet())
app.use(compression())

// Rate limiting
if (config.features.rateLimit) {
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP'
  })
  app.use('/api/', limiter)
}

// CORS configuration
app.use(cors({
  origin: config.cors.origins,
  credentials: config.cors.credentials
}))

app.use(express.json({ limit: '10mb' }))

logger.info('Starting Günce Defteri Backend Server...')

// API Routes
app.get('/api/v1/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('diary_entries').select('count').limit(1)
    
    res.json({ 
      status: 'OK', 
      message: 'Günce Backend API is running',
      database: error ? 'disconnected' : 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.json({ 
      status: 'OK', 
      message: 'Günce Backend API is running',
      database: 'error',
      timestamp: new Date().toISOString()
    })
  }
})

// Get all entries
app.get('/api/v1/entries', async (req, res) => {
  try {
    const { data: entries, error } = await supabase
      .from('diary_entries')
      .select('*')
      .order('entry_date', { ascending: false })
    
    if (error) throw error
    
    res.json(entries || [])
  } catch (error) {
    logger.error('Entries fetch failed:', error)
    res.status(500).json({ error: 'Entries fetch failed', details: error.message })
  }
})

// Get single entry
app.get('/api/v1/entries/:id', async (req, res) => {
  try {
    const { data: entry, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('id', req.params.id)
      .single()
    
    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Entry not found' })
    }
    
    if (error) throw error
    
    res.json(entry)
  } catch (error) {
    logger.error('Entry fetch failed:', error)
    res.status(500).json({ error: 'Entry fetch failed', details: error.message })
  }
})

// Create entry
app.post('/api/v1/entries', async (req, res) => {
  try {
    const { title, content, entry_date, sentiment, tags, weather, location } = req.body
    
    // Input validation
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' })
    }
    
    const newEntry = {
      id: uuidv4(),
      title: title.trim(),
      content: content.trim(),
      entry_date: entry_date || new Date().toISOString().split('T')[0],
      sentiment: sentiment || 'neutral',
      word_count: content.trim().split(/\s+/).length,
      is_favorite: false,
      tags: tags || [],
      weather: weather || null,
      location: location || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: savedEntry, error } = await supabase
      .from('diary_entries')
      .insert([newEntry])
      .select()
      .single()
    
    if (error) throw error
    
    logger.success('New entry created:', savedEntry.id)
    res.status(201).json(savedEntry)
  } catch (error) {
    logger.error('Entry creation failed:', error)
    res.status(500).json({ error: 'Entry creation failed', details: error.message })
  }
})

// Update entry
app.put('/api/v1/entries/:id', async (req, res) => {
  try {
    const entryId = req.params.id
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    }
    
    // Calculate word count if content is updated
    if (updateData.content) {
      updateData.word_count = updateData.content.trim().split(/\s+/).length
    }
    
    const { data: updatedEntry, error } = await supabase
      .from('diary_entries')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single()
    
    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Entry not found' })
    }
    
    if (error) throw error
    
    logger.success('Entry updated:', updatedEntry.id)
    res.json(updatedEntry)
  } catch (error) {
    logger.error('Entry update failed:', error)
    res.status(500).json({ error: 'Entry update failed', details: error.message })
  }
})

// Delete entry
app.delete('/api/v1/entries/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    
    logger.success('Entry deleted:', req.params.id)
    res.status(204).send()
  } catch (error) {
    logger.error('Entry deletion failed:', error)
    res.status(500).json({ error: 'Entry deletion failed', details: error.message })
  }
})

// Delete all entries
app.delete('/api/v1/entries', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('diary_entries')
      .delete()
      .neq('id', 'impossible-id') // Delete all trick
    
    if (error) throw error
    
    logger.success('All entries deleted')
    res.json({ 
      success: true, 
      message: `All entries deleted`,
      deletedCount: count || 0
    })
  } catch (error) {
    logger.error('Delete all entries failed:', error)
    res.status(500).json({ error: 'Delete all entries failed', details: error.message })
  }
})

// Toggle favorite
app.post('/api/v1/entries/:id/favorite', async (req, res) => {
  try {
    // First get the current entry
    const { data: currentEntry, error: fetchError } = await supabase
      .from('diary_entries')
      .select('is_favorite')
      .eq('id', req.params.id)
      .single()
    
    if (fetchError && fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Entry not found' })
    }
    
    if (fetchError) throw fetchError
    
    // Toggle favorite status
    const { data: updatedEntry, error } = await supabase
      .from('diary_entries')
      .update({ 
        is_favorite: !currentEntry.is_favorite,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    
    logger.success('Favorite toggled:', updatedEntry.id)
    res.json(updatedEntry)
  } catch (error) {
    logger.error('Favorite toggle failed:', error)
    res.status(500).json({ error: 'Favorite toggle failed', details: error.message })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// Error handler
app.use((error, req, res, next) => {
  logger.error('Server Error:', error)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  logger.info(`Günce Backend API running on port ${PORT}`)
  logger.info(`Health check: http://localhost:${PORT}/api/v1/health`)
  logger.info('Supabase connection: Ready')
  
  // Log configuration in development
  envConfig.logConfig()
}) 
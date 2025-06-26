const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const { v4: uuidv4 } = require('uuid')
const { supabase } = require('./supabase.config')

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})
app.use('/api/', limiter)

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://gunce.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))

console.log('🚀 Starting Günce Defteri Backend Server...')

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
    console.error('❌ Entries fetch failed:', error)
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
    console.error('❌ Entry fetch failed:', error)
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
    
    console.log('✅ New entry created:', savedEntry.id)
    res.status(201).json(savedEntry)
  } catch (error) {
    console.error('❌ Entry creation failed:', error)
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
    
    console.log('✅ Entry updated:', updatedEntry.id)
    res.json(updatedEntry)
  } catch (error) {
    console.error('❌ Entry update failed:', error)
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
    
    console.log('✅ Entry deleted:', req.params.id)
    res.status(204).send()
  } catch (error) {
    console.error('❌ Entry deletion failed:', error)
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
    
    console.log('✅ All entries deleted')
    res.json({ 
      success: true, 
      message: `All entries deleted`,
      deletedCount: count || 0
    })
  } catch (error) {
    console.error('❌ Delete all entries failed:', error)
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
    
    console.log('✅ Favorite toggled:', updatedEntry.id)
    res.json(updatedEntry)
  } catch (error) {
    console.error('❌ Favorite toggle failed:', error)
    res.status(500).json({ error: 'Favorite toggle failed', details: error.message })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// Error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 Günce Backend API running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`)
  console.log(`🔗 Supabase connection: Ready`)
}) 
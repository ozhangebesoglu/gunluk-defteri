const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

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

  try {
    switch (req.method) {
      case 'GET':
        return await getEntries(req, res)
      case 'POST':
        return await createEntry(req, res)
      case 'DELETE':
        return await deleteAllEntries(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

// Get all entries
async function getEntries(req, res) {
  const { data: entries, error } = await supabase
    .from('diary_entries')
    .select('*')
    .order('entry_date', { ascending: false })
  
  if (error) throw error
  
  res.status(200).json(entries || [])
}

// Create entry
async function createEntry(req, res) {
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
}

// Delete all entries
async function deleteAllEntries(req, res) {
  const { count, error } = await supabase
    .from('diary_entries')
    .delete()
    .neq('id', 'impossible-id') // Delete all trick
  
  if (error) throw error
  
  console.log('✅ All entries deleted')
  res.status(200).json({ 
    success: true, 
    message: `All entries deleted`,
    deletedCount: count || 0
  })
} 
const { supabase } = require('../../backend/supabase.config')

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query

  try {
    switch (req.method) {
      case 'GET':
        return await getEntry(req, res, id)
      case 'PUT':
        return await updateEntry(req, res, id)
      case 'DELETE':
        return await deleteEntry(req, res, id)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

// Get single entry
async function getEntry(req, res, id) {
  const { data: entry, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error && error.code === 'PGRST116') {
    return res.status(404).json({ error: 'Entry not found' })
  }
  
  if (error) throw error
  
  res.status(200).json(entry)
}

// Update entry
async function updateEntry(req, res, id) {
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
    .eq('id', id)
    .select()
    .single()
  
  if (error && error.code === 'PGRST116') {
    return res.status(404).json({ error: 'Entry not found' })
  }
  
  if (error) throw error
  
  console.log('✅ Entry updated:', updatedEntry.id)
  res.status(200).json(updatedEntry)
}

// Delete entry
async function deleteEntry(req, res, id) {
  const { error } = await supabase
    .from('diary_entries')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  console.log('✅ Entry deleted:', id)
  res.status(204).end()
} 
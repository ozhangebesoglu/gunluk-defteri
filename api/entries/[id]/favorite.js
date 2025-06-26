const { supabase } = require('../../../backend/supabase.config')

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  try {
    // First get the current entry
    const { data: currentEntry, error: fetchError } = await supabase
      .from('diary_entries')
      .select('is_favorite')
      .eq('id', id)
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
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Favorite toggled:', updatedEntry.id)
    res.status(200).json(updatedEntry)
  } catch (error) {
    console.error('❌ Favorite toggle failed:', error)
    res.status(500).json({ error: 'Favorite toggle failed', details: error.message })
  }
} 
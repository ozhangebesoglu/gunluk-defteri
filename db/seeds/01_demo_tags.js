const { v4: uuidv4 } = require('uuid')

exports.seed = async function(knex) {
  await knex('diary_tags').del()
  
  await knex('diary_tags').insert([
    { id: uuidv4(), name: 'Mutluluk', color: '#FFD700', description: 'Mutlu anları etiketlemek için' },
    { id: uuidv4(), name: 'Üzgün', color: '#4169E1', description: 'Üzgün hissettiğim günler' },
    { id: uuidv4(), name: 'İş', color: '#FF6347', description: 'İş ile ilgili günlük kayıtları' },
    { id: uuidv4(), name: 'Aile', color: '#32CD32', description: 'Aile ile geçirilen zamanlar' },
    { id: uuidv4(), name: 'Seyahat', color: '#FF69B4', description: 'Seyahat anıları' },
    { id: uuidv4(), name: 'Başarı', color: '#9370DB', description: 'Başarı hikayeleri' },
    { id: uuidv4(), name: 'Öğrenme', color: '#20B2AA', description: 'Yeni öğrenilen şeyler' },
    { id: uuidv4(), name: 'Sağlık', color: '#228B22', description: 'Sağlık ve spor kayıtları' }
  ])
} 
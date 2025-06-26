const { v4: uuidv4 } = require('uuid')

exports.seed = async function(knex) {
  await knex('user_settings').del()
  
  await knex('user_settings').insert([
    { id: uuidv4(), setting_key: 'theme', setting_value: 'light', data_type: 'string' },
    { id: uuidv4(), setting_key: 'language', setting_value: 'tr', data_type: 'string' },
    { id: uuidv4(), setting_key: 'auto_backup', setting_value: 'true', data_type: 'boolean' },
    { id: uuidv4(), setting_key: 'backup_frequency', setting_value: '7', data_type: 'number' },
    { id: uuidv4(), setting_key: 'enable_encryption', setting_value: 'false', data_type: 'boolean' },
    { id: uuidv4(), setting_key: 'sentiment_analysis', setting_value: 'true', data_type: 'boolean' },
    { id: uuidv4(), setting_key: 'entries_per_page', setting_value: '10', data_type: 'number' },
    { id: uuidv4(), setting_key: 'default_view', setting_value: 'list', data_type: 'string' },
    { id: uuidv4(), setting_key: 'reminder_enabled', setting_value: 'false', data_type: 'boolean' },
    { id: uuidv4(), setting_key: 'reminder_time', setting_value: '20:00', data_type: 'string' }
  ])
} 
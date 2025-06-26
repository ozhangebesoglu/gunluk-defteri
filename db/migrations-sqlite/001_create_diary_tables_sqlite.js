exports.up = function(knex) {
  return knex.schema
    .createTable('diary_entries', function(table) {
      table.string('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'))
      table.string('title', 255).notNullable()
      table.text('content').notNullable()
      table.text('encrypted_content') // Şifrelenmiş içerik
      table.date('entry_date').notNullable()
      table.string('day_of_week', 20)
      table.text('tags') // SQLite'da JSON string olarak saklanacak
      table.string('sentiment', 20)
      table.float('sentiment_score').defaultTo(0)
      table.string('weather', 50)
      table.string('location', 255)
      table.boolean('is_favorite').defaultTo(false)
      table.boolean('is_encrypted').defaultTo(false)
      table.integer('word_count').defaultTo(0)
      table.integer('read_time').defaultTo(0) // dakika cinsinden
      table.timestamp('created_at').defaultTo(knex.fn.now())
      table.timestamp('updated_at').defaultTo(knex.fn.now())
      
      // İndeksler
      table.index(['entry_date'])
      table.index(['sentiment'])
      table.index(['is_favorite'])
    })
    .createTable('diary_tags', function(table) {
      table.string('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'))
      table.string('name', 100).notNullable().unique()
      table.string('color', 7).notNullable().defaultTo('#007bff')
      table.text('description')
      table.integer('usage_count').defaultTo(0)
      table.timestamp('created_at').defaultTo(knex.fn.now())
    })
    .createTable('user_settings', function(table) {
      table.string('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(16))))'))
      table.string('setting_key', 100).notNullable().unique()
      table.text('setting_value')
      table.string('data_type', 20).defaultTo('string')
      table.timestamp('updated_at').defaultTo(knex.fn.now())
    })
}

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_settings')
    .dropTableIfExists('diary_tags')
    .dropTableIfExists('diary_entries')
} 
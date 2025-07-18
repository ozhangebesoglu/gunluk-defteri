exports.up = function(knex) {
  return knex.schema
    .createTable('diary_entries', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('auth.users').onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.text('content').notNullable()
      table.text('encrypted_content') // Şifrelenmiş içerik
      table.date('entry_date').notNullable()
      table.string('day_of_week', 20).notNullable()
      table.specificType('tags', 'text[]').defaultTo(knex.raw('ARRAY[]::text[]'))
      table.enum('sentiment', ['very_positive', 'positive', 'neutral', 'negative', 'very_negative'])
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
      table.index(['user_id'])
      table.index(['entry_date'])
      table.index(['sentiment'])
      table.index(['is_favorite'])
    })
    .createTable('diary_tags', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('auth.users').onDelete('CASCADE')
      table.string('name', 100).notNullable().unique()
      table.string('color', 7).notNullable().defaultTo('#007bff')
      table.text('description')
      table.integer('usage_count').defaultTo(0)
      table.timestamp('created_at').defaultTo(knex.fn.now())
      table.timestamp('updated_at').defaultTo(knex.fn.now())
      table.unique(['user_id', 'name'])
    })
    .createTable('user_settings', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('auth.users').onDelete('CASCADE')
      table.string('setting_key', 100).notNullable()
      table.text('setting_value')
      table.string('data_type', 20).defaultTo('string')
      table.timestamp('updated_at').defaultTo(knex.fn.now())
      table.unique(['user_id', 'setting_key'])
    })
}

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_settings')
    .dropTableIfExists('diary_tags')
    .dropTableIfExists('diary_entries')
}
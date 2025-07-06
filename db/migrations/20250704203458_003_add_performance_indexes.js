/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('diary_entries', function(table) {
    // Check if user_id column exists before adding it
    // This is for existing schemas that might need altering
    table.uuid('user_id').notNullable().references('id').inTable('auth.users').onDelete('CASCADE').alter({ alter: true }).catch(() => {});
    
    // Drop old indexes if they exist, to recreate them with user_id
    table.dropIndex(['entry_date']);
    
    // Add new composite indexes for performance
    table.index(['user_id', 'entry_date'], 'idx_user_entry_date');
    table.index(['user_id', 'is_favorite'], 'idx_user_favorite');
  })
  .table('user_settings', function(table) {
    table.uuid('user_id').notNullable().references('id').inTable('auth.users').onDelete('CASCADE').alter({ alter: true }).catch(() => {});
    table.dropUnique(['setting_key']);
    table.unique(['user_id', 'setting_key'], {indexName: 'idx_user_setting_key_unique'});
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('diary_entries', function(table) {
    table.dropIndex(['user_id', 'entry_date'], 'idx_user_entry_date');
    table.dropIndex(['user_id', 'is_favorite'], 'idx_user_favorite');
    
    // Re-create old index
    table.index(['entry_date']);
  })
  .table('user_settings', function(table) {
      table.dropUnique(['user_id', 'setting_key'], 'idx_user_setting_key_unique');
      table.unique(['setting_key']);
  });
};

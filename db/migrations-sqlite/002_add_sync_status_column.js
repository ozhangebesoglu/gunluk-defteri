exports.up = function(knex) {
  return knex.schema.table('diary_entries', function(table) {
    table.string('sync_status').defaultTo('synced').notNullable();
    table.index('sync_status');
    // updated_at sütunu zaten olmalı, ama yoksa diye ekleyelim.
    if (!knex.schema.hasColumn('diary_entries', 'updated_at')) {
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }
  });
};

exports.down = function(knex) {
  return knex.schema.table('diary_entries', function(table) {
    table.dropColumn('sync_status');
  });
}; 
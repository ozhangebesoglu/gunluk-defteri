exports.up = function(knex) {
  return knex.schema.raw(`
    -- Hızlı arama için composite indexler
    CREATE INDEX idx_diary_entries_date_sentiment ON diary_entries (entry_date, sentiment);
    CREATE INDEX idx_diary_entries_tags_gin ON diary_entries USING GIN (tags);
    
    -- Full-text search için
    CREATE INDEX idx_diary_entries_search ON diary_entries USING GIN (
      to_tsvector('turkish', title || ' ' || content)
    );
  `)
}

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP INDEX IF EXISTS idx_diary_entries_date_sentiment;
    DROP INDEX IF EXISTS idx_diary_entries_tags_gin;
    DROP INDEX IF EXISTS idx_diary_entries_search;
  `)
} 
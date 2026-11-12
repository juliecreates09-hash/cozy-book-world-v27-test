CREATE TABLE IF NOT EXISTS conversion_counts (
  event_date TEXT NOT NULL,
  event_type TEXT NOT NULL,
  book_id TEXT NOT NULL,
  language TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (event_date, event_type, book_id, language)
);

CREATE TABLE IF NOT EXISTS docs_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,
  version TEXT NOT NULL,
  answer TEXT NOT NULL CHECK (answer IN ('yes', 'no')),
  submitted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS docs_feedback_page_submitted_at
  ON docs_feedback (page, submitted_at);

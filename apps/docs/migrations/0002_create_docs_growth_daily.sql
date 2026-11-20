CREATE TABLE docs_growth_daily (
  day TEXT NOT NULL,
  docs_version TEXT NOT NULL,
  event TEXT NOT NULL,
  source TEXT NOT NULL,
  setup TEXT NOT NULL,
  target TEXT NOT NULL,
  total INTEGER NOT NULL,
  PRIMARY KEY (day, docs_version, event, source, setup, target)
) WITHOUT ROWID;

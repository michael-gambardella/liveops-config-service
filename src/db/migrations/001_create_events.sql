CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'active', 'archived')),
  start_time  TIMESTAMPTZ  NOT NULL,
  end_time    TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_events_status     ON events (status);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events (start_time);

CREATE TABLE IF NOT EXISTS configs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID        NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  version      INTEGER     NOT NULL,
  payload      JSONB       NOT NULL DEFAULT '{}',
  status       VARCHAR(20) NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'published', 'rolled_back')),
  published_at TIMESTAMPTZ,
  published_by VARCHAR(255),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, version)
);

CREATE INDEX IF NOT EXISTS idx_configs_event_id ON configs (event_id);
CREATE INDEX IF NOT EXISTS idx_configs_status   ON configs (status);

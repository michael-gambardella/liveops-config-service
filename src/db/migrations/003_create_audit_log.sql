CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('event', 'config')),
  entity_id   UUID        NOT NULL,
  action      VARCHAR(20) NOT NULL
                          CHECK (action IN ('created', 'updated', 'published', 'rolled_back', 'archived')),
  actor       VARCHAR(255) NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity     ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log (created_at);

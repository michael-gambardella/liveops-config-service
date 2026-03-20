import { pool } from '../client';
import { AuditEntry, AuditAction, AuditEntityType } from '../../types';

export async function createAuditEntry(data: {
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  actor: string;
  metadata?: Record<string, unknown>;
}): Promise<AuditEntry> {
  const { rows } = await pool.query(
    `INSERT INTO audit_log (entity_type, entity_id, action, actor, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.entity_type,
      data.entity_id,
      data.action,
      data.actor,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );
  return rows[0];
}

export async function getAuditEntries(params: {
  entity_type?: AuditEntityType;
  entity_id?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditEntry[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.entity_type) {
    conditions.push(`entity_type = $${idx++}`);
    values.push(params.entity_type);
  }
  if (params.entity_id) {
    conditions.push(`entity_id = $${idx++}`);
    values.push(params.entity_id);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  values.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
    values
  );
  return rows;
}

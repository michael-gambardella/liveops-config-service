import { pool } from '../client';
import { EventConfig } from '../../types';

export async function getConfigsByEventId(event_id: string): Promise<EventConfig[]> {
  const { rows } = await pool.query(
    'SELECT * FROM configs WHERE event_id = $1 ORDER BY version DESC',
    [event_id]
  );
  return rows;
}

export async function getConfigById(id: string): Promise<EventConfig | null> {
  const { rows } = await pool.query('SELECT * FROM configs WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function getNextVersion(event_id: string): Promise<number> {
  const { rows } = await pool.query(
    'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM configs WHERE event_id = $1',
    [event_id]
  );
  return rows[0].next_version;
}

export async function createConfig(data: {
  event_id: string;
  payload: Record<string, unknown>;
  version: number;
}): Promise<EventConfig> {
  const { rows } = await pool.query(
    `INSERT INTO configs (event_id, version, payload)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.event_id, data.version, JSON.stringify(data.payload)]
  );
  return rows[0];
}

export async function publishConfig(id: string, published_by: string): Promise<EventConfig | null> {
  const { rows } = await pool.query(
    `UPDATE configs
     SET status = 'published', published_at = NOW(), published_by = $2, updated_at = NOW()
     WHERE id = $1 AND status = 'draft'
     RETURNING *`,
    [id, published_by]
  );
  return rows[0] ?? null;
}

export async function rollbackConfig(id: string): Promise<EventConfig | null> {
  const { rows } = await pool.query(
    `UPDATE configs
     SET status = 'rolled_back', updated_at = NOW()
     WHERE id = $1 AND status = 'published'
     RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getPublishedConfigForEvent(event_id: string): Promise<EventConfig | null> {
  const { rows } = await pool.query(
    `SELECT * FROM configs
     WHERE event_id = $1 AND status = 'published'
     ORDER BY version DESC
     LIMIT 1`,
    [event_id]
  );
  return rows[0] ?? null;
}

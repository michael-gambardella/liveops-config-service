import { pool } from '../client';
import { LiveEvent } from '../../types';

export async function getAllEvents(status?: string): Promise<LiveEvent[]> {
  const { rows } = status
    ? await pool.query('SELECT * FROM events WHERE status = $1 ORDER BY start_time DESC', [status])
    : await pool.query('SELECT * FROM events ORDER BY start_time DESC');
  return rows;
}

export async function getEventById(id: string): Promise<LiveEvent | null> {
  const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function createEvent(data: {
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
}): Promise<LiveEvent> {
  const { rows } = await pool.query(
    `INSERT INTO events (name, description, start_time, end_time)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.name, data.description ?? null, data.start_time, data.end_time]
  );
  return rows[0];
}

export async function updateEvent(
  id: string,
  data: Partial<{ name: string; description: string; status: string; start_time: string; end_time: string }>
): Promise<LiveEvent | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return null;

  fields.push('updated_at = NOW()');
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE events SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function archiveEvent(id: string): Promise<LiveEvent | null> {
  const { rows } = await pool.query(
    `UPDATE events SET status = 'archived', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}

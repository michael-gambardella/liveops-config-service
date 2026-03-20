export type EventStatus = 'draft' | 'active' | 'archived';
export type ConfigStatus = 'draft' | 'published' | 'rolled_back';
export type AuditAction = 'created' | 'updated' | 'published' | 'rolled_back' | 'archived';
export type AuditEntityType = 'event' | 'config';

export interface LiveEvent {
  id: string;
  name: string;
  description: string | null;
  status: EventStatus;
  start_time: Date;
  end_time: Date;
  created_at: Date;
  updated_at: Date;
}

export interface EventConfig {
  id: string;
  event_id: string;
  version: number;
  payload: Record<string, unknown>;
  status: ConfigStatus;
  published_at: Date | null;
  published_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AuditEntry {
  id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  actor: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

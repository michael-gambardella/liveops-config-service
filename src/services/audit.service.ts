import * as auditQueries from '../db/queries/audit.queries';
import { AuditAction, AuditEntityType, AuditEntry } from '../types';

export async function logAction(params: {
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  actor: string;
  metadata?: Record<string, unknown>;
}): Promise<AuditEntry> {
  return auditQueries.createAuditEntry(params);
}

export async function getAuditLog(params: {
  entity_type?: AuditEntityType;
  entity_id?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditEntry[]> {
  return auditQueries.getAuditEntries(params);
}

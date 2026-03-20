import * as eventQueries from '../db/queries/events.queries';
import { logAction } from './audit.service';
import { CreateEventInput, UpdateEventInput } from '../schemas/event.schema';
import { LiveEvent } from '../types';
import { createError } from '../middleware/errorHandler';

export async function listEvents(status?: string): Promise<LiveEvent[]> {
  return eventQueries.getAllEvents(status);
}

export async function getEvent(id: string): Promise<LiveEvent> {
  const event = await eventQueries.getEventById(id);
  if (!event) throw createError('Event not found', 404);
  return event;
}

export async function createEvent(data: CreateEventInput, actor: string): Promise<LiveEvent> {
  const event = await eventQueries.createEvent(data);
  await logAction({ entity_type: 'event', entity_id: event.id, action: 'created', actor });
  return event;
}

export async function updateEvent(
  id: string,
  data: UpdateEventInput,
  actor: string
): Promise<LiveEvent> {
  const existing = await eventQueries.getEventById(id);
  if (!existing) throw createError('Event not found', 404);

  const updated = await eventQueries.updateEvent(id, data);
  if (!updated) throw createError('Event not found', 404);

  await logAction({
    entity_type: 'event',
    entity_id: id,
    action: 'updated',
    actor,
    metadata: { before: existing, after: updated },
  });
  return updated;
}

export async function archiveEvent(id: string, actor: string): Promise<LiveEvent> {
  const existing = await eventQueries.getEventById(id);
  if (!existing) throw createError('Event not found', 404);

  const archived = await eventQueries.archiveEvent(id);
  if (!archived) throw createError('Event not found', 404);

  await logAction({ entity_type: 'event', entity_id: id, action: 'archived', actor });
  return archived;
}

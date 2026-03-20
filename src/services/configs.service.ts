import * as configQueries from '../db/queries/configs.queries';
import * as eventQueries from '../db/queries/events.queries';
import { logAction } from './audit.service';
import { CreateConfigInput, PublishConfigInput } from '../schemas/config.schema';
import { EventConfig } from '../types';
import { createError } from '../middleware/errorHandler';

export async function listConfigs(event_id: string): Promise<EventConfig[]> {
  return configQueries.getConfigsByEventId(event_id);
}

export async function getConfig(id: string): Promise<EventConfig> {
  const config = await configQueries.getConfigById(id);
  if (!config) throw createError('Config not found', 404);
  return config;
}

export async function createConfig(data: CreateConfigInput, actor: string): Promise<EventConfig> {
  const event = await eventQueries.getEventById(data.event_id);
  if (!event) throw createError('Event not found', 404);

  const version = await configQueries.getNextVersion(data.event_id);
  const config = await configQueries.createConfig({ ...data, version });

  await logAction({
    entity_type: 'config',
    entity_id: config.id,
    action: 'created',
    actor,
    metadata: { event_id: data.event_id, version },
  });
  return config;
}

export async function publishConfig(
  id: string,
  data: PublishConfigInput
): Promise<EventConfig> {
  const existing = await configQueries.getConfigById(id);
  if (!existing) throw createError('Config not found', 404);
  if (existing.status !== 'draft') {
    throw createError('Only draft configs can be published', 409);
  }

  const published = await configQueries.publishConfig(id, data.published_by);
  if (!published) throw createError('Failed to publish config', 500);

  await logAction({
    entity_type: 'config',
    entity_id: id,
    action: 'published',
    actor: data.published_by,
    metadata: { event_id: existing.event_id, version: existing.version },
  });
  return published;
}

export async function rollbackConfig(id: string, actor: string): Promise<EventConfig> {
  const existing = await configQueries.getConfigById(id);
  if (!existing) throw createError('Config not found', 404);
  if (existing.status !== 'published') {
    throw createError('Only published configs can be rolled back', 409);
  }

  const rolled = await configQueries.rollbackConfig(id);
  if (!rolled) throw createError('Failed to rollback config', 500);

  await logAction({
    entity_type: 'config',
    entity_id: id,
    action: 'rolled_back',
    actor,
    metadata: { event_id: existing.event_id, version: existing.version },
  });
  return rolled;
}

import { z } from 'zod';

export const createConfigSchema = z.object({
  event_id: z.string().uuid(),
  payload: z.record(z.unknown()),
});

export const publishConfigSchema = z.object({
  published_by: z.string().min(1).max(255),
});

export type CreateConfigInput = z.infer<typeof createConfigSchema>;
export type PublishConfigInput = z.infer<typeof publishConfigSchema>;
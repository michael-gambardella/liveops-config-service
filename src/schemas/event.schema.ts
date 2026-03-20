import { z } from 'zod';

export const createEventSchema = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    start_time: z.string().datetime(),
    end_time: z.string().datetime(),
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: 'end_time must be after start_time',
    path: ['end_time'],
  });

export const updateEventSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    start_time: z.string().datetime().optional(),
    end_time: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        return new Date(data.end_time) > new Date(data.start_time);
      }
      return true;
    },
    { message: 'end_time must be after start_time', path: ['end_time'] }
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

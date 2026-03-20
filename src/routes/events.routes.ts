import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validateBody';
import { createEventSchema, updateEventSchema } from '../schemas/event.schema';
import * as eventsService from '../services/events.service';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const events = await eventsService.listEvents(status);
    res.json({ data: events });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventsService.getEvent(req.params.id);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  validateBody(createEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = (req.headers['x-actor'] as string) || 'anonymous';
      const event = await eventsService.createEvent(req.body, actor);
      res.status(201).json(event);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id',
  validateBody(updateEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = (req.headers['x-actor'] as string) || 'anonymous';
      const event = await eventsService.updateEvent(req.params.id, req.body, actor);
      res.json(event);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'anonymous';
    const event = await eventsService.archiveEvent(req.params.id, actor);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

export default router;

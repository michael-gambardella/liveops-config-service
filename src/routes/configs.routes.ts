import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validateBody';
import { createConfigSchema, publishConfigSchema } from '../schemas/config.schema';
import * as configsService from '../services/configs.service';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event_id = req.query.event_id as string | undefined;
    if (!event_id) {
      res.status(400).json({ error: 'event_id query parameter is required' });
      return;
    }
    const configs = await configsService.listConfigs(event_id);
    res.json({ data: configs });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await configsService.getConfig(req.params.id);
    res.json(config);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  validateBody(createConfigSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = (req.headers['x-actor'] as string) || 'anonymous';
      const config = await configsService.createConfig(req.body, actor);
      res.status(201).json(config);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/publish',
  validateBody(publishConfigSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await configsService.publishConfig(req.params.id, req.body);
      res.json(config);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/:id/rollback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'anonymous';
    const config = await configsService.rollbackConfig(req.params.id, actor);
    res.json(config);
  } catch (err) {
    next(err);
  }
});

export default router;

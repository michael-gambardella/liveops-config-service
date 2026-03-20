import { Router, Request, Response, NextFunction } from 'express';
import * as auditService from '../services/audit.service';
import { AuditEntityType } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entity_type, entity_id, limit, offset } = req.query;
    const entries = await auditService.getAuditLog({
      entity_type: entity_type as AuditEntityType | undefined,
      entity_id: entity_id as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

export default router;

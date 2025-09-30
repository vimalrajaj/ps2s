import type { Request, Response } from 'express';

import { healthService } from './health.service.js';

export const getHealth = (_req: Request, res: Response) => {
  const payload = healthService.getStatus();

  return res.status(200).json({
    success: true,
    data: payload,
  });
};

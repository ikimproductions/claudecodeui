import express from 'express';

import type { createSystemUpdateService } from './system.service.js';
import { buildWorkspaceConfig } from './workspace-config.js';

/** Creates thin system routes that delegate update execution to the service. */
export function createSystemRouter(
  systemUpdateService: ReturnType<typeof createSystemUpdateService>,
): express.Router {
  const router = express.Router();

  router.post('/update', async (_request, response, next) => {
    try {
      const result = await systemUpdateService.updateSystem();
      response.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      next(error);
    }
  });

  // Runtime workspace config for the client (persona picker); no secrets.
  router.get('/workspace', (_request, response) => {
    response.json(buildWorkspaceConfig(process.env));
  });

  return router;
}

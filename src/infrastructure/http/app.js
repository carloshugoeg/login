import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RegistrationController } from './controllers/RegistrationController.js';
import { UserController } from './controllers/UserController.js';
import { VerificationController } from './controllers/VerificationController.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createRoutes } from './routes/index.js';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');

/** Arma la aplicación Express a partir de los casos de uso ya construidos. */
export function createApp(container, { logger = console } = {}) {
  const app = express();

  app.use(express.json());
  app.use(express.static(PUBLIC_DIR));
  app.use(
    createRoutes({
      registrationController: new RegistrationController(container),
      verificationController: new VerificationController(container),
      userController: new UserController(container),
    }),
  );
  app.use(errorHandler({ logger }));

  return app;
}

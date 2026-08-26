import { Router } from 'express';

export function createRoutes({ registrationController, verificationController, userController }) {
  const router = Router();

  router.post('/api/registrations', registrationController.create);
  router.post('/api/registrations/resend', registrationController.resend);
  router.get('/api/users', userController.index);
  router.get('/verify', verificationController.verify);

  return router;
}

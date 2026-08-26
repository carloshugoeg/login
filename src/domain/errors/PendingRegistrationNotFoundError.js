import { DomainError } from './DomainError.js';

export class PendingRegistrationNotFoundError extends DomainError {
  constructor(email) {
    super(`No hay ningún registro pendiente para ${email}.`, {
      code: 'PENDING_REGISTRATION_NOT_FOUND',
      status: 404,
    });
    this.email = email;
  }
}

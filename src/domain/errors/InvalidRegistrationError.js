import { DomainError } from './DomainError.js';

export class InvalidRegistrationError extends DomainError {
  constructor(fields) {
    super('Los datos del registro no son válidos.', {
      code: 'INVALID_REGISTRATION',
      status: 422,
    });
    this.fields = fields;
  }
}

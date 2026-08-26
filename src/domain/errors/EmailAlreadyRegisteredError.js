import { DomainError } from './DomainError.js';

export class EmailAlreadyRegisteredError extends DomainError {
  constructor(email) {
    super(`Ya existe una cuenta verificada con el correo ${email}.`, {
      code: 'EMAIL_ALREADY_REGISTERED',
      status: 409,
    });
    this.email = email;
  }
}

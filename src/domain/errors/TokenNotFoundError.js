import { DomainError } from './DomainError.js';

export class TokenNotFoundError extends DomainError {
  constructor() {
    super('El código de verificación no es válido o ya fue usado.', {
      code: 'VERIFICATION_CODE_NOT_FOUND',
      status: 404,
    });
  }
}

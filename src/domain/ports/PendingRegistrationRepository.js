import { NotImplementedError } from '../errors/NotImplementedError.js';

/**
 * Almacén de registros a la espera de confirmación.
 * Contrato asíncrono: los llamadores siempre esperan el resultado.
 */
export class PendingRegistrationRepository {
  /** @returns {Promise<import('../entities/PendingRegistration.js').PendingRegistration|null>|import('../entities/PendingRegistration.js').PendingRegistration|null} */
  findByEmail(_email) {
    throw new NotImplementedError(this.constructor.name, 'findByEmail');
  }

  /** @returns {Promise<import('../entities/PendingRegistration.js').PendingRegistration|null>|import('../entities/PendingRegistration.js').PendingRegistration|null} */
  findByVerificationCode(_code) {
    throw new NotImplementedError(this.constructor.name, 'findByVerificationCode');
  }

  /** @returns {Promise<import('../entities/PendingRegistration.js').PendingRegistration>|import('../entities/PendingRegistration.js').PendingRegistration} con id */
  save(_pending) {
    throw new NotImplementedError(this.constructor.name, 'save');
  }

  removeByEmail(_email) {
    throw new NotImplementedError(this.constructor.name, 'removeByEmail');
  }

  removeById(_id) {
    throw new NotImplementedError(this.constructor.name, 'removeById');
  }

  /** @returns {Promise<number>|number} solo lo usan las pruebas y el diagnóstico */
  count() {
    throw new NotImplementedError(this.constructor.name, 'count');
  }
}

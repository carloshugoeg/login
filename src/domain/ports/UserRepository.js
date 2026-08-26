import { NotImplementedError } from '../errors/NotImplementedError.js';

/**
 * Almacén de cuentas verificadas.
 *
 * El contrato es síncrono a propósito: el adaptador SQLite lo es, y así la
 * promoción de pendiente a usuario cabe dentro de una transacción real.
 */
export class UserRepository {
  /** @returns {boolean} */
  existsByEmail(_email) {
    throw new NotImplementedError(this.constructor.name, 'existsByEmail');
  }

  /** @returns {import('../entities/User.js').User} el usuario con su id */
  add(_user) {
    throw new NotImplementedError(this.constructor.name, 'add');
  }

  /** @returns {import('../entities/User.js').User[]} */
  findAll() {
    throw new NotImplementedError(this.constructor.name, 'findAll');
  }
}

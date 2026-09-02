import { NotImplementedError } from '../errors/NotImplementedError.js';

/**
 * Almacén de cuentas verificadas.
 *
 * El contrato es asíncrono (Promise) para no atar el dominio a ningún motor:
 * un adaptador embebido puede resolver al instante y uno cliente-servidor
 * (Postgres, MySQL...) puede ir por la red. Los casos de uso siempre esperan.
 */
export class UserRepository {
  /** @returns {Promise<boolean>|boolean} */
  existsByEmail(_email) {
    throw new NotImplementedError(this.constructor.name, 'existsByEmail');
  }

  /** @returns {Promise<import('../entities/User.js').User>|import('../entities/User.js').User} el usuario con su id */
  add(_user) {
    throw new NotImplementedError(this.constructor.name, 'add');
  }

  /** @returns {Promise<import('../entities/User.js').User[]>|import('../entities/User.js').User[]} */
  findAll() {
    throw new NotImplementedError(this.constructor.name, 'findAll');
  }
}

import { NotImplementedError } from '../errors/NotImplementedError.js';

export class PasswordHasher {
  /** @returns {Promise<string>} */
  async hash(_plainPassword) {
    throw new NotImplementedError(this.constructor.name, 'hash');
  }
}

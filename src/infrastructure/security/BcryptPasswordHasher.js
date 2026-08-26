import bcrypt from 'bcrypt';
import { PasswordHasher } from '../../domain/ports/PasswordHasher.js';

export class BcryptPasswordHasher extends PasswordHasher {
  #rounds;

  constructor({ rounds = 12 } = {}) {
    super();
    this.#rounds = rounds;
  }

  async hash(plainPassword) {
    return bcrypt.hash(plainPassword, this.#rounds);
  }
}

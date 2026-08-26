import { PasswordHasher } from '../../src/domain/ports/PasswordHasher.js';

/** Hash falso y barato: las pruebas unitarias no deben pagar bcrypt. */
export class FakePasswordHasher extends PasswordHasher {
  async hash(plainPassword) {
    return `hashed:${plainPassword}`;
  }
}

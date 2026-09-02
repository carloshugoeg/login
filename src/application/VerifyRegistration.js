import { User } from '../domain/entities/User.js';
import { TokenNotFoundError } from '../domain/errors/TokenNotFoundError.js';

/** Convierte un pendiente en usuario. Es el único camino hacia `users`. */
export class VerifyRegistration {
  #users;
  #pendingRegistrations;
  #transactions;

  constructor({ users, pendingRegistrations, transactions }) {
    this.#users = users;
    this.#pendingRegistrations = pendingRegistrations;
    this.#transactions = transactions;
  }

  async execute(verificationCode) {
    const code = typeof verificationCode === 'string' ? verificationCode : '';
    const pending =
      code === '' ? null : await this.#pendingRegistrations.findByVerificationCode(code);
    if (!pending) throw new TokenNotFoundError();

    // Insertar el usuario y borrar el pendiente son una sola operación:
    // no puede quedar un usuario duplicado ni un pendiente huérfano.
    return this.#transactions.run(async () => {
      const user = await this.#users.add(
        User.fromPendingRegistration(pending, new Date().toISOString()),
      );
      await this.#pendingRegistrations.removeById(pending.id);
      return user;
    });
  }
}

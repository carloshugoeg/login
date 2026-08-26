import { PendingRegistrationNotFoundError } from '../domain/errors/PendingRegistrationNotFoundError.js';

/**
 * Reenvía el correo con el **mismo** código: al no caducar, no hay motivo
 * para invalidar el enlace que la persona quizá ya tenga abierto.
 */
export class ResendVerification {
  #pendingRegistrations;
  #sendVerificationEmail;

  constructor({ pendingRegistrations, sendVerificationEmail }) {
    this.#pendingRegistrations = pendingRegistrations;
    this.#sendVerificationEmail = sendVerificationEmail;
  }

  async execute(rawEmail) {
    const email = String(rawEmail ?? '').trim().toLowerCase();
    const pending = email === '' ? null : this.#pendingRegistrations.findByEmail(email);
    if (!pending) throw new PendingRegistrationNotFoundError(email);

    await this.#sendVerificationEmail.execute(pending);
    return pending;
  }
}

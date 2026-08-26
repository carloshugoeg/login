import { PendingRegistration } from '../domain/entities/PendingRegistration.js';
import { EmailAlreadyRegisteredError } from '../domain/errors/EmailAlreadyRegisteredError.js';
import { InvalidRegistrationError } from '../domain/errors/InvalidRegistrationError.js';

/**
 * Valida los datos, guarda un pendiente y dispara el correo de confirmación.
 * No escribe en `users`: eso solo ocurre al verificar.
 */
export class RegisterUser {
  #rules;
  #users;
  #pendingRegistrations;
  #passwordHasher;
  #codeGenerator;
  #sendVerificationEmail;

  constructor({
    rules,
    users,
    pendingRegistrations,
    passwordHasher,
    codeGenerator,
    sendVerificationEmail,
  }) {
    this.#rules = rules;
    this.#users = users;
    this.#pendingRegistrations = pendingRegistrations;
    this.#passwordHasher = passwordHasher;
    this.#codeGenerator = codeGenerator;
    this.#sendVerificationEmail = sendVerificationEmail;
  }

  async execute(input) {
    const result = this.#rules.validate(input ?? {});
    if (!result.isValid) throw new InvalidRegistrationError(result.errors);

    const email = String(input.email).trim().toLowerCase();
    if (this.#users.existsByEmail(email)) {
      throw new EmailAlreadyRegisteredError(email);
    }

    // Un segundo intento con el mismo correo reemplaza al pendiente anterior
    // y estrena código: el enlace viejo deja de servir.
    this.#pendingRegistrations.removeByEmail(email);

    const pending = new PendingRegistration({
      email,
      firstName: input.firstName,
      lastName: input.lastName,
      age: input.age,
      passwordHash: await this.#passwordHasher.hash(input.password),
      verificationCode: this.#codeGenerator.generate(),
      createdAt: new Date().toISOString(),
    });

    const saved = this.#pendingRegistrations.save(pending);

    try {
      await this.#sendVerificationEmail.execute(saved);
    } catch (error) {
      // Sin correo enviado no hay forma de confirmar: no dejamos basura
      // en la tabla de pendientes bloqueando un reintento.
      this.#pendingRegistrations.removeById(saved.id);
      throw error;
    }
    return saved;
  }
}

/**
 * Registro a la espera de que la persona confirme su correo.
 * Vive en su propia tabla: nunca toca `users` hasta ser validado.
 */
export class PendingRegistration {
  constructor({
    id = null,
    email,
    firstName,
    lastName,
    age,
    passwordHash,
    verificationCode,
    createdAt,
  }) {
    this.id = id;
    this.email = String(email).trim().toLowerCase();
    this.firstName = String(firstName).trim();
    this.lastName = String(lastName).trim();
    this.age = Number(age);
    this.passwordHash = passwordHash;
    this.verificationCode = verificationCode;
    this.createdAt = createdAt;
    Object.freeze(this);
  }

  /** Copia con identidad asignada por el repositorio. */
  withId(id) {
    return new PendingRegistration({ ...this, id });
  }

  /** Copia con un código nuevo, sin mutar la original. */
  withVerificationCode(verificationCode) {
    return new PendingRegistration({ ...this, verificationCode });
  }
}

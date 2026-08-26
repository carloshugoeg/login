/** Cuenta ya confirmada. Solo se construye a partir de un pendiente validado. */
export class User {
  constructor({
    id = null,
    email,
    firstName,
    lastName,
    age,
    passwordHash,
    createdAt,
    verifiedAt,
  }) {
    this.id = id;
    this.email = String(email).trim().toLowerCase();
    this.firstName = String(firstName).trim();
    this.lastName = String(lastName).trim();
    this.age = Number(age);
    this.passwordHash = passwordHash;
    this.createdAt = createdAt;
    this.verifiedAt = verifiedAt;
    Object.freeze(this);
  }

  static fromPendingRegistration(pending, verifiedAt) {
    return new User({
      email: pending.email,
      firstName: pending.firstName,
      lastName: pending.lastName,
      age: pending.age,
      passwordHash: pending.passwordHash,
      createdAt: pending.createdAt,
      verifiedAt,
    });
  }

  withId(id) {
    return new User({ ...this, id });
  }

  /** Representación segura para el exterior: sin el hash de la contraseña. */
  toPublicJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      age: this.age,
      verifiedAt: this.verifiedAt,
    };
  }
}

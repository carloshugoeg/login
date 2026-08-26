import { PendingRegistration } from '../../../domain/entities/PendingRegistration.js';
import { PendingRegistrationRepository } from '../../../domain/ports/PendingRegistrationRepository.js';

export class SqlitePendingRegistrationRepository extends PendingRegistrationRepository {
  #db;

  constructor(db) {
    super();
    this.#db = db;
  }

  findByEmail(email) {
    const row = this.#db
      .prepare('SELECT * FROM pending_registrations WHERE email = ?')
      .get(String(email).trim().toLowerCase());
    return row ? toPending(row) : null;
  }

  findByVerificationCode(code) {
    const row = this.#db
      .prepare('SELECT * FROM pending_registrations WHERE verification_code = ?')
      .get(code);
    return row ? toPending(row) : null;
  }

  save(pending) {
    const info = this.#db
      .prepare(
        `INSERT INTO pending_registrations
           (email, first_name, last_name, age, password_hash, verification_code, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        pending.email,
        pending.firstName,
        pending.lastName,
        pending.age,
        pending.passwordHash,
        pending.verificationCode,
        pending.createdAt,
      );
    return pending.withId(Number(info.lastInsertRowid));
  }

  removeByEmail(email) {
    this.#db
      .prepare('DELETE FROM pending_registrations WHERE email = ?')
      .run(String(email).trim().toLowerCase());
  }

  removeById(id) {
    this.#db.prepare('DELETE FROM pending_registrations WHERE id = ?').run(id);
  }

  count() {
    return this.#db.prepare('SELECT COUNT(*) AS total FROM pending_registrations').get().total;
  }
}

function toPending(row) {
  return new PendingRegistration({
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    age: row.age,
    passwordHash: row.password_hash,
    verificationCode: row.verification_code,
    createdAt: row.created_at,
  });
}

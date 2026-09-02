import { PendingRegistration } from '../../../domain/entities/PendingRegistration.js';
import { PendingRegistrationRepository } from '../../../domain/ports/PendingRegistrationRepository.js';

export class PostgresPendingRegistrationRepository extends PendingRegistrationRepository {
  #db;

  constructor(db) {
    super();
    this.#db = db;
  }

  async findByEmail(email) {
    const { rows } = await this.#db.query('SELECT * FROM pending_registrations WHERE email = $1', [
      String(email).trim().toLowerCase(),
    ]);
    return rows[0] ? toPending(rows[0]) : null;
  }

  async findByVerificationCode(code) {
    const { rows } = await this.#db.query(
      'SELECT * FROM pending_registrations WHERE verification_code = $1',
      [code],
    );
    return rows[0] ? toPending(rows[0]) : null;
  }

  async save(pending) {
    const { rows } = await this.#db.query(
      `INSERT INTO pending_registrations
         (email, first_name, last_name, age, password_hash, verification_code, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        pending.email,
        pending.firstName,
        pending.lastName,
        pending.age,
        pending.passwordHash,
        pending.verificationCode,
        pending.createdAt,
      ],
    );
    return pending.withId(Number(rows[0].id));
  }

  async removeByEmail(email) {
    await this.#db.query('DELETE FROM pending_registrations WHERE email = $1', [
      String(email).trim().toLowerCase(),
    ]);
  }

  async removeById(id) {
    await this.#db.query('DELETE FROM pending_registrations WHERE id = $1', [id]);
  }

  async count() {
    const { rows } = await this.#db.query(
      'SELECT COUNT(*)::int AS total FROM pending_registrations',
    );
    return rows[0].total;
  }
}

function toPending(row) {
  return new PendingRegistration({
    id: Number(row.id),
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    age: row.age,
    passwordHash: row.password_hash,
    verificationCode: row.verification_code,
    createdAt: row.created_at,
  });
}

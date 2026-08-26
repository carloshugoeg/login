import { User } from '../../../domain/entities/User.js';
import { UserRepository } from '../../../domain/ports/UserRepository.js';

export class SqliteUserRepository extends UserRepository {
  #db;

  constructor(db) {
    super();
    this.#db = db;
  }

  existsByEmail(email) {
    const row = this.#db
      .prepare('SELECT 1 AS found FROM users WHERE email = ?')
      .get(String(email).trim().toLowerCase());
    return row !== undefined;
  }

  add(user) {
    const info = this.#db
      .prepare(
        `INSERT INTO users
           (email, first_name, last_name, age, password_hash, created_at, verified_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        user.email,
        user.firstName,
        user.lastName,
        user.age,
        user.passwordHash,
        user.createdAt,
        user.verifiedAt,
      );
    return user.withId(Number(info.lastInsertRowid));
  }

  findAll() {
    return this.#db
      .prepare('SELECT * FROM users ORDER BY verified_at ASC, id ASC')
      .all()
      .map(toUser);
  }
}

function toUser(row) {
  return new User({
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    age: row.age,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    verifiedAt: row.verified_at,
  });
}

import { User } from '../../../domain/entities/User.js';
import { UserRepository } from '../../../domain/ports/UserRepository.js';

export class PostgresUserRepository extends UserRepository {
  #db;

  constructor(db) {
    super();
    this.#db = db;
  }

  async existsByEmail(email) {
    const { rows } = await this.#db.query('SELECT 1 FROM users WHERE email = $1', [
      String(email).trim().toLowerCase(),
    ]);
    return rows.length > 0;
  }

  async add(user) {
    const { rows } = await this.#db.query(
      `INSERT INTO users
         (email, first_name, last_name, age, password_hash, created_at, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        user.email,
        user.firstName,
        user.lastName,
        user.age,
        user.passwordHash,
        user.createdAt,
        user.verifiedAt,
      ],
    );
    return user.withId(Number(rows[0].id));
  }

  async findAll() {
    const { rows } = await this.#db.query(
      'SELECT * FROM users ORDER BY verified_at ASC, id ASC',
    );
    return rows.map(toUser);
  }
}

function toUser(row) {
  return new User({
    id: Number(row.id),
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    age: row.age,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    verifiedAt: row.verified_at,
  });
}

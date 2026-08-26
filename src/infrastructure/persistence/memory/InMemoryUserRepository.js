import { UserRepository } from '../../../domain/ports/UserRepository.js';

/** Adaptador para pruebas: mismo contrato, sin base de datos. */
export class InMemoryUserRepository extends UserRepository {
  #rows = new Map();
  #nextId = 1;

  existsByEmail(email) {
    const normalized = String(email).trim().toLowerCase();
    return [...this.#rows.values()].some((user) => user.email === normalized);
  }

  add(user) {
    const stored = user.withId(this.#nextId++);
    this.#rows.set(stored.id, stored);
    return stored;
  }

  findAll() {
    return [...this.#rows.values()];
  }
}

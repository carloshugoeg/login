import { PendingRegistrationRepository } from '../../../domain/ports/PendingRegistrationRepository.js';

export class InMemoryPendingRegistrationRepository extends PendingRegistrationRepository {
  #rows = new Map();
  #nextId = 1;

  findByEmail(email) {
    const normalized = String(email).trim().toLowerCase();
    return [...this.#rows.values()].find((row) => row.email === normalized) ?? null;
  }

  findByVerificationCode(code) {
    return [...this.#rows.values()].find((row) => row.verificationCode === code) ?? null;
  }

  save(pending) {
    const stored = pending.withId(this.#nextId++);
    this.#rows.set(stored.id, stored);
    return stored;
  }

  removeByEmail(email) {
    const found = this.findByEmail(email);
    if (found) this.#rows.delete(found.id);
  }

  removeById(id) {
    this.#rows.delete(id);
  }

  count() {
    return this.#rows.size;
  }
}

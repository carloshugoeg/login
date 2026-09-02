import { TransactionRunner } from '../../../domain/ports/TransactionRunner.js';

export class SqliteTransactionRunner extends TransactionRunner {
  #db;
  #queue = Promise.resolve();

  constructor(db) {
    super();
    this.#db = db;
  }

  /**
   * BEGIN/COMMIT manual en vez de `db.transaction()`: el work de los casos de
   * uso es async y better-sqlite3 confirmaría antes de que termine. La cola
   * serializa las transacciones para que nunca se aniden en la misma conexión.
   */
  run(work) {
    const task = this.#queue.then(async () => {
      this.#db.exec('BEGIN IMMEDIATE');
      try {
        const result = await work();
        this.#db.exec('COMMIT');
        return result;
      } catch (error) {
        this.#db.exec('ROLLBACK');
        throw error;
      }
    });
    this.#queue = task.then(
      () => {},
      () => {},
    );
    return task;
  }
}

import { TransactionRunner } from '../../../domain/ports/TransactionRunner.js';

export class SqliteTransactionRunner extends TransactionRunner {
  #db;

  constructor(db) {
    super();
    this.#db = db;
  }

  run(work) {
    return this.#db.transaction(work)();
  }
}

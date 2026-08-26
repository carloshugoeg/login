import { TransactionRunner } from '../../../domain/ports/TransactionRunner.js';

/** Sin transacciones reales: en memoria nada puede quedar a medias. */
export class InMemoryTransactionRunner extends TransactionRunner {
  run(work) {
    return work();
  }
}

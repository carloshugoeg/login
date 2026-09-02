import { NotImplementedError } from '../errors/NotImplementedError.js';

/**
 * Ejecuta varias escrituras como una sola unidad atómica.
 *
 * Existe para que `VerifyRegistration` pueda exigir atomicidad sin saber si
 * detrás hay SQLite, otra base de datos o memoria.
 */
export class TransactionRunner {
  /** @param {() => Promise<T>|T} _work @returns {Promise<T>|T} */
  run(_work) {
    throw new NotImplementedError(this.constructor.name, 'run');
  }
}

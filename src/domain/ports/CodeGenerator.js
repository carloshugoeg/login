import { NotImplementedError } from '../errors/NotImplementedError.js';

/** Produce códigos opacos e impredecibles. Nada más. */
export class CodeGenerator {
  /** @returns {string} */
  generate() {
    throw new NotImplementedError(this.constructor.name, 'generate');
  }
}

import { randomBytes } from 'node:crypto';
import { CodeGenerator } from '../../domain/ports/CodeGenerator.js';

/**
 * Código de verificación propio: bytes aleatorios criptográficos en
 * base64url, apto para viajar en una URL sin escaparse.
 */
export class RandomCodeGenerator extends CodeGenerator {
  #byteLength;

  constructor({ byteLength = 32 } = {}) {
    super();
    this.#byteLength = byteLength;
  }

  generate() {
    return randomBytes(this.#byteLength).toString('base64url');
  }
}

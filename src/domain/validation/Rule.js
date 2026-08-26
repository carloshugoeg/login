import { NotImplementedError } from '../errors/NotImplementedError.js';

/**
 * Contrato de una regla de validación.
 *
 * Cada regla comprueba **un** campo con **un** criterio (SRP) y devuelve la
 * lista de mensajes de error, vacía si el dato es correcto. Añadir una regla
 * nueva no obliga a tocar `RuleSet` ni los casos de uso (OCP).
 */
export class Rule {
  /** @returns {string} nombre del campo al que se asocian los mensajes */
  get field() {
    throw new NotImplementedError(this.constructor.name, 'field');
  }

  /** @returns {string[]} mensajes de error; vacío si es válido */
  validate(_input) {
    throw new NotImplementedError(this.constructor.name, 'validate');
  }
}

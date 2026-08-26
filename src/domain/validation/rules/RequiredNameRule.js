import { Rule } from '../Rule.js';

/**
 * Una sola clase configurada dos veces (nombre y apellidos) desde el
 * composition root, en lugar de dos clases casi idénticas.
 */
export class RequiredNameRule extends Rule {
  #field;
  #label;
  #maxLength;

  constructor(field, label, { maxLength = 80 } = {}) {
    super();
    this.#field = field;
    this.#label = label;
    this.#maxLength = maxLength;
  }

  get field() {
    return this.#field;
  }

  validate(input) {
    const raw = input?.[this.#field];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (value === '') return [`${this.#label} es obligatorio.`];
    if (value.length > this.#maxLength) {
      return [`${this.#label} no puede superar ${this.#maxLength} caracteres.`];
    }
    return [];
  }
}

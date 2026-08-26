import { Rule } from '../Rule.js';

export class AgeRangeRule extends Rule {
  #min;
  #max;

  constructor({ min = 13, max = 120 } = {}) {
    super();
    this.#min = min;
    this.#max = max;
  }

  get field() {
    return 'age';
  }

  validate({ age }) {
    if (age === undefined || age === null || age === '') {
      return ['La edad es obligatoria.'];
    }
    const value = typeof age === 'string' ? Number(age.trim()) : Number(age);
    if (!Number.isInteger(value)) return ['La edad debe ser un número entero.'];
    if (value < this.#min || value > this.#max) {
      return [`La edad debe estar entre ${this.#min} y ${this.#max} años.`];
    }
    return [];
  }
}

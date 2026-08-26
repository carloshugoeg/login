import { Rule } from '../Rule.js';

export class PasswordStrengthRule extends Rule {
  #minLength;

  constructor({ minLength = 8 } = {}) {
    super();
    this.#minLength = minLength;
  }

  get field() {
    return 'password';
  }

  validate({ password }) {
    const value = typeof password === 'string' ? password : '';
    const messages = [];
    if (value.length < this.#minLength) {
      messages.push(`La contraseña debe tener al menos ${this.#minLength} caracteres.`);
    }
    if (!/[a-záéíóúñ]/i.test(value)) messages.push('La contraseña debe incluir al menos una letra.');
    if (!/\d/.test(value)) messages.push('La contraseña debe incluir al menos un dígito.');
    return messages;
  }
}

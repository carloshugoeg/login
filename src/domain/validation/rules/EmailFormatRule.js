import { Rule } from '../Rule.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export class EmailFormatRule extends Rule {
  get field() {
    return 'email';
  }

  validate({ email }) {
    const value = typeof email === 'string' ? email.trim() : '';
    if (value === '') return ['El correo electrónico es obligatorio.'];
    if (value.length > 254) return ['El correo electrónico es demasiado largo.'];
    if (!EMAIL_PATTERN.test(value)) return ['El correo electrónico no tiene un formato válido.'];
    return [];
  }
}

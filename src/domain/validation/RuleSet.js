import { ValidationResult } from './ValidationResult.js';

/**
 * Ejecuta las reglas que le inyectan y acumula **todos** los errores:
 * no se detiene en el primer fallo.
 *
 * No conoce ninguna regla concreta, así que sumar una regla nueva es
 * añadirla a la lista del composition root (OCP).
 */
export class RuleSet {
  #rules;

  constructor(rules = []) {
    this.#rules = [...rules];
  }

  validate(input) {
    const errors = {};
    for (const rule of this.#rules) {
      const messages = rule.validate(input);
      if (messages.length > 0) {
        (errors[rule.field] ??= []).push(...messages);
      }
    }
    return new ValidationResult(errors);
  }
}

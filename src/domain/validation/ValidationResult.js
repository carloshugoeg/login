/** Resultado inmutable de validar una entrada: `{ campo: [mensajes] }`. */
export class ValidationResult {
  constructor(errors = {}) {
    this.errors = Object.freeze({ ...errors });
    Object.freeze(this);
  }

  get isValid() {
    return Object.keys(this.errors).length === 0;
  }
}

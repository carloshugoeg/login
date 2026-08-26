/**
 * Raíz de todos los errores esperables del dominio.
 * Lleva `code` y `status` para que la capa HTTP los traduzca sin conocer
 * cada subclase.
 */
export class DomainError extends Error {
  constructor(message, { code, status }) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
  }
}

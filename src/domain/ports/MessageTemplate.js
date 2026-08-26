import { NotImplementedError } from '../errors/NotImplementedError.js';

/** Redacta un mensaje a partir de un contexto. No lo envía. */
export class MessageTemplate {
  /** @returns {{ subject: string, text: string, html: string }} */
  build(_context) {
    throw new NotImplementedError(this.constructor.name, 'build');
  }
}

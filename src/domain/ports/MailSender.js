import { NotImplementedError } from '../errors/NotImplementedError.js';

/**
 * Transporta un mensaje ya redactado.
 *
 * No decide el contenido: eso es trabajo de un `MessageTemplate`.
 * @typedef {{ to: string, subject: string, text: string, html: string }} Message
 */
export class MailSender {
  /** @param {Message} _message @returns {Promise<void>} */
  async send(_message) {
    throw new NotImplementedError(this.constructor.name, 'send');
  }
}

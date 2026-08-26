import { MailSender } from '../../src/domain/ports/MailSender.js';

/** Captura los mensajes en lugar de enviarlos. */
export class FakeMailSender extends MailSender {
  sent = [];

  async send(message) {
    this.sent.push(message);
  }

  get last() {
    return this.sent.at(-1) ?? null;
  }

  /** Extrae el código del enlace del último correo. */
  lastVerificationCode() {
    const match = this.last?.text.match(/[?&]code=([^\s&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

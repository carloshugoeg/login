import { MailSender } from '../../domain/ports/MailSender.js';

/** Transporte por omisión en desarrollo: escribe el mensaje en la terminal. */
export class ConsoleMailSender extends MailSender {
  #output;

  constructor({ output = console } = {}) {
    super();
    this.#output = output;
  }

  async send({ to, subject, text }) {
    this.#output.log(
      [
        '',
        '─'.repeat(72),
        '  CORREO SIMULADO (MAIL_TRANSPORT=console)',
        `  Para:    ${to}`,
        `  Asunto:  ${subject}`,
        '─'.repeat(72),
        text,
        '─'.repeat(72),
        '',
      ].join('\n'),
    );
  }
}

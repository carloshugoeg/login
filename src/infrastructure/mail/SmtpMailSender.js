import nodemailer from 'nodemailer';
import { MailSender } from '../../domain/ports/MailSender.js';

/** Transporte real por SMTP. nodemailer queda encerrado aquí dentro. */
export class SmtpMailSender extends MailSender {
  #transporter;
  #from;

  constructor({ transporter, from }) {
    super();
    this.#transporter = transporter;
    this.#from = from;
  }

  static fromConfig({ host, port, user, password, from }) {
    return new SmtpMailSender({
      from,
      transporter: nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user ? { user, pass: password } : undefined,
      }),
    });
  }

  async send({ to, subject, text, html }) {
    await this.#transporter.sendMail({ from: this.#from, to, subject, text, html });
  }
}

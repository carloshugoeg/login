import { MailSender } from '../../src/domain/ports/MailSender.js';

/** Simula un servidor SMTP que rechaza el envío. */
export class FailingMailSender extends MailSender {
  async send() {
    throw Object.assign(new Error('Invalid login: 535-5.7.8 Username and Password not accepted'), {
      code: 'EAUTH',
    });
  }
}

import { ConsoleMailSender } from './ConsoleMailSender.js';
import { SmtpMailSender } from './SmtpMailSender.js';

/** Elige el transporte según la configuración. Único lugar que lo decide. */
export function createMailSender(env) {
  if (env.mail.transport === 'smtp') {
    return SmtpMailSender.fromConfig({
      host: env.mail.host,
      port: env.mail.port,
      user: env.mail.user,
      password: env.mail.password,
      from: env.mail.from,
    });
  }
  return new ConsoleMailSender();
}

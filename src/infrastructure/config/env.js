import { existsSync } from 'node:fs';

/** Lee la configuración del entorno y falla temprano si falta algo. */
export function loadEnv(source = process.env) {
  if (source === process.env && existsSync('.env')) process.loadEnvFile();

  const transport = (source.MAIL_TRANSPORT ?? 'console').toLowerCase();
  if (!['console', 'smtp'].includes(transport)) {
    throw new Error(`MAIL_TRANSPORT debe ser "console" o "smtp", no "${transport}".`);
  }

  const env = {
    port: Number(source.PORT ?? 3000),
    databasePath: source.DATABASE_PATH ?? './data/app.db',
    baseUrl: source.APP_BASE_URL ?? 'http://localhost:3000',
    bcryptRounds: Number(source.BCRYPT_ROUNDS ?? 12),
    mail: {
      transport,
      from: source.MAIL_FROM ?? 'Registro Lab <no-reply@example.com>',
      host: source.SMTP_HOST,
      port: Number(source.SMTP_PORT ?? 587),
      user: source.SMTP_USER,
      password: source.SMTP_PASSWORD,
    },
  };

  if (transport === 'smtp' && !env.mail.host) {
    throw new Error('MAIL_TRANSPORT=smtp requiere SMTP_HOST.');
  }
  return env;
}

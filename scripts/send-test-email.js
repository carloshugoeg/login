/**
 * Prueba de envío real, sin levantar el servidor:
 *
 *   npm run mail:test -- tu-correo@ejemplo.com
 *
 * Usa exactamente el mismo transporte que la aplicación, así que si esto
 * funciona, el registro también.
 */
import { PendingRegistration } from '../src/domain/entities/PendingRegistration.js';
import { loadEnv } from '../src/infrastructure/config/env.js';
import { createMailSender } from '../src/infrastructure/mail/createMailSender.js';
import { VerificationEmailTemplate } from '../src/infrastructure/mail/templates/VerificationEmailTemplate.js';

const destinatario = process.argv[2];
if (!destinatario) {
  console.error('Uso: npm run mail:test -- tu-correo@ejemplo.com');
  process.exit(1);
}

const env = loadEnv();
console.log(`Transporte: ${env.mail.transport}`);
if (env.mail.transport === 'console') {
  console.error(
    '\nMAIL_TRANSPORT=console: esto solo imprimiría el correo en pantalla.\n' +
      'Pon MAIL_TRANSPORT=smtp y las variables SMTP_* en .env para enviar de verdad.',
  );
  process.exit(1);
}

console.log(`Servidor:   ${env.mail.host}:${env.mail.port}`);
console.log(`Remitente:  ${env.mail.from}`);

const mailSender = createMailSender(env);

try {
  console.log('\nComprobando conexión y credenciales...');
  await mailSender.verify();
  console.log('Conexión correcta.');

  const ejemplo = new PendingRegistration({
    id: 0,
    email: destinatario,
    firstName: 'Prueba',
    lastName: 'De Envío',
    age: 30,
    passwordHash: 'n/a',
    verificationCode: 'CODIGO-DE-PRUEBA',
    createdAt: new Date().toISOString(),
  });
  const message = new VerificationEmailTemplate().build({
    pending: ejemplo,
    verificationUrl: `${env.baseUrl.replace(/\/+$/, '')}/verify?code=CODIGO-DE-PRUEBA`,
  });

  console.log(`Enviando a ${destinatario}...`);
  await mailSender.send({ to: destinatario, ...message });
  console.log('\nEnviado. Revisa la bandeja de entrada (y la carpeta de spam).');
} catch (error) {
  console.error('\nFALLÓ EL ENVÍO\n');
  console.error(`  ${error.message}`);
  console.error(`\n${explicar(error)}`);
  process.exit(1);
}

function explicar(error) {
  const code = error.code ?? '';
  const message = String(error.message ?? '');
  if (code === 'EAUTH' || /Invalid login|Username and Password not accepted/i.test(message)) {
    return [
      'Las credenciales fueron rechazadas.',
      '- Gmail: SMTP_PASSWORD debe ser una CONTRASEÑA DE APLICACIÓN de 16 letras',
      '  (myaccount.google.com/apppasswords), no la contraseña de tu cuenta,',
      '  y requiere tener activada la verificación en dos pasos.',
      '- Revisa que SMTP_USER sea la dirección completa.',
    ].join('\n');
  }
  if (['ETIMEDOUT', 'ECONNECTION', 'ECONNREFUSED', 'EDNS'].includes(code)) {
    return [
      'No se pudo conectar con el servidor SMTP.',
      '- Revisa SMTP_HOST y SMTP_PORT (587 con STARTTLS, o 465 con SSL).',
      '- Puede que tu red bloquee el puerto de salida.',
    ].join('\n');
  }
  if (/from|sender/i.test(message)) {
    return 'El remitente fue rechazado: MAIL_FROM suele tener que coincidir con SMTP_USER.';
  }
  return 'Revisa las variables SMTP_* de tu .env.';
}

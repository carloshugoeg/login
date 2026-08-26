import { MessageTemplate } from '../../../domain/ports/MessageTemplate.js';

/** Redacta el correo de confirmación. No sabe cómo se envía. */
export class VerificationEmailTemplate extends MessageTemplate {
  build({ pending, verificationUrl }) {
    const nombre = pending.firstName;
    return {
      subject: 'Confirma tu cuenta',
      text: [
        `Hola ${nombre}:`,
        '',
        'Para terminar tu registro, abre este enlace:',
        verificationUrl,
        '',
        'Si no fuiste tú, ignora este mensaje: no se creó ninguna cuenta.',
      ].join('\n'),
      html: `
        <p>Hola ${escapeHtml(nombre)}:</p>
        <p>Para terminar tu registro, confirma tu correo:</p>
        <p><a href="${escapeHtml(verificationUrl)}">Confirmar mi cuenta</a></p>
        <p style="color:#666;font-size:14px">
          Si el botón no funciona, copia este enlace:<br>
          ${escapeHtml(verificationUrl)}
        </p>
        <p style="color:#666;font-size:14px">
          Si no fuiste tú, ignora este mensaje: no se creó ninguna cuenta.
        </p>
      `.trim(),
    };
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

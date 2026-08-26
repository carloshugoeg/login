import { DomainError } from './DomainError.js';

/**
 * El correo no se pudo entregar al servidor de salida.
 *
 * Es un error de dominio y no un 500 anónimo porque cambia lo que la
 * persona debe hacer: volver a intentarlo, no reportar un fallo interno.
 */
export class MailDeliveryError extends DomainError {
  constructor(cause) {
    super('No pudimos enviar el correo de confirmación. Inténtalo de nuevo en un momento.', {
      code: 'MAIL_DELIVERY_FAILED',
      status: 502,
    });
    this.cause = cause;
  }
}

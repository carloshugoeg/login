import { TokenNotFoundError } from '../../../domain/errors/TokenNotFoundError.js';
import { renderVerificationError, renderVerificationSuccess } from '../views/verificationPages.js';

/**
 * Responde HTML porque quien abre este enlace viene de su cliente de correo,
 * no de nuestro JavaScript. Por eso atrapa aquí el error en lugar de dejarlo
 * llegar al middleware, que responde JSON.
 */
export class VerificationController {
  #verifyRegistration;

  constructor({ verifyRegistration }) {
    this.#verifyRegistration = verifyRegistration;
    this.verify = this.verify.bind(this);
  }

  verify(req, res) {
    try {
      const user = this.#verifyRegistration.execute(req.query.code);
      res.status(200).type('html').send(renderVerificationSuccess(user));
    } catch (error) {
      if (!(error instanceof TokenNotFoundError)) throw error;
      res.status(404).type('html').send(renderVerificationError(error.message));
    }
  }
}

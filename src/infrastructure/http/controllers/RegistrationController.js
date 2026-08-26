/** Traduce HTTP a casos de uso. No contiene reglas de negocio. */
export class RegistrationController {
  #registerUser;
  #resendVerification;

  constructor({ registerUser, resendVerification }) {
    this.#registerUser = registerUser;
    this.#resendVerification = resendVerification;
    this.create = this.create.bind(this);
    this.resend = this.resend.bind(this);
  }

  async create(req, res) {
    const pending = await this.#registerUser.execute(req.body);
    res.status(202).json({
      message: `Te enviamos un correo a ${pending.email}. Ábrelo para confirmar tu cuenta.`,
      email: pending.email,
    });
  }

  async resend(req, res) {
    const pending = await this.#resendVerification.execute(req.body?.email);
    res.status(202).json({
      message: `Reenviamos el correo de confirmación a ${pending.email}.`,
      email: pending.email,
    });
  }
}

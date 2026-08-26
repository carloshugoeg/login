/**
 * Arma el enlace, pide el mensaje a la plantilla y lo entrega al transporte.
 *
 * Lo usan tanto `RegisterUser` como `ResendVerification`: sin esta pieza los
 * dos casos de uso repetirían la misma lógica de correo.
 */
export class SendVerificationEmail {
  #mailSender;
  #template;
  #baseUrl;

  constructor({ mailSender, template, baseUrl }) {
    this.#mailSender = mailSender;
    this.#template = template;
    this.#baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async execute(pending) {
    const verificationUrl =
      `${this.#baseUrl}/verify?code=${encodeURIComponent(pending.verificationCode)}`;
    const message = this.#template.build({ pending, verificationUrl });
    await this.#mailSender.send({ to: pending.email, ...message });
    return verificationUrl;
  }
}

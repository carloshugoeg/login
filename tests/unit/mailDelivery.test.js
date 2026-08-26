import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RegisterUser } from '../../src/application/RegisterUser.js';
import { ResendVerification } from '../../src/application/ResendVerification.js';
import { SendVerificationEmail } from '../../src/application/SendVerificationEmail.js';
import { MailDeliveryError } from '../../src/domain/errors/MailDeliveryError.js';
import { RuleSet } from '../../src/domain/validation/RuleSet.js';
import { EmailFormatRule } from '../../src/domain/validation/rules/EmailFormatRule.js';
import { VerificationEmailTemplate } from '../../src/infrastructure/mail/templates/VerificationEmailTemplate.js';
import { InMemoryPendingRegistrationRepository } from '../../src/infrastructure/persistence/memory/InMemoryPendingRegistrationRepository.js';
import { InMemoryUserRepository } from '../../src/infrastructure/persistence/memory/InMemoryUserRepository.js';
import { RandomCodeGenerator } from '../../src/infrastructure/security/RandomCodeGenerator.js';
import { FailingMailSender } from '../support/FailingMailSender.js';
import { FakePasswordHasher } from '../support/FakePasswordHasher.js';
import { buildUseCases } from '../support/buildUseCases.js';
import { validInput } from '../support/fixtures.js';

function conCorreoRoto() {
  const users = new InMemoryUserRepository();
  const pendingRegistrations = new InMemoryPendingRegistrationRepository();
  const sendVerificationEmail = new SendVerificationEmail({
    mailSender: new FailingMailSender(),
    template: new VerificationEmailTemplate(),
    baseUrl: 'http://localhost:3000',
  });

  return {
    pendingRegistrations,
    registerUser: new RegisterUser({
      rules: new RuleSet([new EmailFormatRule()]),
      users,
      pendingRegistrations,
      passwordHasher: new FakePasswordHasher(),
      codeGenerator: new RandomCodeGenerator(),
      sendVerificationEmail,
    }),
    resendVerification: new ResendVerification({ pendingRegistrations, sendVerificationEmail }),
  };
}

describe('fallo de entrega del correo', () => {
  it('traduce el fallo del transporte a un error de dominio', async () => {
    const ctx = conCorreoRoto();
    const error = await ctx.registerUser.execute(validInput()).catch((e) => e);

    assert.ok(error instanceof MailDeliveryError);
    assert.equal(error.status, 502);
    assert.equal(error.code, 'MAIL_DELIVERY_FAILED');
    assert.equal(error.cause.code, 'EAUTH', 'conserva la causa original para el log');
  });

  it('no deja un pendiente huérfano si el correo no salió', async () => {
    const ctx = conCorreoRoto();
    await ctx.registerUser.execute(validInput()).catch(() => {});

    assert.equal(ctx.pendingRegistrations.count(), 0, 'el pendiente debe revertirse');
  });

  it('deja reintentar el registro después de un fallo', async () => {
    const ctx = conCorreoRoto();
    await ctx.registerUser.execute(validInput()).catch(() => {});

    // Con un transporte sano el mismo correo vuelve a registrarse sin chocar.
    const sano = buildUseCases();
    const pending = await sano.registerUser.execute(validInput());
    assert.equal(pending.email, 'ana@example.com');
  });

  it('el reenvío también reporta el fallo sin borrar el pendiente', async () => {
    const ctx = conCorreoRoto();
    const sano = buildUseCases();
    const pending = await sano.registerUser.execute(validInput());
    ctx.pendingRegistrations.save(pending);

    const error = await ctx.resendVerification.execute(pending.email).catch((e) => e);

    assert.ok(error instanceof MailDeliveryError);
    assert.equal(ctx.pendingRegistrations.count(), 1, 'un reenvío fallido no borra nada');
  });
});

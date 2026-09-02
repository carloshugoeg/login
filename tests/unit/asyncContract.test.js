import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ListUsers } from '../../src/application/ListUsers.js';
import { RegisterUser } from '../../src/application/RegisterUser.js';
import { SendVerificationEmail } from '../../src/application/SendVerificationEmail.js';
import { VerifyRegistration } from '../../src/application/VerifyRegistration.js';
import { RuleSet } from '../../src/domain/validation/RuleSet.js';
import { EmailFormatRule } from '../../src/domain/validation/rules/EmailFormatRule.js';
import { PasswordStrengthRule } from '../../src/domain/validation/rules/PasswordStrengthRule.js';
import { RequiredNameRule } from '../../src/domain/validation/rules/RequiredNameRule.js';
import { VerificationEmailTemplate } from '../../src/infrastructure/mail/templates/VerificationEmailTemplate.js';
import { InMemoryPendingRegistrationRepository } from '../../src/infrastructure/persistence/memory/InMemoryPendingRegistrationRepository.js';
import { InMemoryTransactionRunner } from '../../src/infrastructure/persistence/memory/InMemoryTransactionRunner.js';
import { InMemoryUserRepository } from '../../src/infrastructure/persistence/memory/InMemoryUserRepository.js';
import { RandomCodeGenerator } from '../../src/infrastructure/security/RandomCodeGenerator.js';
import { FakeMailSender } from '../support/FakeMailSender.js';
import { FakePasswordHasher } from '../support/FakePasswordHasher.js';
import { validInput } from '../support/fixtures.js';

/** Envuelve un adaptador para que cada método devuelva una Promise,
 * como lo haría un motor cliente-servidor (Postgres, MySQL...). */
function asyncify(adapter) {
  return new Proxy(adapter, {
    get(target, prop) {
      const value = target[prop];
      if (typeof value !== 'function') return value;
      return async (...args) => target[prop](...args);
    },
  });
}

function buildAsyncUseCases() {
  const users = asyncify(new InMemoryUserRepository());
  const pendingRegistrations = asyncify(new InMemoryPendingRegistrationRepository());
  const transactions = asyncify(new InMemoryTransactionRunner());
  const mailSender = new FakeMailSender();

  const sendVerificationEmail = new SendVerificationEmail({
    mailSender,
    template: new VerificationEmailTemplate(),
    baseUrl: 'http://localhost:3000',
  });

  const rules = new RuleSet([
    new EmailFormatRule(),
    new RequiredNameRule('firstName', 'El nombre'),
    new RequiredNameRule('lastName', 'Los apellidos'),
    new PasswordStrengthRule(),
  ]);

  return {
    users,
    pendingRegistrations,
    registerUser: new RegisterUser({
      rules,
      users,
      pendingRegistrations,
      passwordHasher: new FakePasswordHasher(),
      codeGenerator: new RandomCodeGenerator(),
      sendVerificationEmail,
    }),
    verifyRegistration: new VerifyRegistration({ users, pendingRegistrations, transactions }),
    listUsers: new ListUsers({ users }),
  };
}

describe('contrato asíncrono de persistencia', () => {
  it('el flujo completo funciona con adaptadores que devuelven Promises', async () => {
    const ctx = buildAsyncUseCases();

    const pending = await ctx.registerUser.execute(validInput());
    assert.equal(await ctx.pendingRegistrations.count(), 1);

    const user = await ctx.verifyRegistration.execute(pending.verificationCode);
    assert.equal(user.email, 'ana@example.com');
    assert.equal(await ctx.pendingRegistrations.count(), 0);

    const listed = await ctx.listUsers.execute();
    assert.equal(listed.length, 1);
  });

  it('un correo nuevo no se confunde con uno ya registrado', async () => {
    // Con adaptadores async, `existsByEmail` devuelve una Promise: si el caso
    // de uso no la espera, la Promise es "truthy" y rechaza a todo el mundo.
    const ctx = buildAsyncUseCases();
    const pending = await ctx.registerUser.execute(validInput());
    assert.ok(pending.verificationCode);
  });
});

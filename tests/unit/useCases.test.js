import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { User } from '../../src/domain/entities/User.js';
import { EmailAlreadyRegisteredError } from '../../src/domain/errors/EmailAlreadyRegisteredError.js';
import { InvalidRegistrationError } from '../../src/domain/errors/InvalidRegistrationError.js';
import { PendingRegistrationNotFoundError } from '../../src/domain/errors/PendingRegistrationNotFoundError.js';
import { TokenNotFoundError } from '../../src/domain/errors/TokenNotFoundError.js';
import { buildUseCases } from '../support/buildUseCases.js';
import { validInput } from '../support/fixtures.js';

let ctx;
beforeEach(() => {
  ctx = buildUseCases();
});

describe('RegisterUser', () => {
  it('guarda un pendiente y NO crea el usuario todavía', async () => {
    await ctx.registerUser.execute(validInput());

    assert.equal(ctx.pendingRegistrations.count(), 1);
    assert.deepEqual(ctx.users.findAll(), []);
  });

  it('envía el correo con un enlace que lleva el código del pendiente', async () => {
    const pending = await ctx.registerUser.execute(validInput());

    assert.equal(ctx.mailSender.sent.length, 1);
    assert.equal(ctx.mailSender.last.to, 'ana@example.com');
    assert.equal(ctx.mailSender.lastVerificationCode(), pending.verificationCode);
  });

  it('nunca guarda ni envía la contraseña en claro', async () => {
    const pending = await ctx.registerUser.execute(validInput({ password: 'secreta123!' }));

    assert.notEqual(pending.passwordHash, 'secreta123!');
    assert.ok(!ctx.mailSender.last.text.includes('secreta123!'));
    assert.ok(!ctx.mailSender.last.html.includes('secreta123!'));
  });

  it('normaliza el correo', async () => {
    const pending = await ctx.registerUser.execute(validInput({ email: '  ANA@Example.COM ' }));
    assert.equal(pending.email, 'ana@example.com');
  });

  it('rechaza datos inválidos con el detalle por campo', async () => {
    const error = await ctx.registerUser.execute({ email: 'nope' }).catch((e) => e);

    assert.ok(error instanceof InvalidRegistrationError);
    assert.equal(error.status, 422);
    assert.ok(error.fields.email);
    assert.equal(ctx.pendingRegistrations.count(), 0);
    assert.equal(ctx.mailSender.sent.length, 0);
  });

  it('rechaza un correo que ya pertenece a una cuenta verificada', async () => {
    ctx.users.add(new User({ ...validInput(), passwordHash: 'x', createdAt: 'a', verifiedAt: 'b' }));

    const error = await ctx.registerUser.execute(validInput()).catch((e) => e);

    assert.ok(error instanceof EmailAlreadyRegisteredError);
    assert.equal(error.status, 409);
  });

  it('reemplaza el pendiente anterior y estrena código', async () => {
    const first = await ctx.registerUser.execute(validInput());
    const second = await ctx.registerUser.execute(validInput());

    assert.equal(ctx.pendingRegistrations.count(), 1);
    assert.notEqual(second.verificationCode, first.verificationCode);
    assert.equal(ctx.pendingRegistrations.findByVerificationCode(first.verificationCode), null);
  });
});

describe('VerifyRegistration', () => {
  it('promueve el pendiente a usuario y lo borra de pendientes', async () => {
    const pending = await ctx.registerUser.execute(validInput());

    const user = await ctx.verifyRegistration.execute(pending.verificationCode);

    assert.equal(user.email, 'ana@example.com');
    assert.ok(user.verifiedAt);
    assert.equal(ctx.pendingRegistrations.count(), 0);
    assert.equal(ctx.users.findAll().length, 1);
  });

  it('conserva el hash de la contraseña al promover', async () => {
    const pending = await ctx.registerUser.execute(validInput());
    const user = await ctx.verifyRegistration.execute(pending.verificationCode);
    assert.equal(user.passwordHash, pending.passwordHash);
  });

  it('rechaza un código desconocido, vacío o ya usado', async () => {
    await assert.rejects(() => ctx.verifyRegistration.execute('inventado'), TokenNotFoundError);
    await assert.rejects(() => ctx.verifyRegistration.execute(''), TokenNotFoundError);
    await assert.rejects(() => ctx.verifyRegistration.execute(undefined), TokenNotFoundError);

    const pending = await ctx.registerUser.execute(validInput());
    await ctx.verifyRegistration.execute(pending.verificationCode);
    await assert.rejects(
      () => ctx.verifyRegistration.execute(pending.verificationCode),
      TokenNotFoundError,
    );
    assert.equal(ctx.users.findAll().length, 1);
  });
});

describe('ResendVerification', () => {
  it('reenvía el mismo código', async () => {
    const pending = await ctx.registerUser.execute(validInput());

    await ctx.resendVerification.execute('ANA@example.com');

    assert.equal(ctx.mailSender.sent.length, 2);
    assert.equal(ctx.mailSender.lastVerificationCode(), pending.verificationCode);
  });

  it('falla si no hay pendiente para ese correo', async () => {
    const error = await ctx.resendVerification.execute('nadie@example.com').catch((e) => e);
    assert.ok(error instanceof PendingRegistrationNotFoundError);
    assert.equal(error.status, 404);
  });
});

describe('ListUsers', () => {
  it('solo lista cuentas verificadas', async () => {
    const pending = await ctx.registerUser.execute(validInput());
    assert.deepEqual(await ctx.listUsers.execute(), []);

    await ctx.verifyRegistration.execute(pending.verificationCode);
    assert.equal((await ctx.listUsers.execute()).length, 1);
  });

  it('la representación pública no expone el hash', async () => {
    const pending = await ctx.registerUser.execute(validInput());
    await ctx.verifyRegistration.execute(pending.verificationCode);

    const [user] = await ctx.listUsers.execute();
    assert.equal(user.toPublicJSON().passwordHash, undefined);
  });
});

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { buildContainer } from '../../src/infrastructure/config/container.js';
import { createApp } from '../../src/infrastructure/http/app.js';
import { createDatabase } from '../../src/infrastructure/persistence/sqlite/Database.js';
import { FakeMailSender } from '../support/FakeMailSender.js';
import { validInput } from '../support/fixtures.js';

const silentLogger = { error() {}, log() {} };

let app, container, mailSender;

beforeEach(() => {
  mailSender = new FakeMailSender();
  container = buildContainer(
    {
      databasePath: ':memory:',
      baseUrl: 'http://localhost:3000',
      bcryptRounds: 4,
      mail: { transport: 'console' },
    },
    { db: createDatabase(':memory:'), mailSender },
  );
  app = createApp(container, { logger: silentLogger });
});

afterEach(() => container.close());

describe('flujo completo de registro', () => {
  it('registrar → confirmar → aparecer en la lista', async () => {
    const registration = await request(app).post('/api/registrations').send(validInput());
    assert.equal(registration.status, 202);
    assert.equal(registration.body.email, 'ana@example.com');

    // Antes de confirmar, la cuenta no existe.
    const before = await request(app).get('/api/users');
    assert.deepEqual(before.body.users, []);

    const code = mailSender.lastVerificationCode();
    assert.ok(code);

    const verification = await request(app).get('/verify').query({ code });
    assert.equal(verification.status, 200);
    assert.match(verification.headers['content-type'], /html/);
    assert.match(verification.text, /Ana/);

    const after = await request(app).get('/api/users');
    assert.equal(after.body.users.length, 1);
    assert.equal(after.body.users[0].email, 'ana@example.com');
    assert.equal(after.body.users[0].passwordHash, undefined);
    assert.equal(container.pendingRegistrations.count(), 0);
  });

  it('un segundo clic en el enlace da error, no un usuario duplicado', async () => {
    await request(app).post('/api/registrations').send(validInput());
    const code = mailSender.lastVerificationCode();

    await request(app).get('/verify').query({ code });
    const second = await request(app).get('/verify').query({ code });

    assert.equal(second.status, 404);
    assert.match(second.text, /no pudimos confirmar/i);

    const users = await request(app).get('/api/users');
    assert.equal(users.body.users.length, 1);
  });

  it('sin código válido no se crea nada', async () => {
    const response = await request(app).get('/verify').query({ code: 'inventado' });
    assert.equal(response.status, 404);

    const users = await request(app).get('/api/users');
    assert.deepEqual(users.body.users, []);
  });

  it('datos inválidos devuelven 422 con los campos afectados', async () => {
    const response = await request(app)
      .post('/api/registrations')
      .send({ email: 'nope', firstName: '', lastName: '', age: 4, password: 'x' });

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'INVALID_REGISTRATION');
    assert.deepEqual(
      Object.keys(response.body.error.fields).sort(),
      ['age', 'email', 'firstName', 'lastName', 'password'],
    );
    assert.equal(mailSender.sent.length, 0);
  });

  it('un correo ya verificado devuelve 409', async () => {
    await request(app).post('/api/registrations').send(validInput());
    await request(app).get('/verify').query({ code: mailSender.lastVerificationCode() });

    const response = await request(app).post('/api/registrations').send(validInput());

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, 'EMAIL_ALREADY_REGISTERED');
  });

  it('reenvía el correo del pendiente y falla si no hay ninguno', async () => {
    await request(app).post('/api/registrations').send(validInput());
    const code = mailSender.lastVerificationCode();

    const resend = await request(app)
      .post('/api/registrations/resend')
      .send({ email: 'ana@example.com' });

    assert.equal(resend.status, 202);
    assert.equal(mailSender.sent.length, 2);
    assert.equal(mailSender.lastVerificationCode(), code);

    const missing = await request(app)
      .post('/api/registrations/resend')
      .send({ email: 'nadie@example.com' });
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error.code, 'PENDING_REGISTRATION_NOT_FOUND');
  });

  it('sirve el formulario en la raíz', async () => {
    const response = await request(app).get('/');
    assert.equal(response.status, 200);
    assert.match(response.text, /registration-form/);
  });
});

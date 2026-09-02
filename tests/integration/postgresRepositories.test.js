import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { after, beforeEach, describe, it } from 'node:test';
import { PendingRegistration } from '../../src/domain/entities/PendingRegistration.js';
import { User } from '../../src/domain/entities/User.js';
import { createPostgresDatabase } from '../../src/infrastructure/persistence/postgres/Database.js';
import { PostgresPendingRegistrationRepository } from '../../src/infrastructure/persistence/postgres/PostgresPendingRegistrationRepository.js';
import { PostgresTransactionRunner } from '../../src/infrastructure/persistence/postgres/PostgresTransactionRunner.js';
import { PostgresUserRepository } from '../../src/infrastructure/persistence/postgres/PostgresUserRepository.js';

// La URL de pruebas vive en .env (TEST_DATABASE_URL). Sin servidor Postgres
// disponible, esta suite se salta en lugar de fallar.
if (existsSync('.env')) process.loadEnvFile();
const databaseUrl = process.env.TEST_DATABASE_URL;

describe('adaptadores Postgres', { skip: !databaseUrl && 'TEST_DATABASE_URL no configurada' }, () => {
  let db, users, pendings, transactions;

  after(async () => {
    await db?.close();
  });

  beforeEach(async () => {
    db ??= await createPostgresDatabase(databaseUrl);
    await db.query('TRUNCATE users, pending_registrations RESTART IDENTITY');
    users = new PostgresUserRepository(db);
    pendings = new PostgresPendingRegistrationRepository(db);
    transactions = new PostgresTransactionRunner(db);
  });

  function pendingFixture(overrides = {}) {
    return new PendingRegistration({
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Pérez',
      age: 30,
      passwordHash: 'hash',
      verificationCode: 'codigo-1',
      createdAt: new Date().toISOString(),
      ...overrides,
    });
  }

  describe('PostgresPendingRegistrationRepository', () => {
    it('guarda, asigna id y recupera por correo y por código', async () => {
      const saved = await pendings.save(pendingFixture());

      assert.ok(Number.isInteger(saved.id));
      assert.equal((await pendings.findByEmail('ANA@example.com')).id, saved.id);
      assert.equal((await pendings.findByVerificationCode('codigo-1')).id, saved.id);
      assert.equal(await pendings.count(), 1);
    });

    it('devuelve null cuando no encuentra nada', async () => {
      assert.equal(await pendings.findByEmail('nadie@example.com'), null);
      assert.equal(await pendings.findByVerificationCode('nada'), null);
    });

    it('borra por correo y por id', async () => {
      await pendings.save(pendingFixture());
      await pendings.removeByEmail('ana@example.com');
      assert.equal(await pendings.count(), 0);

      const saved = await pendings.save(pendingFixture());
      await pendings.removeById(saved.id);
      assert.equal(await pendings.count(), 0);
    });

    it('no admite dos pendientes con el mismo correo', async () => {
      await pendings.save(pendingFixture());
      await assert.rejects(
        () => pendings.save(pendingFixture({ verificationCode: 'codigo-2' })),
        /duplicate|unique/i,
      );
    });
  });

  describe('PostgresUserRepository', () => {
    it('inserta, detecta el correo y lista', async () => {
      const user = await users.add(
        User.fromPendingRegistration(pendingFixture(), new Date().toISOString()),
      );

      assert.ok(Number.isInteger(user.id));
      assert.equal(await users.existsByEmail('ANA@Example.com'), true);
      assert.equal(await users.existsByEmail('otro@example.com'), false);
      const all = await users.findAll();
      assert.equal(all.length, 1);
      assert.equal(all[0].firstName, 'Ana');
    });
  });

  describe('PostgresTransactionRunner', () => {
    it('confirma la promoción como una sola unidad', async () => {
      const pending = await pendings.save(pendingFixture());

      await transactions.run(async () => {
        await users.add(User.fromPendingRegistration(pending, new Date().toISOString()));
        await pendings.removeById(pending.id);
      });

      assert.equal((await users.findAll()).length, 1);
      assert.equal(await pendings.count(), 0);
    });

    it('revierte todo si algo falla a mitad', async () => {
      const pending = await pendings.save(pendingFixture());

      await assert.rejects(() =>
        transactions.run(async () => {
          await users.add(User.fromPendingRegistration(pending, new Date().toISOString()));
          await pendings.removeById(pending.id);
          throw new Error('fallo simulado');
        }),
      );

      assert.equal((await users.findAll()).length, 0, 'el usuario no debe quedar creado');
      assert.equal(await pendings.count(), 1, 'el pendiente debe seguir ahí');
    });
  });
});

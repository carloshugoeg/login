import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, beforeEach, describe, it } from 'node:test';
import { PendingRegistration } from '../../src/domain/entities/PendingRegistration.js';
import { User } from '../../src/domain/entities/User.js';
import { createDatabase } from '../../src/infrastructure/persistence/sqlite/Database.js';
import { SqlitePendingRegistrationRepository } from '../../src/infrastructure/persistence/sqlite/SqlitePendingRegistrationRepository.js';
import { SqliteTransactionRunner } from '../../src/infrastructure/persistence/sqlite/SqliteTransactionRunner.js';
import { SqliteUserRepository } from '../../src/infrastructure/persistence/sqlite/SqliteUserRepository.js';

const dir = mkdtempSync(join(tmpdir(), 'registro-lab-'));
after(() => rmSync(dir, { recursive: true, force: true }));

let db, users, pendings, transactions;
let dbCount = 0;

beforeEach(() => {
  db?.close();
  db = createDatabase(join(dir, `test-${dbCount++}.db`));
  users = new SqliteUserRepository(db);
  pendings = new SqlitePendingRegistrationRepository(db);
  transactions = new SqliteTransactionRunner(db);
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

describe('migraciones', () => {
  it('crea el esquema y es idempotente al reabrir el archivo', () => {
    const path = join(dir, 'idempotente.db');
    createDatabase(path).close();
    const again = createDatabase(path);
    const tables = again
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r) => r.name);
    again.close();
    assert.ok(tables.includes('users'));
    assert.ok(tables.includes('pending_registrations'));
  });
});

describe('SqlitePendingRegistrationRepository', () => {
  it('guarda, asigna id y recupera por correo y por código', () => {
    const saved = pendings.save(pendingFixture());

    assert.ok(Number.isInteger(saved.id));
    assert.equal(pendings.findByEmail('ANA@example.com').id, saved.id);
    assert.equal(pendings.findByVerificationCode('codigo-1').id, saved.id);
    assert.equal(pendings.count(), 1);
  });

  it('devuelve null cuando no encuentra nada', () => {
    assert.equal(pendings.findByEmail('nadie@example.com'), null);
    assert.equal(pendings.findByVerificationCode('nada'), null);
  });

  it('borra por correo y por id', () => {
    pendings.save(pendingFixture());
    pendings.removeByEmail('ana@example.com');
    assert.equal(pendings.count(), 0);

    const saved = pendings.save(pendingFixture());
    pendings.removeById(saved.id);
    assert.equal(pendings.count(), 0);
  });

  it('no admite dos pendientes con el mismo correo', () => {
    pendings.save(pendingFixture());
    assert.throws(() => pendings.save(pendingFixture({ verificationCode: 'codigo-2' })), /UNIQUE/);
  });
});

describe('SqliteUserRepository', () => {
  it('inserta, detecta el correo y lista', () => {
    const user = users.add(
      User.fromPendingRegistration(pendingFixture(), new Date().toISOString()),
    );

    assert.ok(Number.isInteger(user.id));
    assert.ok(users.existsByEmail('ANA@Example.com'));
    assert.equal(users.existsByEmail('otro@example.com'), false);
    assert.equal(users.findAll().length, 1);
    assert.equal(users.findAll()[0].firstName, 'Ana');
  });
});

describe('SqliteTransactionRunner', () => {
  it('confirma la promoción como una sola unidad', () => {
    const pending = pendings.save(pendingFixture());

    transactions.run(() => {
      users.add(User.fromPendingRegistration(pending, new Date().toISOString()));
      pendings.removeById(pending.id);
    });

    assert.equal(users.findAll().length, 1);
    assert.equal(pendings.count(), 0);
  });

  it('revierte todo si algo falla a mitad', () => {
    const pending = pendings.save(pendingFixture());

    assert.throws(() =>
      transactions.run(() => {
        users.add(User.fromPendingRegistration(pending, new Date().toISOString()));
        pendings.removeById(pending.id);
        throw new Error('fallo simulado');
      }),
    );

    assert.equal(users.findAll().length, 0, 'el usuario no debe quedar creado');
    assert.equal(pendings.count(), 1, 'el pendiente debe seguir ahí');
  });
});

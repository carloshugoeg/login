import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import { loadEnv } from '../../src/infrastructure/config/env.js';
import { createPersistence } from '../../src/infrastructure/persistence/createPersistence.js';
import { PostgresUserRepository } from '../../src/infrastructure/persistence/postgres/PostgresUserRepository.js';
import { SqliteUserRepository } from '../../src/infrastructure/persistence/sqlite/SqliteUserRepository.js';

if (existsSync('.env')) process.loadEnvFile();
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

describe('loadEnv (motor de base de datos)', () => {
  it('usa sqlite por defecto para no romper instalaciones existentes', () => {
    const env = loadEnv({});
    assert.equal(env.db.engine, 'sqlite');
  });

  it('rechaza un motor desconocido', () => {
    assert.throws(() => loadEnv({ DB_ENGINE: 'oracle' }), /DB_ENGINE/);
  });

  it('exige DATABASE_URL cuando el motor es postgres', () => {
    assert.throws(() => loadEnv({ DB_ENGINE: 'postgres' }), /DATABASE_URL/);
  });
});

describe('createPersistence', () => {
  it('con sqlite arma los adaptadores sqlite', async () => {
    const env = loadEnv({ DB_ENGINE: 'sqlite', DATABASE_PATH: ':memory:' });
    const persistence = await createPersistence(env);

    assert.ok(persistence.users instanceof SqliteUserRepository);
    await persistence.close();
  });

  it(
    'con postgres arma los adaptadores postgres',
    { skip: !testDatabaseUrl && 'TEST_DATABASE_URL no configurada' },
    async () => {
      const env = loadEnv({ DB_ENGINE: 'postgres', DATABASE_URL: testDatabaseUrl });
      const persistence = await createPersistence(env);

      assert.ok(persistence.users instanceof PostgresUserRepository);
      await persistence.close();
    },
  );
});

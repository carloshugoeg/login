import { createPostgresDatabase } from './postgres/Database.js';
import { PostgresPendingRegistrationRepository } from './postgres/PostgresPendingRegistrationRepository.js';
import { PostgresTransactionRunner } from './postgres/PostgresTransactionRunner.js';
import { PostgresUserRepository } from './postgres/PostgresUserRepository.js';
import { createDatabase } from './sqlite/Database.js';
import { SqlitePendingRegistrationRepository } from './sqlite/SqlitePendingRegistrationRepository.js';
import { SqliteTransactionRunner } from './sqlite/SqliteTransactionRunner.js';
import { SqliteUserRepository } from './sqlite/SqliteUserRepository.js';

/**
 * Elige el motor de persistencia según la configuración. Único lugar que lo
 * decide (como `createMailSender` con el correo): soportar otro motor es
 * añadir una carpeta de adaptadores y un caso aquí, sin tocar dominio ni
 * casos de uso (OCP).
 */
export async function createPersistence(env) {
  switch (env.db.engine) {
    case 'sqlite': {
      const db = createDatabase(env.db.path);
      return {
        users: new SqliteUserRepository(db),
        pendingRegistrations: new SqlitePendingRegistrationRepository(db),
        transactions: new SqliteTransactionRunner(db),
        close: () => db.close(),
      };
    }
    case 'postgres': {
      const db = await createPostgresDatabase(env.db.url);
      return {
        users: new PostgresUserRepository(db),
        pendingRegistrations: new PostgresPendingRegistrationRepository(db),
        transactions: new PostgresTransactionRunner(db),
        close: () => db.close(),
      };
    }
    default:
      throw new Error(`Motor de base de datos no soportado: "${env.db.engine}".`);
  }
}

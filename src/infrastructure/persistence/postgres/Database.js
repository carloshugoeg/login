import { readFileSync, readdirSync } from 'node:fs';
import { AsyncLocalStorage } from 'node:async_hooks';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

/**
 * Abre un pool contra Postgres y deja el esquema al día.
 *
 * `query` enruta cada consulta al cliente de la transacción en curso (si la
 * hay, vía AsyncLocalStorage) o al pool. Así los repositorios participan en
 * transacciones sin saber que existen.
 */
export async function createPostgresDatabase(connectionString) {
  const pool = new pg.Pool({ connectionString });
  const currentClient = new AsyncLocalStorage();

  const db = {
    query(text, params) {
      return (currentClient.getStore() ?? pool).query(text, params);
    },

    async transaction(work) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await currentClient.run(client, work);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    close() {
      return pool.end();
    },
  };

  await migrate(db);
  return db;
}

async function migrate(db) {
  await db.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)',
  );
  const { rows } = await db.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    await db.transaction(async () => {
      await db.query(sql);
      await db.query('INSERT INTO schema_migrations (name, applied_at) VALUES ($1, $2)', [
        file,
        new Date().toISOString(),
      ]);
    });
  }
}

// Подготовка отдельной тестовой базы cineverse_test.
// Основная база cineverse никогда не затрагивается.
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const TEST_DB_NAME = 'cineverse_test';

export async function ensureTestDatabase() {
  const admin = new pg.Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB_NAME]);
    if (rowCount === 0) await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  } finally {
    await admin.end();
  }
}

// Если запущено как скрипт (используется для E2E): создаёт БД, схему и демо-данные
if (process.argv[1] && process.argv[1].endsWith('prepareTestDb.js')) {
  process.env.DB_NAME = TEST_DB_NAME;
  await ensureTestDatabase();
  const { runMigrations } = await import('./migrate.js');
  await runMigrations();
  const { pool } = await import('./pool.js');
  await pool.query('TRUNCATE users, movies, genres RESTART IDENTITY CASCADE');
  // seed.js использует тот же pool и сам закрывает его по окончании
  await import('./seed.js');
}

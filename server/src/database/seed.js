import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import { pool } from './pool.js';

const seedsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seeds');

async function runSqlFile(name) {
  const sql = fs.readFileSync(path.join(seedsDir, name), 'utf8');
  await pool.query(sql);
}

async function createUser(username, email, password, role) {
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (LOWER(email)) DO NOTHING`,
    [username, email, hash, role],
  );
}

async function seed() {
  const { SEED_ADMIN_PASSWORD, SEED_USER_PASSWORD } = process.env;
  if (!SEED_ADMIN_PASSWORD || !SEED_USER_PASSWORD) {
    throw new Error('Задайте SEED_ADMIN_PASSWORD и SEED_USER_PASSWORD в server/.env');
  }

  await runSqlFile('001_genres_movies.sql');

  await createUser('admin', 'admin@cineverse.local', SEED_ADMIN_PASSWORD, 'administrator');
  await createUser('demo', 'demo@cineverse.local', SEED_USER_PASSWORD, 'user');
  for (let i = 1; i <= 4; i++) {
    await createUser(`fan${i}`, `fan${i}@cineverse.local`, SEED_USER_PASSWORD, 'user');
  }

  await runSqlFile('002_demo_ratings.sql');
  await runSqlFile('003_images.sql');

  const { rows } = await pool.query(
    `SELECT (SELECT COUNT(*) FROM movies) AS movies,
            (SELECT COUNT(*) FROM genres) AS genres,
            (SELECT COUNT(*) FROM users)  AS users,
            (SELECT COUNT(*) FROM ratings) AS ratings`,
  );
  console.log('Готово. В базе:', rows[0]);
}

seed()
  .catch((error) => {
    console.error('Ошибка заполнения:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../../src/app.js';
import { runMigrations } from '../../src/database/migrate.js';
import { pool } from '../../src/database/pool.js';

if (process.env.DB_NAME !== 'cineverse_test') {
  throw new Error('Интеграционные тесты должны работать только с БД cineverse_test!');
}

export const api = () => request(app);

// Пересоздаёт данные: схема + жанры/фильмы из seed-файла, пользователей нет
export async function resetDatabase() {
  await runMigrations();
  await pool.query('TRUNCATE users, movies, genres RESTART IDENTITY CASCADE');
  const sql = fs.readFileSync(path.resolve('src/database/seeds/001_genres_movies.sql'), 'utf8');
  await pool.query(sql);
}

export async function closeDatabase() {
  await pool.end();
}

let counter = 0;

// Регистрирует пользователя через API и возвращает { user, token }
export async function registerUser(overrides = {}) {
  counter += 1;
  const data = {
    username: `user${counter}`,
    email: `user${counter}@test.local`,
    password: 'Passw0rdTest',
    passwordConfirm: 'Passw0rdTest',
    ...overrides,
  };
  const res = await api().post('/api/auth/register').send(data);
  return { ...res.body, credentials: data };
}

// Создаёт администратора напрямую в БД и входит через API
export async function createAdmin() {
  counter += 1;
  const email = `admin${counter}@test.local`;
  const hash = await bcrypt.hash('AdminPass123', 4);
  await pool.query(
    "INSERT INTO users (username, email, password_hash, role) VALUES ('admin', $1, $2, 'administrator')",
    [email, hash],
  );
  const res = await api().post('/api/auth/login').send({ email, password: 'AdminPass123' });
  return res.body;
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

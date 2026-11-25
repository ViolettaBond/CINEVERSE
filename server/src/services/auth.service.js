import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { pool } from '../database/pool.js';
import { HttpError } from '../utils/httpError.js';

const PUBLIC_FIELDS =
  'id, username, email, role, avatar, notify_reviews, notify_collections, created_at';

function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export async function registerUser({ username, email, password }) {
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING ${PUBLIC_FIELDS}`,
      [username, email, passwordHash],
    );
    return { user: rows[0], token: createToken(rows[0]) };
  } catch (error) {
    // 23505 — нарушение уникальности (email уже занят)
    if (error.code === '23505') {
      throw new HttpError(409, 'Пользователь с таким email уже существует');
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_FIELDS}, password_hash, status FROM users WHERE LOWER(email) = $1`,
    [email],
  );
  const found = rows[0];

  // Одно и то же сообщение для неверного email и неверного пароля
  const passwordOk = found && (await bcrypt.compare(password, found.password_hash));
  if (!passwordOk) throw new HttpError(401, 'Неверный email или пароль');
  if (found.status === 'blocked') throw new HttpError(403, 'Аккаунт заблокирован');

  const { password_hash, status, ...user } = found;
  return { user, token: createToken(user) };
}

import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { pool } from '../database/pool.js';
import { HttpError } from '../utils/httpError.js';

// Проверяет токен и кладёт пользователя из БД в req.user
export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new HttpError(401, 'Требуется авторизация');
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      throw new HttpError(401, 'Недействительный или просроченный токен');
    }

    // Роль и статус берём из БД, а не из токена: блокировка и смена роли действуют сразу
    const { rows } = await pool.query(
      `SELECT id, username, email, role, status, avatar, notify_reviews, notify_collections, created_at
       FROM users WHERE id = $1`,
      [payload.id],
    );
    const user = rows[0];
    if (!user) throw new HttpError(401, 'Пользователь не найден');
    if (user.status === 'blocked') throw new HttpError(403, 'Аккаунт заблокирован');

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// Пропускает только администраторов. Использовать после authRequired
export function adminRequired(req, res, next) {
  if (req.user?.role !== 'administrator') {
    return next(new HttpError(403, 'Недостаточно прав'));
  }
  next();
}

// Для маршрутов, доступных всем: если токен есть и верный, req.user заполняется, иначе запрос анонимный
export async function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  try {
    const header = req.headers.authorization;
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, config.jwtSecret);
    const { rows } = await pool.query(
      "SELECT id, role FROM users WHERE id = $1 AND status = 'active'",
      [payload.id],
    );
    if (rows[0]) req.user = rows[0];
  } catch {
    // неверный токен на публичном маршруте не считается ошибкой
  }
  next();
}

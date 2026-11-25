import { pool } from '../database/pool.js';
import { HttpError } from '../utils/httpError.js';

// Чистая функция: нужно ли отправлять уведомление этому пользователю
export function shouldNotify(user, type) {
  if (type === 'review') return user.notify_reviews !== false;
  if (type === 'collection') return user.notify_collections !== false;
  return true; // системные уведомления приходят всегда
}

// Создаёт уведомление с учётом настроек пользователя
export async function createNotification(userId, { type = 'system', title, message, link = null }) {
  const { rows } = await pool.query(
    'SELECT notify_reviews, notify_collections FROM users WHERE id = $1',
    [userId],
  );
  if (!rows[0] || !shouldNotify(rows[0], type)) return;

  await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1, $2, $3, $4, $5)',
    [userId, type, title, message, link],
  );
}

export async function getNotifications(userId) {
  const { rows } = await pool.query(
    `SELECT id, type, title, message, link, is_read, created_at
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC, id DESC`,
    [userId],
  );
  return { items: rows, unreadCount: rows.filter((n) => !n.is_read).length };
}

export async function markAsRead(userId, id) {
  const result = await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
    [id, userId],
  );
  if (result.rowCount === 0) throw new HttpError(404, 'Уведомление не найдено');
}

export async function markAllAsRead(userId) {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
}

export async function deleteNotification(userId, id) {
  const result = await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);
  if (result.rowCount === 0) throw new HttpError(404, 'Уведомление не найдено');
}

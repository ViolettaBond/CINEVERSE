import { pool } from '../database/pool.js';
import { HttpError } from '../utils/httpError.js';
import { createNotification } from './notification.service.js';

export async function getUsers() {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.email, u.role, u.status, u.created_at,
            (SELECT COUNT(*)::int FROM reviews r WHERE r.user_id = u.id) AS reviews_count
     FROM users u ORDER BY u.id`,
  );
  return rows;
}

export async function updateUser(adminId, userId, { status, role }) {
  // Администратор не может заблокировать себя или лишить себя прав — иначе система останется без админа
  if (adminId === userId) throw new HttpError(400, 'Нельзя изменить собственную учётную запись');

  const { rows } = await pool.query(
    `UPDATE users SET status = COALESCE($1, status), role = COALESCE($2, role)
     WHERE id = $3 RETURNING id, username, email, role, status, created_at`,
    [status ?? null, role ?? null, userId],
  );
  if (!rows[0]) throw new HttpError(404, 'Пользователь не найден');
  return rows[0];
}

export async function getAllReviews() {
  const { rows } = await pool.query(
    `SELECT r.id, r.text, r.created_at, u.username, m.title AS movie_title, r.movie_id
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     JOIN movies m ON m.id = r.movie_id
     ORDER BY r.created_at DESC, r.id DESC`,
  );
  return rows;
}

export async function deleteReviewAsAdmin(reviewId) {
  const { rows } = await pool.query(
    `DELETE FROM reviews r USING movies m
     WHERE r.id = $1 AND m.id = r.movie_id
     RETURNING r.user_id, m.title`,
    [reviewId],
  );
  if (!rows[0]) throw new HttpError(404, 'Отзыв не найден');

  await createNotification(rows[0].user_id, {
    type: 'system',
    title: 'Отзыв удалён модератором',
    message: `Ваш отзыв на «${rows[0].title}» был удалён администратором.`,
  });
}

export async function getStatistics() {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM users)                           AS users,
       (SELECT COUNT(*)::int FROM movies WHERE type = 'movie')     AS movies,
       (SELECT COUNT(*)::int FROM movies WHERE type = 'series')    AS series,
       (SELECT COUNT(*)::int FROM genres)                          AS genres,
       (SELECT COUNT(*)::int FROM reviews)                         AS reviews,
       (SELECT COUNT(*)::int FROM ratings)                         AS ratings,
       (SELECT COUNT(*)::int FROM collections)                     AS collections`,
  );
  const top = await pool.query(
    `SELECT m.id, m.title, COUNT(f.id)::int AS favorites_count
     FROM movies m JOIN favorites f ON f.movie_id = m.id
     GROUP BY m.id ORDER BY favorites_count DESC, m.title LIMIT 5`,
  );
  return { ...rows[0], topFavorites: top.rows };
}

import { pool } from '../database/pool.js';
import { HttpError } from '../utils/httpError.js';
import { createNotification } from './notification.service.js';

export async function getMovieReviews(movieId) {
  const movie = await pool.query('SELECT 1 FROM movies WHERE id = $1', [movieId]);
  if (movie.rowCount === 0) throw new HttpError(404, 'Фильм не найден');

  const { rows } = await pool.query(
    `SELECT r.id, r.user_id, r.movie_id, r.text, r.created_at, r.updated_at,
            u.username, u.avatar, rt.rating
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN ratings rt ON rt.user_id = r.user_id AND rt.movie_id = r.movie_id
     WHERE r.movie_id = $1
     ORDER BY r.created_at DESC, r.id DESC`,
    [movieId],
  );
  return rows;
}

export async function getMyReviews(userId) {
  const { rows } = await pool.query(
    `SELECT r.id, r.movie_id, r.text, r.created_at, r.updated_at,
            m.title AS movie_title, m.poster_url, rt.rating
     FROM reviews r
     JOIN movies m ON m.id = r.movie_id
     LEFT JOIN ratings rt ON rt.user_id = r.user_id AND rt.movie_id = r.movie_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC, r.id DESC`,
    [userId],
  );
  return rows;
}

export async function createReview(movieId, userId, text) {
  const movie = await pool.query('SELECT title FROM movies WHERE id = $1', [movieId]);
  if (movie.rowCount === 0) throw new HttpError(404, 'Фильм не найден');

  const { rows } = await pool.query(
    `INSERT INTO reviews (user_id, movie_id, text) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, movie_id) DO NOTHING
     RETURNING id, user_id, movie_id, text, created_at, updated_at`,
    [userId, movieId, text],
  );
  if (!rows[0]) {
    throw new HttpError(409, 'Вы уже написали отзыв на этот фильм. Отредактируйте его');
  }

  await createNotification(userId, {
    type: 'review',
    title: 'Отзыв опубликован',
    message: `Ваш отзыв на «${movie.rows[0].title}» опубликован.`,
    link: `/movie/${movieId}`,
  });
  return rows[0];
}

export async function updateReview(reviewId, userId, text) {
  const found = await pool.query('SELECT user_id FROM reviews WHERE id = $1', [reviewId]);
  if (!found.rows[0]) throw new HttpError(404, 'Отзыв не найден');
  if (found.rows[0].user_id !== userId) throw new HttpError(403, 'Нельзя изменить чужой отзыв');

  const { rows } = await pool.query(
    `UPDATE reviews SET text = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, user_id, movie_id, text, created_at, updated_at`,
    [text, reviewId],
  );
  return rows[0];
}

export async function deleteReview(reviewId, userId) {
  const found = await pool.query('SELECT user_id FROM reviews WHERE id = $1', [reviewId]);
  if (!found.rows[0]) throw new HttpError(404, 'Отзыв не найден');
  if (found.rows[0].user_id !== userId) throw new HttpError(403, 'Нельзя удалить чужой отзыв');
  await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
}

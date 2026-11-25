import bcrypt from 'bcrypt';
import { pool } from '../database/pool.js';
import { HttpError } from '../utils/httpError.js';

const PUBLIC_FIELDS =
  'id, username, email, role, avatar, notify_reviews, notify_collections, created_at';

export async function getUserStats(userId) {
  const counts = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM watched w JOIN movies m ON m.id = w.movie_id
         WHERE w.user_id = $1 AND m.type = 'movie')  AS watched_movies,
       (SELECT COUNT(*)::int FROM watched w JOIN movies m ON m.id = w.movie_id
         WHERE w.user_id = $1 AND m.type = 'series') AS watched_series,
       (SELECT COUNT(*)::int FROM reviews WHERE user_id = $1)     AS reviews_count,
       (SELECT COUNT(*)::int FROM collections WHERE user_id = $1) AS collections_count`,
    [userId],
  );

  // Любимые жанры: по фильмам из избранного и просмотренного
  const genres = await pool.query(
    `SELECT g.name, COUNT(*)::int AS count
     FROM (SELECT movie_id FROM favorites WHERE user_id = $1
           UNION ALL
           SELECT movie_id FROM watched WHERE user_id = $1) x
     JOIN movie_genres mg ON mg.movie_id = x.movie_id
     JOIN genres g ON g.id = mg.genre_id
     GROUP BY g.name ORDER BY count DESC, g.name LIMIT 3`,
    [userId],
  );

  const activity = await pool.query(
    `SELECT MAX(at) AS last_activity FROM (
       SELECT created_at AS at FROM favorites WHERE user_id = $1
       UNION ALL SELECT created_at FROM watchlist WHERE user_id = $1
       UNION ALL SELECT watched_at FROM watched WHERE user_id = $1
       UNION ALL SELECT created_at FROM ratings WHERE user_id = $1
       UNION ALL SELECT updated_at FROM reviews WHERE user_id = $1
       UNION ALL SELECT created_at FROM collections WHERE user_id = $1
     ) a`,
    [userId],
  );

  const c = counts.rows[0];
  return {
    watchedMovies: c.watched_movies,
    watchedSeries: c.watched_series,
    reviewsCount: c.reviews_count,
    collectionsCount: c.collections_count,
    favoriteGenres: genres.rows.map((g) => g.name),
    lastActivity: activity.rows[0].last_activity,
  };
}

export async function updateProfile(userId, { username, avatar }) {
  const { rows } = await pool.query(
    `UPDATE users SET username = $1, avatar = $2 WHERE id = $3 RETURNING ${PUBLIC_FIELDS}`,
    [username, avatar, userId],
  );
  return rows[0];
}

export async function updateSettings(userId, { notifyReviews, notifyCollections }) {
  const { rows } = await pool.query(
    `UPDATE users SET notify_reviews = $1, notify_collections = $2 WHERE id = $3
     RETURNING ${PUBLIC_FIELDS}`,
    [notifyReviews, notifyCollections, userId],
  );
  return rows[0];
}

async function requirePassword(userId, password) {
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const ok = rows[0] && (await bcrypt.compare(password, rows[0].password_hash));
  if (!ok) throw new HttpError(400, 'Неверный текущий пароль');
}

export async function changePassword(userId, currentPassword, newPassword) {
  await requirePassword(userId, currentPassword);
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
}

export async function deleteAccount(userId, password) {
  await requirePassword(userId, password);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

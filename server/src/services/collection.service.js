import { pool } from '../database/pool.js';
import { HttpError } from '../utils/httpError.js';
import { MOVIE_WITH_STATS, formatMovie } from './movie.service.js';
import { createNotification } from './notification.service.js';

// Подборка чужого пользователя для вас «не существует»: отвечаем 404, а не 403
async function requireOwnCollection(collectionId, userId) {
  const { rows } = await pool.query(
    `SELECT id, name, description, cover_url, created_at
     FROM collections WHERE id = $1 AND user_id = $2`,
    [collectionId, userId],
  );
  if (!rows[0]) throw new HttpError(404, 'Подборка не найдена');
  return rows[0];
}

export async function getCollections(userId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.description, c.cover_url, c.created_at,
            (SELECT COUNT(*)::int FROM collection_movies cm WHERE cm.collection_id = c.id) AS movies_count
     FROM collections c WHERE c.user_id = $1
     ORDER BY c.created_at DESC, c.id DESC`,
    [userId],
  );
  return rows;
}

export async function createCollection(userId, { name, description, coverUrl }) {
  const { rows } = await pool.query(
    `INSERT INTO collections (user_id, name, description, cover_url)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, description, cover_url, created_at`,
    [userId, name, description, coverUrl],
  );
  await createNotification(userId, {
    type: 'collection',
    title: 'Подборка создана',
    message: `Вы создали подборку «${name}».`,
    link: `/playlists/${rows[0].id}`,
  });
  return { ...rows[0], movies_count: 0 };
}

export async function getCollectionById(collectionId, userId) {
  const collection = await requireOwnCollection(collectionId, userId);
  const { rows } = await pool.query(
    `SELECT t.id, t.title, t.original_title, t.release_year, t.type, t.age_rating,
            t.country, t.poster_url, t.genres, t.rating, t.ratings_count,
            cm.added_at
     FROM collection_movies cm
     JOIN (${MOVIE_WITH_STATS}) t ON t.id = cm.movie_id
     WHERE cm.collection_id = $1
     ORDER BY cm.added_at DESC, t.id`,
    [collectionId],
  );
  return { ...collection, movies: rows.map(formatMovie) };
}

export async function updateCollection(collectionId, userId, { name, description, coverUrl }) {
  await requireOwnCollection(collectionId, userId);
  const { rows } = await pool.query(
    `UPDATE collections SET name = $1, description = $2, cover_url = $3
     WHERE id = $4 AND user_id = $5
     RETURNING id, name, description, cover_url, created_at`,
    [name, description, coverUrl, collectionId, userId],
  );
  return rows[0];
}

export async function deleteCollection(collectionId, userId) {
  await requireOwnCollection(collectionId, userId);
  await pool.query('DELETE FROM collections WHERE id = $1 AND user_id = $2', [collectionId, userId]);
}

export async function addMovieToCollection(collectionId, userId, movieId) {
  await requireOwnCollection(collectionId, userId);
  const movie = await pool.query('SELECT 1 FROM movies WHERE id = $1', [movieId]);
  if (movie.rowCount === 0) throw new HttpError(404, 'Фильм не найден');

  const { rows } = await pool.query(
    `INSERT INTO collection_movies (collection_id, movie_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING RETURNING movie_id, added_at`,
    [collectionId, movieId],
  );
  if (!rows[0]) throw new HttpError(409, 'Фильм уже есть в подборке');
  return rows[0];
}

export async function removeMovieFromCollection(collectionId, userId, movieId) {
  await requireOwnCollection(collectionId, userId);
  const result = await pool.query(
    'DELETE FROM collection_movies WHERE collection_id = $1 AND movie_id = $2',
    [collectionId, movieId],
  );
  if (result.rowCount === 0) throw new HttpError(404, 'Фильма нет в подборке');
}

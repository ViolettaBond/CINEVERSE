import { pool } from '../database/pool.js';
import { HttpError } from '../utils/httpError.js';

async function requireMovie(movieId) {
  const { rowCount } = await pool.query('SELECT 1 FROM movies WHERE id = $1', [movieId]);
  if (rowCount === 0) throw new HttpError(404, 'Фильм не найден');
}

export async function getRatings(movieId, userId) {
  await requireMovie(movieId);
  const { rows } = await pool.query(
    `SELECT ROUND(AVG(rating), 1) AS average, COUNT(*)::int AS count
     FROM ratings WHERE movie_id = $1`,
    [movieId],
  );
  let userRating = null;
  if (userId) {
    const mine = await pool.query('SELECT rating FROM ratings WHERE movie_id = $1 AND user_id = $2', [
      movieId,
      userId,
    ]);
    userRating = mine.rows[0]?.rating ?? null;
  }
  return {
    average: rows[0].average === null ? null : Number(rows[0].average),
    count: rows[0].count,
    userRating,
  };
}

export async function createRating(movieId, userId, rating) {
  await requireMovie(movieId);
  const { rowCount } = await pool.query(
    `INSERT INTO ratings (user_id, movie_id, rating) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, movie_id) DO NOTHING`,
    [userId, movieId, rating],
  );
  if (rowCount === 0) throw new HttpError(409, 'Вы уже оценили этот фильм. Измените оценку через PUT');
  return getRatings(movieId, userId);
}

export async function updateRating(movieId, userId, rating) {
  await requireMovie(movieId);
  const { rowCount } = await pool.query(
    'UPDATE ratings SET rating = $1 WHERE user_id = $2 AND movie_id = $3',
    [rating, userId, movieId],
  );
  if (rowCount === 0) throw new HttpError(404, 'Вы ещё не оценивали этот фильм');
  return getRatings(movieId, userId);
}

import { pool } from '../database/pool.js';
import { HttpError } from '../utils/httpError.js';
import { escapeLike } from '../utils/query.js';
import { MOVIE_WITH_STATS, formatMovie } from './movie.service.js';

// Три личных списка устроены одинаково, различаются таблицей и названием колонки с датой.
// Имена таблиц берутся только отсюда, пользовательский ввод в SQL не попадает.
const LISTS = {
  favorites: { table: 'favorites', dateColumn: 'created_at' },
  watchlist: { table: 'watchlist', dateColumn: 'created_at' },
  watched: { table: 'watched', dateColumn: 'watched_at' },
};

export async function getUserList(listName, userId, { q, sort = 'added', order = 'desc' }) {
  const { table, dateColumn } = LISTS[listName];
  const sortColumns = { added: `l.${dateColumn}`, title: 't.title', year: 't.release_year' };
  const direction = order === 'asc' ? 'ASC' : 'DESC';

  const params = [userId];
  let searchSql = '';
  if (q) {
    params.push(`%${escapeLike(q)}%`);
    searchSql = 'AND (t.title ILIKE $2 OR t.original_title ILIKE $2)';
  }

  const { rows } = await pool.query(
    `SELECT t.id, t.title, t.original_title, t.release_year, t.type, t.age_rating,
            t.country, t.poster_url, t.genres, t.rating, t.ratings_count,
            l.${dateColumn} AS added_at
     FROM ${table} l
     JOIN (${MOVIE_WITH_STATS}) t ON t.id = l.movie_id
     WHERE l.user_id = $1 ${searchSql}
     ORDER BY ${sortColumns[sort]} ${direction}, t.id`,
    params,
  );
  return rows.map(formatMovie);
}

export async function addToUserList(listName, userId, movieId) {
  const { table, dateColumn } = LISTS[listName];

  const movie = await pool.query('SELECT 1 FROM movies WHERE id = $1', [movieId]);
  if (movie.rowCount === 0) throw new HttpError(404, 'Фильм не найден');

  const client = await pool.connect();
  try {
    // Транзакция: добавление в «Просмотренное» и удаление из «Посмотреть позже» — одно целое действие
    await client.query('BEGIN');

    const inserted = await client.query(
      `INSERT INTO ${table} (user_id, movie_id) VALUES ($1, $2)
       ON CONFLICT (user_id, movie_id) DO NOTHING
       RETURNING movie_id, ${dateColumn} AS added_at`,
      [userId, movieId],
    );
    if (inserted.rowCount === 0) throw new HttpError(409, 'Фильм уже есть в этом списке');

    if (listName === 'watched') {
      await client.query('DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2', [userId, movieId]);
    }

    await client.query('COMMIT');
    return inserted.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function removeFromUserList(listName, userId, movieId) {
  const { table } = LISTS[listName];
  const result = await pool.query(`DELETE FROM ${table} WHERE user_id = $1 AND movie_id = $2`, [
    userId,
    movieId,
  ]);
  if (result.rowCount === 0) throw new HttpError(404, 'Фильма нет в этом списке');
}

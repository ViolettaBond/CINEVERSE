import { pool } from '../database/pool.js';
import { HttpError } from '../utils/httpError.js';
import { escapeLike, getPagination, parseIdList } from '../utils/query.js';

// Фильм + жанры + средняя оценка. Из этого запроса собираются и список, и страница фильма
export const MOVIE_WITH_STATS = `
  SELECT m.*,
    COALESCE((SELECT json_agg(json_build_object('id', g.id, 'name', g.name) ORDER BY g.name)
              FROM movie_genres mg JOIN genres g ON g.id = mg.genre_id
              WHERE mg.movie_id = m.id), '[]'::json) AS genres,
    (SELECT ROUND(AVG(r.rating), 1) FROM ratings r WHERE r.movie_id = m.id) AS rating,
    (SELECT COUNT(*)::int FROM ratings r WHERE r.movie_id = m.id) AS ratings_count
  FROM movies m
`;

// Названия колонок берутся только из этого списка — так в ORDER BY не попадёт ввод пользователя
const SORT_COLUMNS = { title: 'title', year: 'release_year', rating: 'rating' };

export function formatMovie(row) {
  return { ...row, rating: row.rating === null ? null : Number(row.rating) };
}

export async function getMovies(filters) {
  const { q, genre, type, yearFrom, yearTo, ratingMin } = filters;
  const sort = filters.sort || 'title';
  const order = filters.order === 'desc' ? 'DESC' : 'ASC';
  const { page, limit, offset } = getPagination(filters.page, filters.limit);

  const where = [];
  const params = [];
  // Добавляет условие; значение уходит в параметр ($1, $2...), а не в текст запроса
  const addCondition = (sql, value) => {
    params.push(value);
    where.push(sql.replaceAll('$?', `$${params.length}`));
  };

  if (q) {
    addCondition('(title ILIKE $? OR original_title ILIKE $?)', `%${escapeLike(q)}%`);
  }
  if (type) addCondition('type = $?', type);
  if (yearFrom) addCondition('release_year >= $?', yearFrom);
  if (yearTo) addCondition('release_year <= $?', yearTo);
  if (ratingMin) addCondition('rating >= $?', ratingMin);
  if (genre) {
    const genreIds = parseIdList(genre);
    addCondition(
      'EXISTS (SELECT 1 FROM movie_genres mg WHERE mg.movie_id = t.id AND mg.genre_id = ANY($?::int[]))',
      genreIds,
    );
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM (${MOVIE_WITH_STATS}) t ${whereSql}`,
    params,
  );
  const total = countResult.rows[0].total;

  const listParams = [...params, limit, offset];
  const { rows } = await pool.query(
    `SELECT t.id, t.title, t.original_title, t.release_year, t.type, t.age_rating,
            t.country, t.poster_url, t.genres, t.rating, t.ratings_count
     FROM (${MOVIE_WITH_STATS}) t
     ${whereSql}
     ORDER BY ${SORT_COLUMNS[sort]} ${order} NULLS LAST, t.id
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    listParams,
  );

  return {
    items: rows.map(formatMovie),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getMovieById(id) {
  const { rows } = await pool.query(`SELECT * FROM (${MOVIE_WITH_STATS}) t WHERE t.id = $1`, [id]);
  if (!rows[0]) throw new HttpError(404, 'Фильм не найден');

  // Похожие: больше всего общих жанров, затем выше рейтинг
  const similar = await pool.query(
    `SELECT t.id, t.title, t.original_title, t.release_year, t.type, t.age_rating,
            t.country, t.poster_url, t.genres, t.rating, t.ratings_count
     FROM (${MOVIE_WITH_STATS}) t
     JOIN (
       SELECT mg2.movie_id, COUNT(*) AS shared
       FROM movie_genres mg1
       JOIN movie_genres mg2 ON mg2.genre_id = mg1.genre_id AND mg2.movie_id <> mg1.movie_id
       WHERE mg1.movie_id = $1
       GROUP BY mg2.movie_id
     ) s ON s.movie_id = t.id
     ORDER BY s.shared DESC, t.rating DESC NULLS LAST, t.id
     LIMIT 6`,
    [id],
  );

  return { ...formatMovie(rows[0]), similar: similar.rows.map(formatMovie) };
}

// ---------- Администрирование каталога ----------

const MOVIE_FIELDS = [
  'title', 'original_title', 'description', 'release_year', 'duration', 'poster_url',
  'backdrop_url', 'type', 'age_rating', 'country', 'director', 'writers', 'cast_list',
];

async function saveGenres(client, movieId, genreIds) {
  await client.query('DELETE FROM movie_genres WHERE movie_id = $1', [movieId]);
  if (genreIds.length === 0) return;
  const found = await client.query('SELECT id FROM genres WHERE id = ANY($1::int[])', [genreIds]);
  if (found.rowCount !== new Set(genreIds).size) throw new HttpError(400, 'Указан несуществующий жанр');
  await client.query(
    'INSERT INTO movie_genres (movie_id, genre_id) SELECT $1, UNNEST($2::int[]) ON CONFLICT DO NOTHING',
    [movieId, genreIds],
  );
}

export async function createMovie(data, genreIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const values = MOVIE_FIELDS.map((field) => data[field] ?? null);
    const placeholders = MOVIE_FIELDS.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await client.query(
      `INSERT INTO movies (${MOVIE_FIELDS.join(', ')}) VALUES (${placeholders}) RETURNING id`,
      values,
    );
    await saveGenres(client, rows[0].id, genreIds);
    await client.query('COMMIT');
    return getMovieById(rows[0].id);
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') throw new HttpError(409, 'Фильм с таким названием и годом уже есть');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateMovie(id, data, genreIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sets = MOVIE_FIELDS.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = MOVIE_FIELDS.map((field) => data[field] ?? null);
    const result = await client.query(`UPDATE movies SET ${sets} WHERE id = $${MOVIE_FIELDS.length + 1}`, [
      ...values,
      id,
    ]);
    if (result.rowCount === 0) throw new HttpError(404, 'Фильм не найден');
    await saveGenres(client, id, genreIds);
    await client.query('COMMIT');
    return getMovieById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') throw new HttpError(409, 'Фильм с таким названием и годом уже есть');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteMovie(id) {
  const result = await pool.query('DELETE FROM movies WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new HttpError(404, 'Фильм не найден');
}

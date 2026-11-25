import { pool } from '../database/pool.js';
import { HttpError } from '../utils/httpError.js';

export async function getGenres() {
  const { rows } = await pool.query('SELECT id, name FROM genres ORDER BY name');
  return rows;
}


function handleDuplicate(error) {
  if (error.code === '23505') throw new HttpError(409, 'Жанр с таким названием уже есть');
  throw error;
}

export async function createGenre(name) {
  try {
    const { rows } = await pool.query('INSERT INTO genres (name) VALUES ($1) RETURNING id, name', [name]);
    return rows[0];
  } catch (error) {
    return handleDuplicate(error);
  }
}

export async function updateGenre(id, name) {
  try {
    const { rows } = await pool.query('UPDATE genres SET name = $1 WHERE id = $2 RETURNING id, name', [name, id]);
    if (!rows[0]) throw new HttpError(404, 'Жанр не найден');
    return rows[0];
  } catch (error) {
    return handleDuplicate(error);
  }
}

export async function deleteGenre(id) {
  const result = await pool.query('DELETE FROM genres WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new HttpError(404, 'Жанр не найден');
}

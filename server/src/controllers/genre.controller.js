import { getGenres } from '../services/genre.service.js';

export async function listGenres(req, res, next) {
  try {
    res.json(await getGenres());
  } catch (error) {
    next(error);
  }
}

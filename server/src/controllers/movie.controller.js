import { matchedData } from 'express-validator';
import { getMovieById, getMovies } from '../services/movie.service.js';

export async function listMovies(req, res, next) {
  try {
    // matchedData возвращает только проверенные и приведённые к нужному типу значения
    const filters = matchedData(req, { locations: ['query'] });
    res.json(await getMovies(filters));
  } catch (error) {
    next(error);
  }
}

export async function getMovie(req, res, next) {
  try {
    const { id } = matchedData(req, { locations: ['params'] });
    res.json(await getMovieById(id));
  } catch (error) {
    next(error);
  }
}

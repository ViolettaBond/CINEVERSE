// Контроллеры принимают запрос, вызывают сервис и формируют ответ.
// В Express 5 ошибки из async-функций автоматически попадают в errorHandler.
import { matchedData } from 'express-validator';
import * as collections from '../services/collection.service.js';
import * as ratings from '../services/rating.service.js';
import * as reviews from '../services/review.service.js';
import * as notifications from '../services/notification.service.js';
import * as users from '../services/user.service.js';
import * as admin from '../services/admin.service.js';
import * as movies from '../services/movie.service.js';
import * as genres from '../services/genre.service.js';
import { emptyToNull } from '../utils/query.js';

const body = (req) => matchedData(req, { locations: ['body'] });
const params = (req) => matchedData(req, { locations: ['params'] });

// ----- Подборки -----
function collectionData(req) {
  const d = body(req);
  return { name: d.name, description: emptyToNull(d.description), coverUrl: emptyToNull(d.coverUrl) };
}
export const collectionController = {
  list: async (req, res) => res.json(await collections.getCollections(req.user.id)),
  create: async (req, res) => res.status(201).json(await collections.createCollection(req.user.id, collectionData(req))),
  get: async (req, res) => res.json(await collections.getCollectionById(params(req).id, req.user.id)),
  update: async (req, res) =>
    res.json(await collections.updateCollection(params(req).id, req.user.id, collectionData(req))),
  remove: async (req, res) => {
    await collections.deleteCollection(params(req).id, req.user.id);
    res.status(204).end();
  },
  addMovie: async (req, res) =>
    res.status(201).json(await collections.addMovieToCollection(params(req).id, req.user.id, body(req).movieId)),
  removeMovie: async (req, res) => {
    const p = params(req);
    await collections.removeMovieFromCollection(p.id, req.user.id, p.movieId);
    res.status(204).end();
  },
};

// ----- Оценки -----
export const ratingController = {
  get: async (req, res) => res.json(await ratings.getRatings(params(req).id, req.user?.id)),
  create: async (req, res) =>
    res.status(201).json(await ratings.createRating(params(req).id, req.user.id, body(req).rating)),
  update: async (req, res) =>
    res.json(await ratings.updateRating(params(req).id, req.user.id, body(req).rating)),
};

// ----- Отзывы -----
export const reviewController = {
  listForMovie: async (req, res) => res.json(await reviews.getMovieReviews(params(req).id)),
  listMine: async (req, res) => res.json(await reviews.getMyReviews(req.user.id)),
  create: async (req, res) =>
    res.status(201).json(await reviews.createReview(params(req).id, req.user.id, body(req).text)),
  update: async (req, res) =>
    res.json(await reviews.updateReview(params(req).id, req.user.id, body(req).text)),
  remove: async (req, res) => {
    await reviews.deleteReview(params(req).id, req.user.id);
    res.status(204).end();
  },
};

// ----- Уведомления -----
export const notificationController = {
  list: async (req, res) => res.json(await notifications.getNotifications(req.user.id)),
  read: async (req, res) => {
    await notifications.markAsRead(req.user.id, params(req).id);
    res.status(204).end();
  },
  readAll: async (req, res) => {
    await notifications.markAllAsRead(req.user.id);
    res.status(204).end();
  },
  remove: async (req, res) => {
    await notifications.deleteNotification(req.user.id, params(req).id);
    res.status(204).end();
  },
};

// ----- Профиль и настройки -----
export const userController = {
  stats: async (req, res) => res.json(await users.getUserStats(req.user.id)),
  updateProfile: async (req, res) => {
    const d = body(req);
    res.json({ user: await users.updateProfile(req.user.id, { username: d.username, avatar: emptyToNull(d.avatar) }) });
  },
  updateSettings: async (req, res) => res.json({ user: await users.updateSettings(req.user.id, body(req)) }),
  changePassword: async (req, res) => {
    const d = body(req);
    await users.changePassword(req.user.id, d.currentPassword, d.newPassword);
    res.status(204).end();
  },
  deleteAccount: async (req, res) => {
    await users.deleteAccount(req.user.id, body(req).password);
    res.status(204).end();
  },
};

// ----- Администрирование -----
function movieData(req) {
  const d = body(req);
  return {
    data: {
      title: d.title,
      original_title: emptyToNull(d.originalTitle),
      description: emptyToNull(d.description),
      release_year: d.releaseYear,
      duration: d.duration ?? null,
      poster_url: emptyToNull(d.posterUrl),
      backdrop_url: emptyToNull(d.backdropUrl),
      type: d.type,
      age_rating: emptyToNull(d.ageRating),
      country: emptyToNull(d.country),
      director: emptyToNull(d.director),
      writers: emptyToNull(d.writers),
      cast_list: emptyToNull(d.castList),
    },
    genreIds: d.genreIds ?? [],
  };
}
export const adminController = {
  users: async (req, res) => res.json(await admin.getUsers()),
  updateUser: async (req, res) => {
    const d = body(req);
    res.json(await admin.updateUser(req.user.id, params(req).id, { status: d.status, role: d.role }));
  },
  statistics: async (req, res) => res.json(await admin.getStatistics()),
  reviews: async (req, res) => res.json(await admin.getAllReviews()),
  removeReview: async (req, res) => {
    await admin.deleteReviewAsAdmin(params(req).id);
    res.status(204).end();
  },
  createMovie: async (req, res) => {
    const { data, genreIds } = movieData(req);
    res.status(201).json(await movies.createMovie(data, genreIds));
  },
  updateMovie: async (req, res) => {
    const { data, genreIds } = movieData(req);
    res.json(await movies.updateMovie(params(req).id, data, genreIds));
  },
  removeMovie: async (req, res) => {
    await movies.deleteMovie(params(req).id);
    res.status(204).end();
  },
  createGenre: async (req, res) => res.status(201).json(await genres.createGenre(body(req).name)),
  updateGenre: async (req, res) => res.json(await genres.updateGenre(params(req).id, body(req).name)),
  removeGenre: async (req, res) => {
    await genres.deleteGenre(params(req).id);
    res.status(204).end();
  },
};

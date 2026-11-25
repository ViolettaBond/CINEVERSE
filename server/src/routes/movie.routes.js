import { Router } from 'express';
import { getMovie, listMovies } from '../controllers/movie.controller.js';
import { adminController, ratingController, reviewController } from '../controllers/index.js';
import { adminRequired, authRequired, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { movieIdRules, movieListRules } from '../validators/movie.validator.js';
import { movieBodyRules, movieUpdateRules } from '../validators/admin.validator.js';
import { ratingRules, movieReviewCreateRules } from '../validators/review.validator.js';

const router = Router();

router.get('/', movieListRules, validate, listMovies);
router.get('/:id', movieIdRules, validate, getMovie);

// Администратор: управление каталогом
router.post('/', authRequired, adminRequired, movieBodyRules, validate, adminController.createMovie);
router.put('/:id', authRequired, adminRequired, movieUpdateRules, validate, adminController.updateMovie);
router.delete('/:id', authRequired, adminRequired, movieIdRules, validate, adminController.removeMovie);

// Оценки фильма
router.get('/:id/ratings', optionalAuth, movieIdRules, validate, ratingController.get);
router.post('/:id/ratings', authRequired, ratingRules, validate, ratingController.create);
router.put('/:id/ratings', authRequired, ratingRules, validate, ratingController.update);

// Отзывы на фильм
router.get('/:id/reviews', movieIdRules, validate, reviewController.listForMovie);
router.post('/:id/reviews', authRequired, movieReviewCreateRules, validate, reviewController.create);

export default router;
